// Packaged UI, native IPC, Windows credential encryption, and two users on local emulators.
const { _electron: electron } = require("@playwright/test");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { randomUUID, randomBytes, createCipheriv } = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  dev = process.argv.includes("--dev"),
  exe = dev
    ? require("electron")
    : path.join(root, "release/win-unpacked/BancyCraft.exe");
const ns = "banrigaming-90820-default-rtdb",
  db = "http://127.0.0.1:9005",
  catalog = require("../src/catalog/data/grounded2.json");
async function user(name) {
  const email = randomUUID() + "@example.test",
    password = randomUUID();
  const r = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await r.json();
  assert(data.idToken);
  const response = await fetch(
    `${db}/publicProfiles/${data.localId}.json?ns=${ns}&auth=${data.idToken}`,
    {
      method: "PUT",
      body: JSON.stringify({
        uid: data.localId,
        displayName: name,
        updatedAt: Date.now(),
      }),
    },
  );
  assert(response.ok);
  return data;
}
async function launch(person, name) {
  const profile = path.join(
    root,
    "test-results",
    `shared-ui-${name}-${Date.now()}`,
  );
  fs.mkdirSync(profile, { recursive: true });
  const item = catalog.items.find((i) => i.name === "Sprig Bow");
  const local = {
    id: randomUUID(),
    name: "Friends workshop",
    game: "grounded2",
    targets: [{ itemId: item.id, name: item.name, quantity: 1 }],
    recipes: {},
    progress: {},
    collapsed: {},
    useSupplies: false,
    hideCompleted: false,
    quick: false,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(profile, "workspace.json"),
    JSON.stringify({
      schemaVersion: 2,
      game: "grounded2",
      plans: [],
      supplies: [],
      lists: [local],
    }),
  );
  const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({
    executablePath: exe,
    args: dev ? [root] : [],
    env,
  });
  const page = await app.firstWindow();
  await page
    .getByRole("heading", { name: "Your next build starts here." })
    .waitFor();
  await app.evaluate(() => {
    const original = global.fetch;
    global.fetch = (input, init) => {
      const u = new URL(input);
      if (u.hostname === "identitytoolkit.googleapis.com")
        ((u.host = "127.0.0.1:9099"),
          (u.protocol = "http:"),
          (u.pathname = "/identitytoolkit.googleapis.com" + u.pathname));
      else if (u.hostname === "securetoken.googleapis.com")
        ((u.host = "127.0.0.1:9099"),
          (u.protocol = "http:"),
          (u.pathname = "/securetoken.googleapis.com" + u.pathname));
      else if (u.hostname === "banrigaming-90820-default-rtdb.firebaseio.com") {
        u.host = "127.0.0.1:9005";
        u.protocol = "http:";
        u.searchParams.set("ns", "banrigaming-90820-default-rtdb");
      }
      return original(u, init);
    };
    process.mainModule.require("electron").shell.openExternal = async (url) => {
      global.testConnectionUrl = url;
    };
  });
  await page.getByRole("button", { name: "Shared Lists", exact: true }).click();
  await page
    .getByRole("button", { name: "Connect to Bancy.gg", exact: true })
    .click();
  const url = await app.evaluate(() => global.testConnectionUrl);
  assert(url.startsWith("https://bancy.gg/bancycraft/connect#"));
  const params = new URLSearchParams(new URL(url).hash.slice(1)),
    request = params.get("request"),
    key = Buffer.from(params.get("key"), "base64url"),
    iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(request));
  const encrypted = Buffer.concat([
    cipher.update(
      JSON.stringify({
        request,
        uid: person.localId,
        idToken: person.idToken,
        refreshToken: person.refreshToken,
      }),
    ),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const r = await fetch(
    `${db}/bancycraftHandoffs/${request}.json?ns=${ns}&auth=${person.idToken}`,
    {
      method: "PUT",
      body: JSON.stringify({
        uid: person.localId,
        iv: iv.toString("base64url"),
        ciphertext: encrypted.toString("base64url"),
        expiresAt: Date.now() + 300000,
      }),
    },
  );
  assert(r.ok);
  await page
    .getByRole("heading", { name: "Share a local list", exact: true })
    .waitFor({ timeout: 15000 });
  assert(fs.existsSync(path.join(profile, "website-account.bin")));
  const encryptedFile = fs.readFileSync(
    path.join(profile, "website-account.bin"),
  );
  assert(
    !encryptedFile.includes(Buffer.from(person.refreshToken)),
    "Refresh credential must be encrypted by Windows",
  );
  assert.equal(
    await page.getByText("Bancy.gg", { exact: true }).count(),
    0,
    "No cipher-only sidebar without an access key",
  );
  return { app, page, local, profile };
}
(async () => {
  let a, b;
  const friendName = "Friend " + Date.now();
  try {
    a = await launch(await user("Darren Test"), "owner");
    b = await launch(await user(friendName), "friend");
    await a.page.getByLabel("Local list to share").selectOption(a.local.id);
    await a.page
      .getByRole("button", { name: "Share list", exact: true })
      .click();
    await a.page
      .getByRole("heading", { name: "People on this list" })
      .waitFor();
    await a.page.getByLabel("Friend display name").fill(friendName);
    await a.page.getByRole("button", { name: "Search people" }).click();
    await a.page
      .getByRole("button", { name: "Add friend", exact: true })
      .click();
    await b.page.getByRole("button", { name: /Friends workshop/ }).click();
    await b.page
      .getByRole("heading", { name: "People on this list" })
      .waitFor();
    const rope = a.page.getByRole("article", {
      name: "Requirement Crude Rope",
      exact: true,
    });
    await rope
      .getByRole("button", { name: "Complete Crude Rope", exact: true })
      .click();
    const other = b.page.getByRole("article", {
      name: "Requirement Crude Rope",
      exact: true,
    });
    await other
      .getByRole("button", { name: "Reset Crude Rope", exact: true })
      .waitFor();
    await other.getByText(/Updated by Darren Test/).waitFor();
    const fiber = b.page.getByRole("article", {
      name: "Requirement Plant Fiber",
      exact: true,
    });
    await fiber.getByText(/satisfied by completed crafts/).waitFor();
    await other
      .getByRole("button", { name: "Reset Crude Rope", exact: true })
      .click();
    await rope
      .getByRole("button", { name: "Complete Crude Rope", exact: true })
      .waitFor();
    await rope.getByText("Reset by " + friendName, { exact: false }).waitFor();
    await a.page.screenshot({
      path: path.join(root, "test-results/shared-lists-desktop.png"),
    });
    await a.app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(1050, 740),
    );
    assert.equal(
      await a.page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await a.page.screenshot({
      path: path.join(root, "test-results/shared-lists-compact.png"),
    });
    await a.page
      .getByRole("button", { name: "Add items", exact: true })
      .click();
    await a.page.getByLabel("Search shared list items").fill("Crude Rope");
    await a.page.getByRole("button", { name: "Add", exact: true }).click();
    await b.page
      .getByRole("button", { name: "Edit target quantities", exact: true })
      .click();
    await b.page.getByLabel("Target quantity for Crude Rope").waitFor();
    await a.page.getByLabel("Delete shopping list").click();
    await a.page
      .getByRole("button", { name: "Delete shared list", exact: true })
      .click();
    await a.page.getByRole("heading", { name: "Share a local list" }).waitFor();
    await b.page.getByRole("heading", { name: "Share a local list" }).waitFor();
    console.log(
      "SHARED_UI_OK: packaged account IPC, Windows-encrypted session, two users, invite/search, live pre-craft propagation/reset and author names, add targets, deletion, compact layout, cipher-gated bank.",
    );
  } catch (e) {
    await a?.page
      .screenshot({
        path: path.join(root, "test-results/shared-ui-failure.png"),
      })
      .catch(() => {});
    throw e;
  } finally {
    await b?.app.close();
    await a?.app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
