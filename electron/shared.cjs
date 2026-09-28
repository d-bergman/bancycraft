const { randomUUID } = require("node:crypto");
const { validate } = require("./store.cjs");
const listId = (value) => {
  if (typeof value !== "string" || !/^[a-f0-9-]{36}$/.test(value))
    throw Error("Invalid shared list.");
  return value;
};
const uid = (value) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw Error("Invalid member.");
  return value;
};
const encode = (key) => Buffer.from(key).toString("base64url");
const decode = (key) => Buffer.from(key, "base64url").toString("utf8");
function cleanList(list) {
  return validate({
    schemaVersion: 2,
    game: list?.game,
    plans: [],
    supplies: [],
    lists: [{ ...list, quick: false, useSupplies: false }],
  }).lists[0];
}
function pack(list) {
  const copy = cleanList(list);
  for (const field of ["recipes", "progress", "collapsed", "owned", "assignments"])
    copy[field] = Object.fromEntries(
      Object.entries(copy[field]).map(([key, value]) => [encode(key), value]),
    );
  return copy;
}
function unpack(list) {
  const copy = structuredClone(list);
  for (const field of ["recipes", "progress", "collapsed", "owned", "assignments"])
    copy[field] = Object.fromEntries(
      Object.entries(copy[field] || {}).map(([key, value]) => [
        decode(key),
        value,
      ]),
    );
  return cleanList(copy);
}
function applyStream(tree, event) {
  const keys = event.path.split("/").filter(Boolean);
  if (keys.some((k) => ["__proto__", "prototype", "constructor"].includes(k)))
    throw Error("Invalid stream path.");
  function put(parts, data) {
    if (
      parts.some((k) => ["__proto__", "prototype", "constructor"].includes(k))
    )
      throw Error("Invalid stream path.");
    if (!parts.length) {
      tree = data;
      return;
    }
    if (!tree || typeof tree !== "object") tree = {};
    let node = tree;
    for (const key of parts.slice(0, -1)) {
      if (!node[key] || typeof node[key] !== "object") node[key] = {};
      node = node[key];
    }
    if (data === null) delete node[parts.at(-1)];
    else node[parts.at(-1)] = data;
  }
  if (event.type === "patch")
    for (const [key, value] of Object.entries(event.data || {}))
      put([...keys, ...key.split("/")], value);
  else put(keys, event.data);
  return tree;
}
function mergeChange(record, base, next, author, now = Date.now()) {
  const current = unpack(record.content),
    proposed = cleanList(next),
    previous = cleanList(base);
  if (
    current.id !== previous.id ||
    current.id !== proposed.id ||
    current.game !== proposed.game ||
    current.game !== previous.game
  )
    throw Error("Shared list identity changed.");
  const result = structuredClone(current),
    activity = { ...(record.activity || {}) };
  for (const field of ["name", "targets", "recipes"])
    if (JSON.stringify(previous[field]) !== JSON.stringify(proposed[field])) {
      if (JSON.stringify(current[field]) !== JSON.stringify(previous[field]))
        throw Error(
          "A friend changed this list. Review the latest version and try again.",
        );
      result[field] = proposed[field];
    }
  for (const key of new Set([
    ...Object.keys(previous.progress),
    ...Object.keys(proposed.progress),
  ]))
    if ((previous.progress[key] || 0) !== (proposed.progress[key] || 0)) {
      if ((current.progress[key] || 0) !== (previous.progress[key] || 0))
        throw Error(
          "A friend changed this row. Review their progress and try again.",
        );
      result.progress[key] = proposed.progress[key] || 0;
      activity[encode(key)] = {
        byUid: author,
        at: now,
        amount: result.progress[key],
      };
    }
  for(const field of ['owned','assignments'])for(const key of new Set([...Object.keys(previous[field]||{}),...Object.keys(proposed[field]||{})])){
    const a=previous[field]?.[key],b=proposed[field]?.[key];if(a===b)continue;if(current[field]?.[key]!==a)throw Error('A friend changed this row. Refresh before trying again.');if(field==='assignments'&&b&&!record.members?.[b])throw Error('Assign tasks to list members only.');result[field]||={};if(b===undefined||b==='')delete result[field][key];else result[field][key]=b;
  }
  result.updatedAt = new Date(now).toISOString();
  result.collapsed = {};
  result.hideCompleted = false;
  return { ...record, content: pack(result), activity, updatedAt: now };
}
function createShared(account, onStatus, options = {}) {
  const network = options.fetch || ((...args) => fetch(...args));
  let state = {
      account: account.status(),
      lists: [],
      active: null,
      online: false,
      message: "",
    },
    selected,
    indexClose,
    activeClose,
    activeRetry,
    indexRetry,
    generation = 0;
  const removed=new Map();
  const notify = () => {
    if(state.active) state.lists=state.lists.map(list=>list.id===state.active.id?{...list,name:state.active.name,members:state.active.members.length}:list);
    onStatus(structuredClone(state));
  };
  function user() {
    const result = account.status();
    if (result.state !== "connected" || !result.user)
      throw Error("Connect your website account first.");
    return result.user;
  }
  async function request(route, init = {}) {
    const token = await account.token();
    const url = new URL(account.config.databaseURL + "/" + route + ".json");
    url.searchParams.set("auth", token);
    const response = await network(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: init.signal || AbortSignal.timeout(20000),
    });
    if (!response.ok && response.status !== 412)
      throw Error(
        [401, 403].includes(response.status)
          ? "This shared list is private or your access was removed."
          : "Shared lists are temporarily offline. No changes were saved.",
      );
    return response;
  }
  async function profile(member) {
    const r = await request("publicProfiles/" + uid(member));
    const p = await r.json();
    return {
      uid: member,
      displayName: String(p?.displayName || "Nexus User").slice(0, 32),
    };
  }
  async function present(id, record) {
    if (!record) return null;
    const list = unpack(record.content);
    if (list.id !== id || !record.members?.[user().uid]) return null;
    const members = await Promise.all(Object.keys(record.members).map(profile));
    return {
      ...list,
      ownerUid: record.ownerUid,
      members,
      activity: Object.fromEntries(
        Object.entries(record.activity || {}).map(([key, value]) => [
          decode(key),
          value,
        ]),
      ),
    };
  }
  async function stream(route, change, failure) {
    const abort = new AbortController();
    let stopped = false;
    (async () => {
      let tree = null;
      const response = await request(route, {
        headers: { Accept: "text/event-stream" },
        signal: abort.signal,
      });
      if (stopped) return;
      let buffer = "";
      const decoder = new TextDecoder();
      for await (const chunk of response.body) {
        buffer += decoder
          .decode(chunk, { stream: true })
          .replace(/\r\n/g, "\n");
        if (buffer.length > 4000000)
          throw Error("Shared list exceeds the streaming limit.");
        let split;
        while ((split = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          const type = block.match(/^event: (.+)$/m)?.[1],
            data = block.match(/^data: (.+)$/m)?.[1];
          if (["cancel", "auth_revoked"].includes(type))
            throw Error("Shared access changed.");
          if (["put", "patch"].includes(type) && data) {
            tree = applyStream(tree, { ...JSON.parse(data), type });
            await change(structuredClone(tree));
          }
        }
      }
      if (!stopped) throw Error("Shared connection closed.");
    })().catch((error) => {
      if (!stopped) failure(error);
    });
    return () => {
      stopped = true;
      abort.abort();
    };
  }
  async function loadIndex(index, expected) {
    const currentUid = user().uid;
    const ids = Object.keys(index || {})
      .filter((id) => /^[a-f0-9-]{36}$/.test(id))
      .slice(0, 100);
    const lists = await Promise.all(
      ids.map(async (id) => {
        try {
          const record = await (await request("bancycraftLists/" + id)).json();
          if (!record?.members?.[currentUid]) return null;
          const list = unpack(record.content);
          return {
            id,
            name: list.name,
            game: list.game,
            ownerUid: record.ownerUid,
            members: Object.keys(record.members).length,
          };
        } catch {
          return null;
        }
      }),
    );
    if (expected !== generation) return;
    state.lists = lists.filter(Boolean);
    if (selected && !ids.includes(selected)) await watch(null);
    state.online = true;
    state.message = "";
    notify();
  }
  function stop() {
    indexClose?.();
    activeClose?.();
    clearTimeout(activeRetry);
    clearTimeout(indexRetry);
    indexClose = activeClose = undefined;
  }
  async function watch(id) {
    activeClose?.();
    clearTimeout(activeRetry);
    selected = id ? listId(id) : undefined;
    state.active = null;
    notify();
    if (!selected) return;
    const expected = generation,
      watching = selected;
    activeClose = await stream(
      "bancycraftLists/" + watching,
      async (record) => {
        if (generation !== expected || selected !== watching) return;
        const active = await present(watching, record);
        if (generation !== expected || selected !== watching) return;
        state.active = active;
        state.online = true;
        state.message = state.active
          ? ""
          : "The list was removed or is no longer shared with you.";
        notify();
      },
      () => {
        if (generation !== expected || selected !== watching) return;
        state.online = false;
        state.message = "Live sharing is reconnecting. Wait before editing.";
        notify();
        activeRetry = setTimeout(() => watch(watching).catch(() => {}), 5000);
        activeRetry.unref?.();
      },
    );
  }
  async function reconnect() {
    stop();
    generation++;
    const expected = generation;
    state = {
      account: account.status(),
      lists: [],
      active: null,
      online: false,
      message: "",
    };
    notify();
    if (state.account.state !== "connected") return;
    const me = user();
    try {
      await request("bancycraftDirectory/" + uid(me.uid), {
        method: "PUT",
        body: JSON.stringify({
          displayName: me.displayName,
          displayNameLower: me.displayName.toLowerCase(),
          updatedAt: Date.now(),
        }),
      });
      if (expected !== generation) return;
      indexClose = await stream(
        "bancycraftUserLists/" + uid(me.uid),
        (index) => loadIndex(index, expected),
        () => {
          if (expected !== generation) return;
          state.online = false;
          state.message = "Shared lists are reconnecting…";
          notify();
          indexRetry = setTimeout(() => reconnect().catch(() => {}), 5000);
          indexRetry.unref?.();
        },
      );
      if (selected) await watch(selected);
    } catch {
      state.message =
        "Unable to connect shared lists. Check your connection and reconnect your account.";
      notify();
    }
  }
  async function transaction(id, change) {
    const me = user();
    listId(id);
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request("bancycraftLists/" + id, {
        headers: { "X-Firebase-ETag": "true" },
      });
      const record = await response.json();
      if (!record?.members?.[me.uid])
        throw Error("This list is no longer shared with you.");
      const next = change(record, me);
      const write = await request("bancycraftLists/" + id, {
        method: "PUT",
        headers: { "if-match": response.headers.get("etag") },
        body: JSON.stringify(next),
      });
      if (write.status === 412) continue;
      const saved = await write.json();
      if (selected === id) state.active = await present(id, saved);
      notify();
      return saved;
    }
    throw Error(
      "A friend is updating this list. Try again after their changes arrive.",
    );
  }
  const accountChanged = () => {
    if (state.account.user?.uid !== account.status().user?.uid)
      {selected = undefined;removed.clear();}
    void reconnect().catch(() => {});
  };
  account.events.on("change", accountChanged);
  return {
    status: () => structuredClone(state),
    reconnect,
    watch,
    async create(local) {
      const me = user(),
        id = randomUUID(),
        list = cleanList({
          ...local,assignments:Object.fromEntries(Object.entries(local.assignments||{}).filter(([,member])=>member===me.uid)),
          id,
          quick: false,
          useSupplies: false,
          collapsed: {},
          hideCompleted: false,
        });
      const now = Date.now();
      const record = {
        schemaVersion: 1,
        ownerUid: me.uid,
        members: { [me.uid]: true },
        memberSlots: [me.uid],
        content: pack(list),
        activity: Object.fromEntries(Object.entries(list.progress).map(([key,amount])=>[encode(key),{byUid:me.uid,amount,at:now}])),
        createdAt: now,
        updatedAt: now,
      };
      await request("bancycraftLists/" + id, {
        method: "PUT",
        body: JSON.stringify(record),
      });
      try {
        await request("bancycraftUserLists/" + me.uid + "/" + id, {
          method: "PUT",
          body: "true",
        });
      } catch (error) {
        await request("bancycraftLists/" + id, { method: "DELETE" }).catch(
          () => {},
        );
        throw error;
      }
      await watch(id);
      return id;
    },
    async change(id, base, next) {
      return transaction(id, (record, me) =>
        mergeChange(record, base, next, me.uid),
      );
    },
    async search(text) {
      user();
      if (
        typeof text !== "string" ||
        text.trim().length < 2 ||
        text.length > 32
      )
        throw Error("Enter at least two characters of a display name.");
      const token = await account.token();
      const value = text.trim().toLowerCase();
      const url = new URL(
        account.config.databaseURL + "/bancycraftDirectory.json",
      );
      for (const [key, val] of Object.entries({
        auth: token,
        orderBy: JSON.stringify("displayNameLower"),
        startAt: JSON.stringify(value),
        endAt: JSON.stringify(value + "\uf8ff"),
        limitToFirst: "12",
      }))
        url.searchParams.set(key, val);
      const response = await network(url, {
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw Error("Friend search is unavailable.");
      const results = await response.json();
      return Promise.all(
        Object.keys(results || {})
          .filter((id) => id !== user().uid)
          .map(profile),
      );
    },
    async add(id, member) {
      uid(member);
      const p = await profile(member);
      await transaction(id, (record, me) => {
        if (record.ownerUid !== me.uid)
          throw Error("Only the owner can share this list.");
        if (!record.members[p.uid] && Object.keys(record.members).length >= 16)
          throw Error("A shared list supports up to 16 members.");
        return {
          ...record,
          members: { ...record.members, [p.uid]: true },
          memberSlots: Object.keys({ ...record.members, [p.uid]: true }),
          updatedAt: Date.now(),
        };
      });
      await request("bancycraftUserLists/" + member + "/" + id, {
        method: "PUT",
        body: "true",
      });
    },
    async removeMember(id, member) {
      uid(member);
      await transaction(id, (record, me) => {
        if (record.ownerUid !== me.uid || member === me.uid)
          throw Error("Only the owner can remove another member.");
        const members = { ...record.members };
        delete members[member];
        const content={...record.content,assignments:Object.fromEntries(Object.entries(record.content.assignments||{}).filter(([,assigned])=>assigned!==member))};
        return {
          ...record,
          content,
          members,
          memberSlots: Object.keys(members),
          updatedAt: Date.now(),
        };
      });
      await request("bancycraftUserLists/" + member + "/" + id, {
        method: "DELETE",
      });
    },
    async restoreRemoved(id){
      listId(id);const me=user(),snapshot=removed.get(id);if(!snapshot||snapshot.record.ownerUid!==me.uid||Date.now()-snapshot.at>600000)throw Error('Deletion undo is available to the owner for ten minutes during this session.');
      // A new UUID avoids overwriting another record and does not require read access
      // to a deleted private record. Completion is attributed to the restoring owner.
      const restored=await this.create(unpack(snapshot.record.content));
      for(const member of Object.keys(snapshot.record.members))if(member!==me.uid)await this.add(restored,member);
      const assignments=unpack(snapshot.record.content).assignments||{};
      if(Object.keys(assignments).length)await transaction(restored,record=>({...record,content:{...record.content,assignments:Object.fromEntries(Object.entries(assignments).map(([key,member])=>[encode(key),member]))},updatedAt:Date.now()}));
      removed.delete(id);await watch(restored);return restored;
    },
    async remove(id) {
      const me = user(),
        record = await (await request("bancycraftLists/" + listId(id))).json();
      if (record.ownerUid !== me.uid)
        throw Error("Only the owner can delete a shared list.");
      for (const member of Object.keys(record.members))
        await request("bancycraftUserLists/" + member + "/" + id, {
          method: "DELETE",
        });
      await request("bancycraftLists/" + id, { method: "DELETE" });
      removed.set(id,{record,at:Date.now()});while(removed.size>5)removed.delete(removed.keys().next().value);
      if (selected === id) await watch(null);
    },
    close() {
      stop();
      account.events.removeListener("change", accountChanged);
    },
  };
}
module.exports = { createShared, pack, unpack, applyStream, mergeChange };
