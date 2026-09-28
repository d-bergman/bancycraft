const {test}=require('node:test'),assert=require('node:assert/strict'),{generateKeyPairSync,sign}=require('node:crypto');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {verifyKey,createAccess}=require('../electron/access.cjs');
const pair=generateKeyPairSync('ed25519');
function key(data={}){const payload=Buffer.from(JSON.stringify({subject:'Test',scope:'bancy-community',issuedAt:1000,expiresAt:3000,...data})).toString('base64url');return 'BC1.'+payload+'.'+sign(null,Buffer.from('BC1.'+payload),pair.privateKey).toString('base64url');}
test('access keys require issuer signature, scope, issuance time and expiry',()=>{
  assert.equal(verifyKey(key(),pair.publicKey,2000).unlocked,true);
  assert.throws(()=>verifyKey('anything',pair.publicKey,2000));
  assert.throws(()=>verifyKey(key({scope:'admin'}),pair.publicKey,2000));
  assert.throws(()=>verifyKey(key(),pair.publicKey,3000));
  assert.throws(()=>verifyKey(key(),pair.publicKey,999));
  const token=key();assert.throws(()=>verifyKey(token.replace('BC1.','BC1.Z'),pair.publicKey,2000));
  assert.throws(()=>verifyKey(token,generateKeyPairSync('ed25519').publicKey,2000));
});
test('encrypted key persistence and lock are separate from workspace exports',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bancy-access-'));
  // Adapter fixture verifies the storage boundary; native smoke tests Windows encryption.
  const safe={isEncryptionAvailable:()=>true,encryptString:t=>Buffer.from('encrypted:'+Buffer.from(t).toString('base64')),decryptString:b=>Buffer.from(b.toString().slice(10),'base64').toString()};
  const now=Date.now(),token=key({issuedAt:now-1000,expiresAt:now+60000});
  const access=createAccess(dir,safe,pair.publicKey);assert.throws(()=>access.require());access.unlock(token);
  assert.equal(createAccess(dir,safe,pair.publicKey).status().subject,'Test');
  assert.ok(!fs.readFileSync(path.join(dir,'community-key.bin')).includes(token));
  access.lock();assert.throws(()=>access.require());assert.equal(fs.existsSync(path.join(dir,'community-key.bin')),false);
  assert.throws(()=>createAccess(dir,{...safe,isEncryptionAvailable:()=>false},pair.publicKey).unlock(token));
  fs.rmSync(dir,{recursive:true,force:true});
});
