import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
export default defineConfig(({ command }) => ({ base: './', define: { __APP_VERSION__: JSON.stringify(manifest.version) }, build: { outDir: 'app-dist' }, server: { host: '127.0.0.1', port: 5173, strictPort: true }, plugins: command === 'serve' ? [
  { name: 'bancycraft-local-hmr-csp', transformIndexHtml(html) { return html.replace("connect-src 'self';", "connect-src 'self' ws://127.0.0.1:5173;"); } },
  // Vite serves local CommonJS files as plain scripts unless they are converted for this preview.
  { name: 'bancycraft-local-lockout-esm', enforce: 'pre', transform(code, id) { if (!id.replaceAll('\\', '/').endsWith('/electron/player-lockouts.cjs')) return; return code.replace('module.exports={actionLock};', 'export {actionLock};'); } }
] : [] }));
