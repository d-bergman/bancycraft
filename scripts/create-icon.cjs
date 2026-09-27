const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#163846"/><stop offset="1" stop-color="#030c12"/></linearGradient><linearGradient id="fg" x2="1" y2="1"><stop stop-color="#d0faff"/><stop offset="1" stop-color="#48cce8"/></linearGradient></defs><rect x="2" y="2" width="252" height="252" rx="42" fill="url(#bg)" stroke="#427687" stroke-width="4"/><path d="M65 48H132C176 48 193 67 193 92C193 110 183 123 167 129C189 134 203 146 203 167C203 195 181 212 137 212H65V197L80 190V70L65 63ZM112 72V117H131C153 117 161 109 161 94C161 79 151 72 132 72ZM112 139V187H136C157 187 169 179 169 163C169 147 158 139 136 139Z" fill="url(#fg)"/><path d="M48 211L57 224L216 53L208 42Z" fill="#69e2f3" opacity=".22"/></svg>`;
(async () => {
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(path.join(root, 'public/assets/app-icon.png'), png);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(root, 'build/icon.ico'), Buffer.concat([header, png]));
  fs.writeFileSync(path.join(root, 'build/icon.svg'), svg);
})();
