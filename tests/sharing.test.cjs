const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes, createCipheriv } = require("node:crypto");
const { decryptHandoff } = require("../electron/account.cjs");
const {
  pack,
  unpack,
  applyStream,
  mergeChange,
} = require("../electron/shared.cjs");
const catalog = require("../src/catalog/data/grounded2.json");
const sets = require("../src/catalog/data/gearsets.json").grounded2;
const icons = require("../src/catalog/data/icons.json").grounded2;
const fs = require("node:fs");
const path = require("node:path");
const list = () => ({
  id: "12345678-1234-1234-1234-123456789012",
  name: "Test",
  game: "grounded2",
  quick: false,
  useSupplies: false,
  hideCompleted: false,
  targets: [{ itemId: "item", name: "Item", quantity: 3 }],
  recipes: { "craft:/test": "recipe" },
  progress: { "craft:/test": 0 },
  collapsed: {},
  updatedAt: new Date().toISOString(),
});
test("encrypted website approval binds account and request and rejects tampering or expiry", () => {
  const key = randomBytes(32),
    nonce = randomBytes(32).toString("hex"),
    iv = randomBytes(12),
    data = {
      request: nonce,
      uid: "person",
      idToken: "id-token",
      refreshToken: "refresh-token",
    },
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(nonce));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data)),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const record = {
    uid: "person",
    iv: iv.toString("base64url"),
    ciphertext: encrypted.toString("base64url"),
    expiresAt: Date.now() + 300000,
  };
  assert.deepEqual(decryptHandoff(record, key, nonce), data);
  assert.throws(() => decryptHandoff(record, key, "wrong-request"));
  assert.throws(() => decryptHandoff({ ...record, expiresAt: 0 }, key, nonce));
  assert.throws(() => decryptHandoff({ ...record, uid: "other" }, key, nonce));
  encrypted[0] ^= 1;
  assert.throws(() =>
    decryptHandoff(
      { ...record, ciphertext: encrypted.toString("base64url") },
      key,
      nonce,
    ),
  );
});
test("shared list encoding round-trips recipe keys and safely applies stream updates", () => {
  const model = list(),
    packed = pack(model);
  assert(!Object.keys(packed.recipes)[0].includes("/"));
  assert.deepEqual(unpack(packed), {...model,owned:{},assignments:{}});
  let tree = applyStream(null, {
    type: "put",
    path: "/",
    data: { progress: { a: 1 } },
  });
  tree = applyStream(tree, {
    type: "patch",
    path: "/",
    data: { "progress/a": 2, "progress/b": 3 },
  });
  assert.deepEqual(tree, { progress: { a: 2, b: 3 } });
  assert.throws(() =>
    applyStream(tree, {
      type: "patch",
      path: "/",
      data: { "__proto__/injected": true },
    }),
  );
  assert.equal({}.injected, undefined);
});
test("shared concurrent edits preserve other rows and reject stale changes to the same row", () => {
  const base = list(),
    record = { content: pack(base) };
  const first = mergeChange(
    record,
    base,
    { ...base, progress: { "craft:/test": 1 } },
    "first",
    1000,
  );
  const merged = mergeChange(
    first,
    base,
    { ...base, progress: { "craft:/test": 0, other: 2 } },
    "second",
    2000,
  );
  assert.deepEqual(unpack(merged.content).progress, {
    "craft:/test": 1,
    other: 2,
  });
  assert.equal(
    merged.activity[Buffer.from("other").toString("base64url")].byUid,
    "second",
  );
  assert.throws(
    () =>
      mergeChange(
        first,
        base,
        { ...base, progress: { "craft:/test": 3 } },
        "second",
      ),
    /friend changed this row/i,
  );
});
test("Grounded 2 has explicit recipes, referenced set items, and local icons", () => {
  assert.equal(catalog.items.length, 1088);
  assert.equal(catalog.recipes.length, 878);
  assert.equal(sets.length, 29);
  const ids = new Set(catalog.items.map((i) => i.id));
  for (const r of catalog.recipes) {
    assert(r.inputs.length);
    assert(r.station);
    for (const entry of [...r.inputs, ...r.outputs]) {
      assert(ids.has(entry.itemId || entry.id));
      assert(Number.isInteger(entry.quantity) && entry.quantity > 0);
    }
  }
  for (const s of sets) for (const id of s.ids) assert(ids.has(id));
  assert.equal(Object.keys(icons).length, 1078);
  for (const [id, url] of Object.entries(icons)) {
    assert(ids.has(id));
    assert(fs.existsSync(path.join(__dirname, "../public", url)));
  }
  assert(catalog.recipes.some((r) => r.station.includes("Spinning")));
});
