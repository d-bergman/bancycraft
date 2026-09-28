const fs = require("node:fs");
const path = require("node:path");
const { randomBytes, createDecipheriv } = require("node:crypto");
const { EventEmitter } = require("node:events");
const firebase = {
  apiKey: "AIzaSyBjsibkscIRbCXzLbBfeXIoIKbU3jZP6nE",
  projectId: "banrigaming-90820",
  databaseURL: "https://banrigaming-90820-default-rtdb.firebaseio.com",
};
function decryptHandoff(record, key, request, now = Date.now()) {
  if (
    !record ||
    record.expiresAt <= now ||
    record.expiresAt > now + 310000 ||
    typeof record.ciphertext !== "string" ||
    record.ciphertext.length > 18000 ||
    !/^[A-Za-z0-9_-]{16}$/.test(record.iv || "")
  )
    throw Error("Invalid or expired authorization.");
  const encrypted = Buffer.from(record.ciphertext, "base64url");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(record.iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(request));
  decipher.setAuthTag(encrypted.subarray(-16));
  const data = JSON.parse(
    Buffer.concat([
      decipher.update(encrypted.subarray(0, -16)),
      decipher.final(),
    ]).toString("utf8"),
  );
  if (
    data.request !== request ||
    data.uid !== record.uid ||
    typeof data.idToken !== "string" ||
    typeof data.refreshToken !== "string" ||
    data.idToken.length > 12000 ||
    data.refreshToken.length > 12000
  )
    throw Error("Authorization does not match this app request.");
  return data;
}
function createAccount(directory, safeStorage, openExternal, options = {}) {
  const network = options.fetch || ((...args) => fetch(...args)),
    config = options.config || firebase;
  const events = new EventEmitter();
  const file = path.join(directory, "website-account.bin");
  let current = {
      state: "signed-out",
      message: "Connect through Bancy.gg to share lists.",
    },
    credentials,
    pending,
    refreshTimer,
    refreshing;
  const emit = (state, message, user) => {
    current = { state, message, ...(user ? { user } : {}) };
    events.emit("change", current);
  };
  async function json(url, init = {}) {
    const r = await network(url, {
      ...init,
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok)
      throw Error(
        "Website authorization could not be verified. Please reconnect.",
      );
    return r.json();
  }
  function persist() {
    if (!safeStorage.isEncryptionAvailable())
      throw Error("Windows credential encryption is unavailable.");
    fs.mkdirSync(directory, { recursive: true });
    const temp = file + ".tmp";
    fs.writeFileSync(
      temp,
      safeStorage.encryptString(
        JSON.stringify({
          uid: credentials.uid,
          refreshToken: credentials.refreshToken,
        }),
      ),
    );
    fs.renameSync(temp, file);
  }
  function schedule() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refresh().catch(() => {}), 45 * 60 * 1000);
    refreshTimer.unref?.();
  }
  async function profile(idToken, uid) {
    const result = await json(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    const user = result.users?.[0];
    if (!user || user.localId !== uid || user.disabled)
      throw Error("The website account could not be verified.");
    const publicProfile = await json(
      `${config.databaseURL}/publicProfiles/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(idToken)}`,
    );
    return {
      uid,
      displayName: String(
        publicProfile?.displayName || user.displayName || "Nexus User",
      ).slice(0, 32),
      email: String(user.email || "").slice(0, 254),
    };
  }
  function refresh() {
    if (!refreshing) {
      const task = performRefresh();
      refreshing = task;
      task
        .finally(() => {
          if (refreshing === task) refreshing = undefined;
        })
        .catch(() => {});
    }
    return refreshing;
  }
  async function performRefresh() {
    if (!credentials) throw Error("Connect your website account first.");
    const expectedCredential = credentials,
      expected = credentials.uid;
    try {
      const data = await json(
        `https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: credentials.refreshToken,
          }).toString(),
        },
      );
      if (data.user_id !== expected)
        throw Error("Website account changed; reconnect.");
      const user = await profile(data.id_token, expected);
      if (credentials !== expectedCredential)
        throw Error("Authorization canceled.");
      credentials = {
        uid: expected,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        expiresAt: Date.now() + Number(data.expires_in) * 1000,
      };
      persist();
      emit("connected", "Connected to Bancy.gg.", user);
      schedule();
      return credentials.idToken;
    } catch (e) {
      if (credentials !== expectedCredential) throw e;
      emit(
        "offline",
        "Your website session could not refresh. Reconnect or try again when online.",
        current.user,
      );
      schedule();
      throw e;
    }
  }
  function cancelPending() {
    if (pending) clearTimeout(pending.timer);
    pending = undefined;
  }
  async function poll(request, key, expiresAt) {
    if (pending?.request !== request) return;
    if (Date.now() >= expiresAt) {
      cancelPending();
      emit(
        "signed-out",
        "Website connection timed out. Click Connect to try again.",
      );
      return;
    }
    try {
      const response = await network(
        `${config.databaseURL}/bancycraftHandoffs/${request}.json`,
        { signal: AbortSignal.timeout(15000) },
      );
      if (response.ok) {
        const record = await response.json();
        if (record) {
          const data = decryptHandoff(record, key, request);
          const user = await profile(data.idToken, data.uid);
          // Verify that the refresh credential belongs to the same project/account before saving it.
          const refreshed = await json(
            `https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: data.refreshToken,
              }).toString(),
            },
          );
          if (refreshed.user_id !== data.uid || pending?.request !== request)
            throw Error("Authorization does not match this account.");
          credentials = {
            uid: data.uid,
            refreshToken: refreshed.refresh_token,
            idToken: refreshed.id_token,
            expiresAt: Date.now() + Number(refreshed.expires_in) * 1000,
          };
          persist();
          cancelPending();
          const accepted = credentials;
          await network(
            `${config.databaseURL}/bancycraftHandoffs/${request}.json?auth=${encodeURIComponent(credentials.idToken)}`,
            { method: "DELETE", signal: AbortSignal.timeout(10000) },
          ).catch(() => {});
          if (credentials !== accepted) return;
          emit("connected", "Connected to Bancy.gg.", user);
          schedule();
          return;
        }
      } else if (![401, 403].includes(response.status))
        throw Error("Website connection unavailable.");
    } catch {
      if (pending?.request === request)
        emit(
          "connecting",
          "Waiting for website approval. Check your connection if the page cannot load.",
        );
    }
    if (pending?.request === request) {
      pending.timer = setTimeout(() => poll(request, key, expiresAt), 2000);
      pending.timer.unref?.();
    }
  }
  return {
    events,
    config,
    status: () => ({ ...current }),
    async restore() {
      if (!fs.existsSync(file)) return;
      try {
        const stored = JSON.parse(
          safeStorage.decryptString(fs.readFileSync(file)),
        );
        if (!stored.uid || !stored.refreshToken) throw Error();
        credentials = stored;
        emit("connecting", "Restoring your website session…");
        await refresh();
      } catch {
        if (!credentials) emit("signed-out", "Reconnect your website account.");
      }
    },
    async connect() {
      cancelPending();
      clearTimeout(refreshTimer);
      credentials = undefined;
      if (fs.existsSync(file)) fs.unlinkSync(file);
      const request = randomBytes(32).toString("hex"),
        key = randomBytes(32);
      const expiresAt = Date.now() + 300000;
      pending = { request };
      emit("connecting", "Approve the connection in your browser.");
      try {
        await openExternal(
          "https://bancy.gg/bancycraft/connect#request=" +
            request +
            "&key=" +
            key.toString("base64url"),
        );
      } catch {
        cancelPending();
        emit("signed-out", "The website could not open. Try again.");
        throw Error("Unable to open Bancy.gg.");
      }
      void poll(request, key, expiresAt);
      return current;
    },
    async token() {
      if (!credentials) throw Error("Connect your website account first.");
      return credentials.idToken && credentials.expiresAt > Date.now() + 60000
        ? credentials.idToken
        : refresh();
    },
    async disconnect() {
      cancelPending();
      clearTimeout(refreshTimer);
      credentials = undefined;
      if (fs.existsSync(file)) fs.unlinkSync(file);
      emit(
        "signed-out",
        "Disconnected from the app. Your website browser session is unchanged.",
      );
      return current;
    },
    close() {
      cancelPending();
      clearTimeout(refreshTimer);
    },
  };
}
module.exports = { createAccount, decryptHandoff, firebase };
