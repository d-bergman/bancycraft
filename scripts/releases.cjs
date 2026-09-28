// Explicit release administration. Credentials stay in process memory, never in the app or repository.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createPrivateKey, generateKeyPairSync, sign } = require('node:crypto');
const { installerDigest } = require('../electron/update-auth.cjs');
const root = path.resolve(__dirname, '..');
const keyDirectory = path.join(process.env.LOCALAPPDATA, 'BancyCraft-release-keys');
const privateFile = path.join(keyDirectory, 'update-signing.pem');
const repo = 'd-bergman/bancycraft';
function credential() {
  const response = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', cwd: root });
  const token = response.stdout?.match(/^password=(.+)$/m)?.[1];
  if (!token) throw new Error('GitHub release credentials are unavailable.'); return token;
}
async function github(endpoint, options = {}) {
  const response = await fetch(endpoint.startsWith('https:') ? endpoint : 'https://api.github.com' + endpoint, { ...options, headers: { Authorization: 'Bearer ' + credential(), 'User-Agent': 'BancyCraft-release-admin', Accept: 'application/vnd.github+json', ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}) for ${endpoint.split('?')[0]}`);
  return response.status === 204 ? null : response.json();
}
async function keys() {
  fs.mkdirSync(keyDirectory, { recursive: true });
  if (!fs.existsSync(privateFile)) {
    if (fs.existsSync(path.join(root, 'electron/update-public.pem'))) throw new Error('Signing key is missing. Restore it rather than rotate the embedded key.');
    const pair = generateKeyPairSync('ed25519');
    fs.writeFileSync(privateFile, pair.privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx' });
    fs.writeFileSync(path.join(root, 'electron/update-public.pem'), pair.publicKey.export({ type: 'spki', format: 'pem' }));
    const acl = spawnSync('icacls', [keyDirectory, '/inheritance:r', '/grant:r', `${process.env.USERDOMAIN}\\${process.env.USERNAME}:(OI)(CI)F`, 'SYSTEM:(OI)(CI)F'], { encoding: 'utf8' });
    if (acl.status !== 0) throw new Error('Release key was created but its folder permissions could not be restricted.');
  }
  console.log('Update signing key is ready; private key remains outside the repository.');
}
async function signRelease(version) {
  const file = path.join(root, `release/BancyCraft-Setup-${version}-x64.exe`);
  const signature = sign(null, await installerDigest(file), createPrivateKey(fs.readFileSync(privateFile)));
  fs.writeFileSync(file + '.sig', signature.toString('base64') + '\n');
  console.log(`Signed update digest for ${version}.`);
}
async function draft(version) {
  const releases = await github(`/repos/${repo}/releases`);
  let release = releases.find(r => r.tag_name === 'v' + version);
  if (release && !release.draft) throw new Error('Release is already published; do not replace its installer.');
  if (!release) release = await github(`/repos/${repo}/releases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag_name: 'v' + version, target_commitish: 'main', name: 'BancyCraft ' + version, draft: true, prerelease: false, body: fs.readFileSync(path.join(root, 'docs/RELEASE-NOTES.md'), 'utf8') }) });
  for (const file of [`BancyCraft-Setup-${version}-x64.exe`, `BancyCraft-Setup-${version}-x64.exe.blockmap`, `BancyCraft-Setup-${version}-x64.exe.sig`, 'latest.yml']) {
    if (release.assets.some(a => a.name === file)) throw new Error(`Draft asset ${file} exists; review it before replacing.`);
    const content = fs.readFileSync(path.join(root, 'release', file));
    await github(release.upload_url.split('{')[0] + '?name=' + encodeURIComponent(file), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: content });
    console.log(`Uploaded ${file}.`);
  }
  console.log(`Draft ready: ${release.html_url}`);
}
async function publish(version) {
  const release = (await github(`/repos/${repo}/releases`)).find(r => r.tag_name === 'v' + version);
  if (!release?.draft || release.assets.length < 4) throw new Error('Expected a complete draft release.');
  const result = await github(`/repos/${repo}/releases/${release.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: false, make_latest: 'true' }) });
  console.log(`Published ${result.html_url}`);
}
(async () => {
  const [command, version] = process.argv.slice(2);
  if (command === 'keys') return keys();
  if (command === 'status') { const r = await github(`/repos/${repo}`); console.log(JSON.stringify({ private: r.private, permissions: r.permissions })); return; }
  if (command === 'make-public') { const r = await github(`/repos/${repo}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ private: false }) }); console.log(`Repository visibility: ${r.visibility}`); return; }
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('A stable release version is required.');
  if (command === 'sign') return signRelease(version);
  if (command === 'draft') return draft(version);
  if (command === 'publish') return publish(version);
  throw new Error('Use keys, status, make-public, sign, draft or publish.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
