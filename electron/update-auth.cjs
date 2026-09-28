const fs = require('node:fs');
const { createHash, verify } = require('node:crypto');
async function installerDigest(file) {
  const hash = createHash('sha512');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest();
}
async function verifyInstaller(file, signature, publicKey) {
  if (!/^[A-Za-z0-9+/]{86}==$/.test(signature.trim())) return false;
  return verify(null, await installerDigest(file), publicKey, Buffer.from(signature.trim(), 'base64'));
}
module.exports = { installerDigest, verifyInstaller };
