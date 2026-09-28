const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createShared, pack } = require("../electron/shared.cjs");
const {firebase}=require("../electron/account.cjs");
const live=process.argv.includes("--live"), accounts=[]; let createdList;
const db = live ? firebase.databaseURL : "http://127.0.0.1:9005";
const ns = "banrigaming-90820-default-rtdb";
const network = (url, init) => {
  const u = new URL(url);
  if (u.origin === db) u.searchParams.set("ns", ns);
  return fetch(u, init);
};
async function person(name) {
  const r = await fetch(
    live ? "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key="+firebase.apiKey : "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: randomUUID() + "@example.test",
        password: randomUUID(),
        returnSecureToken: true,
      }),
    },
  );
  const data = await r.json();
  assert(data.idToken, JSON.stringify(data));
  const user = { uid: data.localId, displayName: name };
  const account = {
    status: () => ({ state: "connected", user }),
    token: async () => data.idToken,
    events: new EventEmitter(),
    config: { databaseURL: db },
  };
  if(live) accounts.push({account,async cleanup(){for(const route of ["publicProfiles/"+user.uid,"bancycraftDirectory/"+user.uid]){const r=await request(account,route,{method:"DELETE"});if(!r.ok)throw Error("QA profile cleanup failed ("+r.status+").");}const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key="+firebase.apiKey,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:data.idToken})});if(!r.ok)throw Error("QA account cleanup failed ("+r.status+").");}});
  await write(account, "publicProfiles/" + user.uid, {
    uid: user.uid,
    displayName: name,
    updatedAt: Date.now(),
  });
  return account;
}
async function request(account, route, init = {}) {
  return network(
    db + "/" + route + ".json?auth=" + (await account.token()),
    init,
  );
}
async function write(account, route, data) {
  const r = await request(account, route, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  assert(r.ok, route + " " + r.status + " " + (await r.text()));
}
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(test) {
  for (let i = 0; i < 80; i++) {
    if (test()) return;
    await delay(100);
  }
  throw Error("Live update timed out");
}
(async () => {
  const a = await person("Owner Test"),
    b = await person("Friend Test"),
    c = await person("Outsider Test");
  let left, right;
  const owner = createShared(a, (s) => (left = s), { fetch: network }),
    friend = createShared(b, (s) => (right = s), { fetch: network });
  try {
    await Promise.all([owner.reconnect(), friend.reconnect()]);
    await until(() => left.online && right.online);
    const local = {
      id: randomUUID(),
      game: "grounded2",
      name: "Test shared",
      targets: [{ itemId: "test", name: "Test item", quantity: 3 }],
      quick: false,
      useSupplies: false,
      hideCompleted: false,
      recipes: {},
      progress: {"existing:progress":1},
      collapsed: {},
      updatedAt: new Date().toISOString(),
    };
    const id = createdList = await owner.create(local);
    await until(() => left.active);
    assert.equal((await request(c, "bancycraftLists/" + id)).status, 401);
    assert.equal(
      (await network(db + "/bancycraftLists.json?ns=" + ns)).status,
      401,
    );
    await owner.add(id, b.status().user.uid);
    await until(() => right.lists.some((l) => l.id === id));
    await friend.watch(id);
    await until(() => right.active);
    const base = structuredClone(right.active);
    await friend.change(id, base, { ...base, progress: { "craft:/test": 2 } });
    await until(() => left.active?.progress["craft:/test"] === 2);
    assert.equal(
      left.active.activity["craft:/test"].byUid,
      b.status().user.uid,
    );
    const next = structuredClone(left.active);
    await owner.change(id, next, {
      ...next,
      progress: { ...next.progress, "other:row": 3 },
    });
    await until(() => right.active?.progress["other:row"] === 3);
    await assert.rejects(
      friend.change(id, base, { ...base, progress: { "craft:/test": 1 } }),
      /friend changed this row/i,
    );
    const record = await (await request(b, "bancycraftLists/" + id)).json();
    const malformed = structuredClone(record);
    delete malformed.members[a.status().user.uid];
    malformed.memberSlots = [b.status().user.uid];
    assert.equal(
      (
        await request(b, "bancycraftLists/" + id, {
          method: "PUT",
          body: JSON.stringify(malformed),
        })
      ).status,
      401,
    );
    assert.equal(
      (await request(b, "bancycraftLists/" + id, { method: "DELETE" })).status,
      401,
    );
    const spoof = structuredClone(record);
    const key = Buffer.from("craft:/test").toString("base64url");
    spoof.content.progress[key] = 3;
    spoof.activity[key] = {
      byUid: a.status().user.uid,
      at: Date.now(),
      amount: 3,
    };
    assert.equal(
      (
        await request(b, "bancycraftLists/" + id, {
          method: "PUT",
          body: JSON.stringify(spoof),
        })
      ).status,
      401,
    );
    await owner.removeMember(id, b.status().user.uid);
    await until(() => !right.lists.some((l) => l.id === id));
    assert.equal((await request(b, "bancycraftLists/" + id)).status, 401);
    await owner.remove(id);
    console.log(
      (live?"SHARED_PRODUCTION_OK":"SHARED_EMULATOR_OK")+": two authenticated users, live progress and authors, conflict protection, outsider denial, owner-only membership/deletion.",
    );
  } finally {
    owner.close();
    friend.close();
  }
})().finally(async()=>{if(live){if(createdList&&accounts[0]){const owner=createShared(accounts[0].account,()=>{}, {fetch:network});try{await owner.remove(createdList);}catch{}finally{owner.close();}}for(const entry of accounts)await entry.cleanup();console.log("Temporary QA accounts and list records cleaned up.");}}).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
