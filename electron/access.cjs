const fs = require('node:fs');
const path = require('node:path');
const { verify } = require('node:crypto');
function verifyKey(token, publicKey, now = Date.now(), scope = 'bancy-community') {
  if (typeof token !== 'string' || token.length > 3000) throw new Error('Invalid BancyCraft key.');
  const [prefix, payload, signature, extra] = token.trim().split('.');
  if (prefix !== 'BC1' || extra || !/^[\w-]+$/.test(payload || '') || !/^[\w-]{86}$/.test(signature || '')) throw new Error('Invalid BancyCraft key.');
  if (!verify(null, Buffer.from('BC1.' + payload), publicKey, Buffer.from(signature, 'base64url'))) throw new Error('This key was not issued by BancyCraft.');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (data.scope !== scope || typeof data.subject !== 'string' || !data.subject.trim() || data.subject.length > 120 || !Number.isSafeInteger(data.expiresAt) || !Number.isSafeInteger(data.issuedAt) || data.issuedAt > now || data.expiresAt <= now) throw new Error('This BancyCraft key has expired or is not active.');
  if(scope==='bancy-controller'&&(!/^[A-Za-z0-9_-]{1,128}$/.test(data.uid||'')||! /^[a-f0-9-]{36}$/.test(data.id||'')))throw Error('Invalid controller key binding.');
  return {unlocked:true,...(scope==='bancy-controller'?{uid:data.uid,id:data.id}:{}), subject:data.subject, expiresAt:data.expiresAt };
}
function createAccess(directory, safeStorage, publicKey, options={}) {
  const scope=options.scope||'bancy-community';
  const file = path.join(directory,options.file||'community-key.bin');
  let token;
  try { if (safeStorage.isEncryptionAvailable() && fs.existsSync(file)) token = safeStorage.decryptString(fs.readFileSync(file)); } catch {}
  function status() { try { return verifyKey(token,publicKey,Date.now(),scope); } catch { return {unlocked:false}; } }
  return {
    status,
    token(){this.require();return token;},
    unlock(value) { const result=verifyKey(value,publicKey,Date.now(),scope); if(!safeStorage.isEncryptionAvailable()) throw new Error('Windows encrypted key storage is unavailable.'); fs.mkdirSync(directory,{recursive:true}); const temporary=file+'.tmp'; fs.writeFileSync(temporary,safeStorage.encryptString(value.trim())); fs.renameSync(temporary,file); token=value.trim(); return result; },
    lock() { token=undefined; if(fs.existsSync(file))fs.unlinkSync(file); return status(); },
    require() { if(!status().unlocked) throw new Error('A valid BancyCraft cipher key is required.'); }
  };
}
module.exports={verifyKey,createAccess};
