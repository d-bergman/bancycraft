// Isolated browser + native handoff test against local Firebase emulators. No production credentials.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createAccount, firebase } = require("../electron/account.cjs");
const root = path.resolve(__dirname, ".."),
  website = path.resolve(root, "../banrigaming.github.io"),
  database = "http://127.0.0.1:9005",
  ns = "banrigaming-90820-default-rtdb";
const network = (input, init) => {
  const url = new URL(input);
  if (url.hostname === "identitytoolkit.googleapis.com")
    ((url.host = "127.0.0.1:9099"),
      (url.protocol = "http:"),
      (url.pathname = "/identitytoolkit.googleapis.com" + url.pathname));
  else if (url.hostname === "securetoken.googleapis.com")
    ((url.host = "127.0.0.1:9099"),
      (url.protocol = "http:"),
      (url.pathname = "/securetoken.googleapis.com" + url.pathname));
  else if (
    url.hostname === new URL(firebase.databaseURL).hostname ||
    url.origin === database
  ) {
    url.host = "127.0.0.1:9005";
    url.protocol = "http:";
    url.searchParams.set("ns", ns);
  }
  return fetch(url, init);
};
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(test) {
  for (let n = 0; n < 100; n++) {
    if (test()) return;
    await delay(100);
  }
  throw Error("Account connection timed out");
}
(async () => {
  const email = randomUUID() + "@example.test",
    password = randomUUID();
  const r = await network(
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" +
      firebase.apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const user = await r.json();
  assert(user.idToken);
  const profileWrite = await network(
    firebase.databaseURL +
      "/publicProfiles/" +
      user.localId +
      ".json?auth=" +
      user.idToken,
    {
      method: "PUT",
      body: JSON.stringify({
        uid: user.localId,
        displayName: "Browser Identity Test",
        updatedAt: Date.now(),
      }),
    },
  );
  assert(profileWrite.ok);
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: [
      "--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,BlockInsecurePrivateNetworkRequests",
    ],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("PAGE", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error("CONSOLE", m.text().slice(0, 400));
  });
  const directory = path.join(root, "test-results", "account-" + Date.now());
  fs.mkdirSync(directory, { recursive: true });
  const safe = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s),
    decryptString: (b) => b.toString(),
  };
  let account;
  try {
    await page.route("https://bancy.gg/**", async (route) => {
      const url = new URL(route.request().url());
      let file = path.join(website, decodeURIComponent(url.pathname));
      if (url.pathname === "/bancycraft/connect")
        file = path.join(website, "bancycraft/connect.html");
      if (!fs.existsSync(file))
        return route.fulfill({ status: 404, body: "Missing fixture" });
      let body = fs.readFileSync(file);
      if (file.endsWith("connect.html")) {
        const bootstrap = `<script type="module">import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';import {getAuth,connectAuthEmulator,signInWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';import {getDatabase,connectDatabaseEmulator} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';import {firebaseConfig} from '/assets/js/firebase-config.js';const app=initializeApp(firebaseConfig);const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectDatabaseEmulator(getDatabase(app),'127.0.0.1',9005);await signInWithEmailAndPassword(auth,${JSON.stringify(email)},${JSON.stringify(password)});await import('/assets/js/bancycraft-connect.js');</script>`;
        body = Buffer.from(
          body
            .toString()
            .replace(
              '<script type="module" src="/assets/js/bancycraft-connect.js"></script>',
              bootstrap,
            ),
        );
      }
      await route.fulfill({
        status: 200,
        body,
        contentType: file.endsWith(".html")
          ? "text/html"
          : file.endsWith(".css")
            ? "text/css"
            : "text/javascript",
      });
    });
    account = createAccount(directory, safe, (url) => page.goto(url), {
      fetch: network,
    });
    await account.connect();
    await page
      .getByRole("heading", { name: "Continue as Browser Identity Test" })
      .waitFor({ timeout: 45000 });
    assert.equal(new URL(page.url()).hash, "");
    await page
      .getByRole("button", {
        name: "Connect this account to BancyCraft",
        exact: true,
      })
      .click();
    await page
      .getByText(
        "Connection approved. Return to BancyCraft; you can close this tab.",
      )
      .waitFor();
    await until(() => account.status().state === "connected");
    assert.equal(account.status().user.uid, user.localId);
    assert.equal(account.status().user.displayName, "Browser Identity Test");
    await account.token();
    assert(fs.existsSync(path.join(directory, "website-account.bin")));
    assert.equal(fs.existsSync(path.join(directory, "workspace.json")), false);
    await page.screenshot({
      path: path.join(root, "test-results/account-browser-approved.png"),
    });
    account.close();
    account = createAccount(directory, safe, async () => {}, {
      fetch: network,
    });
    await account.restore();
    assert.equal(account.status().state, "connected");
    assert.equal(account.status().user.uid, user.localId);
    await account.disconnect();
    assert.equal(account.status().state, "signed-out");
    assert.equal(
      fs.existsSync(path.join(directory, "website-account.bin")),
      false,
    );
    console.log(
      "ACCOUNT_BROWSER_OK: existing browser identity, explicit consent, AES-GCM handoff, project/account verification, refresh restore, disconnect.",
    );
  } catch (error) {
    console.error(
      "Page status:",
      await page
        .locator("#connectStatus")
        .textContent()
        .catch(() => ""),
    );
    await page
      .screenshot({
        path: path.join(root, "test-results/account-browser-failure.png"),
      })
      .catch(() => {});
    throw error;
  } finally {
    account?.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
module.exports = { network };
