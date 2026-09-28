const { verifyInstaller } = require('./update-auth.cjs');
const publicKey = require('node:fs').readFileSync(require('node:path').join(__dirname, 'update-public.pem'), 'utf8');
const repository = 'd-bergman/bancycraft';
function configureUpdater(updater, status) {
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.allowDowngrade = false;
  updater.allowPrerelease = false;
  updater.logger = { info() {}, warn() {}, error() {}, debug() {} };
  let version, available = false, ready = false, working = false;
  updater.verifyUpdateCodeSignature = async (_publishers, file) => {
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return 'Invalid release version.';
    const response = await fetch(`https://github.com/${repository}/releases/download/v${version}/BancyCraft-Installer.exe.sig`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) return 'Release signature unavailable.';
    const signature = await response.text();
    return await verifyInstaller(file, signature, publicKey) ? null : 'Release signature does not match the BancyCraft update key.';
  };
  updater.on('checking-for-update', () => status('checking', 'Checking GitHub Releases…'));
  updater.on('update-available', info => { version = info.version; available = true; status('available', `BancyCraft ${version} is available.`, { version }); });
  updater.on('update-not-available', () => { available = false; status('current', 'You have the latest BancyCraft release.'); });
  updater.on('download-progress', progress => status('downloading', `Downloading BancyCraft ${version} · ${Math.round(progress.percent)}%`, { version, percent: progress.percent }));
  updater.on('update-downloaded', () => { ready = true; status('ready', `BancyCraft ${version} is verified and ready. Restart to install.`, { version, percent: 100 }); });
  updater.on('error', () => { working = false; status('error', 'The update could not be verified or downloaded. Check your connection and try again.'); });
  status('idle', 'Check for a newer BancyCraft release.');
  return {
    async check({ background = false } = {}) { if (working || ready || (background && available)) return; working = true; try { await updater.checkForUpdates(); } catch { status('error', 'Unable to check for updates. Try again when you are online.'); } finally { working = false; } },
    async download() { if (!available || working || ready) return; working = true; status('downloading', `Downloading BancyCraft ${version}…`, { version, percent: 0 }); try { await updater.downloadUpdate(); } catch { status('error', 'The update could not be verified or downloaded. Please check again and retry.'); } finally { working = false; } },
    install() { if (ready && !working) updater.quitAndInstall(true, true); }
  };
}
function startAutomaticChecks(updater, timers = globalThis) {
  // Leave startup responsive; recurring checks never download or restart the app.
  const check = () => Promise.resolve().then(() => updater.check({ background: true })).catch(() => {});
  const startup = timers.setTimeout(check, 0);
  const recurring = timers.setInterval(check, 6 * 60 * 60 * 1000);
  startup.unref?.(); recurring.unref?.();
  return () => { timers.clearTimeout(startup); timers.clearInterval(recurring); };
}
module.exports = { configureUpdater, startAutomaticChecks };
