import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
export default defineConfig({ base: './', define: { __APP_VERSION__: JSON.stringify(manifest.version) }, build: { outDir: 'dist' }, server: { host: '127.0.0.1', port: 5173, strictPort: true } });
