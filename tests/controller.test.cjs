const {test}=require('node:test'),assert=require('node:assert/strict'),{generateKeyPairSync,sign,randomUUID}=require('node:crypto');
const {createServers}=require('../electron/servers.cjs');
test('controller backend keys are scoped, signed, account-bound and expiring',async()=>{
 const {verifyControllerKey}=await import('../server/controller-key.mjs'),pair=generateKeyPairSync('ed25519');
 const key=(fields={})=>{const payload=Buffer.from(JSON.stringify({id:randomUUID(),uid:'member-one',subject:'Member',scope:'bancy-controller',issuedAt:1000,expiresAt:3000,...fields})).toString('base64url');return 'BC1.'+payload+'.'+sign(null,Buffer.from('BC1.'+payload),pair.privateKey).toString('base64url');};
 assert.equal(verifyControllerKey(key(),pair.publicKey,'member-one',2000).uid,'member-one');
 for(const [token,uid,now] of [[key(),'member-two',2000],[key({scope:'bancy-community'}),'member-one',2000],[key(),'member-one',3000],[key(),'member-one',999],[key({id:'../revoke'}),'member-one',2000],['BC1.forged.forged','member-one',2000]])assert.throws(()=>verifyControllerKey(token,pair.publicKey,uid,now));
 assert.throws(()=>verifyControllerKey(key(),generateKeyPairSync('ed25519').publicKey,'member-one',2000));
});
test('native server bridge cannot send actions without a controller key for the signed-in member',async()=>{
 let key={unlocked:false},requests=[],identity={state:'connected',user:{uid:'member-one'}};
 const account={status:()=>identity,token:async()=>'test-firebase-token',config:{databaseURL:'https://example.test'}};
 const controller={status:()=>key,token:()=>'test-key',lock:()=>{key={unlocked:false};return key;},unlock:()=>{key={unlocked:true,uid:'member-one'};return key;}};
 const network=async(url,options)=>{requests.push({url:String(url),options});return {ok:true,json:async()=>({authorized:true,servers:[{id:'valheim',label:'Valheim',status:'running',playerQueryStatus:'ok',playersOnline:0}]})};};
 const servers=createServers(account,{status:()=>({unlocked:true})},controller,{fetch:network});
 await assert.rejects(()=>servers.action('valheim','restart'),/controller key/);assert.equal(requests.length,0);
 key={unlocked:true,uid:'member-two'};await assert.rejects(()=>servers.action('valheim','restart'),/controller key/);assert.equal(requests.length,0);
 key={unlocked:true,uid:'member-one'};await assert.rejects(()=>servers.action('../unknown','start'),/Invalid/);await assert.rejects(()=>servers.action('valheim','delete'),/Invalid/);
 await servers.action('valheim','restart');assert.equal(requests[1].url,'https://servers-api.bancy.gg/api/servers/valheim/restart');assert.equal(requests[1].options.headers['X-BancyCraft-Key'],'test-key');assert.equal(requests[0].options.redirect,'error');
 identity={state:'signed-out'};await assert.rejects(()=>servers.action('valheim','stop'),/Connect/);assert.equal(requests.length,2);
});
test('server key activation fails closed when the backend rejects it',async()=>{
 let locked=false;const controller={status:()=>({unlocked:true,uid:'member-one'}),token:()=> 'signed-test-key',unlock:()=>({unlocked:true,uid:'member-one'}),lock:()=>{locked=true;}};
 const server=createServers({status:()=>({state:'connected',user:{uid:'member-one'}}),token:async()=> 'fixture',config:{}},{status:()=>({unlocked:false})},controller,{fetch:async()=>({ok:false,json:async()=>({error:'controller_key_denied'})})});
 await assert.rejects(()=>server.unlock('fixture'),/controller_key_denied/);assert.equal(locked,true);
});
