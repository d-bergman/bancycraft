// Live Electron renderer preview. Keep its workspace isolated from the installed app.
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const vite = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: root, stdio: 'inherit' });
let app;
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  app?.kill();
  vite.kill();
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
vite.once('exit', code => { if (!closing) { console.error('Live preview server stopped (' + code + ').'); close(); process.exitCode = code || 1; } });
(async () => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (closing) return;
    try { if ((await fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(750) })).ok) break; }
    catch { /* Vite is starting. */ }
    if (attempt === 99) throw Error('Vite did not start on 127.0.0.1:5173. Check that the port is free.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (closing) return;
  const env = { ...process.env, BANCYCRAFT_DEV_URL: 'http://127.0.0.1:5173/', BANCYCRAFT_TEST_DATA: process.env.BANCYCRAFT_TEST_DATA || path.join(process.env.LOCALAPPDATA, 'BancyCraft-Preview') };
  delete env.ELECTRON_RUN_AS_NODE;
  app = spawn(require('electron'), ['.'], { cwd: root, env, stdio: 'inherit' });
  app.once('exit', code => { close(); process.exitCode = code || 0; });
  console.log('BancyCraft live preview is open. Renderer edits update automatically.');
})().catch(error => { console.error(error.message); close(); process.exitCode = 1; });
