const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createKeyVault}=require('../electron/key-vault.cjs'),{createFeedback}=require('../electron/feedback.cjs');
test('vault returns metadata only and rechecks verified UID and admin grant before copying',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bancy-vault-'));
 try{
  fs.writeFileSync(path.join(dir,'admin-key-vault.bin'),JSON.stringify({uid:'owner',keys:[{id:'controller',label:'Controller',value:'private-value'}]}));
  const safe={isEncryptionAvailable:()=>true,decryptString:b=>b.toString()},account={token:async()=> 'opaque-token',status:()=>({state:'connected',user:{uid:'owner'}})};
  let uid='owner',admin=true,copied='';const network=async u=>new Response(JSON.stringify(u.includes('accounts:lookup')?{users:[{localId:uid,displayName:'Banri'}]}:admin));
  const vault=createKeyVault(dir,safe,account,{writeText:s=>copied=s,readText:()=>'',clear(){}},network);
  assert.equal((await vault.status()).available,true);assert.equal(JSON.stringify(await vault.status()).includes('private-value'),false);await vault.copy('controller');assert.equal(copied,'private-value');
  uid='impostor';assert.equal((await vault.status()).available,false);await assert.rejects(vault.copy('controller'),/different account/);
  uid='owner';admin=false;assert.equal((await vault.status()).available,false);await assert.rejects(vault.copy('controller'),/Administrator/);
  admin=true;account.status=()=>({state:'signed-out'});assert.equal((await vault.status()).available,false);
  account.status=()=>({state:'connected',user:{uid:'owner'}});
  const changed=createKeyVault(dir,safe,account,{writeText(){assert.fail('Must not copy after sign-out');}},async u=>{if(!u.includes('accounts:lookup'))account.status=()=>({state:'signed-out'});return new Response(JSON.stringify(u.includes('accounts:lookup')?{users:[{localId:'owner'}]}:true));});
  await assert.rejects(changed.copy('controller'),/changed during verification/);
 }finally{fs.rmSync(dir,{recursive:true});}
});
test('feedback confirms a Google receipt and rejects validation pages instead of claiming success',async()=>{
 const ids=[1489342635,1253522163,1682093595,1534635437,1485346503,1936007140],schema=[null,[null,ids.map(id=>[null,null,null,null,[[id,null,0]]])]];
 const report={game:'valheim',type:'Suggestion',subject:'A useful idea',details:'Some details',email:'',version:'0.8.1'};let body,accepted=true;
 const feedback=createFeedback(async(u,init)=>{if(init.method==='POST'){body=init.body;return new Response(accepted?'Saved <a href="viewform?usp=form_confirm">Another response</a>':'<input name="entry.1682093595">');}return new Response('FB_PUBLIC_LOAD_DATA_ = '+JSON.stringify(schema)+';</script>');});
 assert.deepEqual(await feedback.send(report),{sent:true});assert.equal(body.get('entry.1489342635'),'Valheim');assert.equal(body.get('entry.1682093595'),report.subject);assert.equal([...body.keys()].length,6);
 accepted=false;await assert.rejects(feedback.send(report),/did not confirm/);await assert.rejects(feedback.send({...report,email:'bad'}),/valid reply email/);await assert.rejects(feedback.send({...report,game:'unknown'}),/Choose a game/);
});
test('changed required Google questions stop submission before any POST',async()=>{
 const schema=[null,[null,[[null,null,null,null,[[12345,null,1]]]]]];let posts=0;
 const feedback=createFeedback(async(u,init)=>{if(init.method==='POST')posts++;return new Response('FB_PUBLIC_LOAD_DATA_ = '+JSON.stringify(schema)+';</script>');});
 await assert.rejects(feedback.send({game:'valheim',type:'Bug report',subject:'Test',details:'Details',email:'',version:'0.8.1'}),/hosted form changed/);assert.equal(posts,0);
});
