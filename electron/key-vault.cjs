const fs=require('node:fs'),path=require('node:path');
const {firebase}=require('./account.cjs');
function createKeyVault(directory,safeStorage,account,clipboard,network=(...a)=>fetch(...a)){
 const file=path.join(directory,'admin-key-vault.bin');
 async function authorized(){
  if(!fs.existsSync(file)||!safeStorage.isEncryptionAvailable())throw Error('Private key panel is unavailable.');
  const vault=JSON.parse(safeStorage.decryptString(fs.readFileSync(file))),token=await account.token();
  const r=await network('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+firebase.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(15000)});
  const user=r.ok?(await r.json()).users?.[0]:null;
  if(!user||user.disabled||user.localId!==vault.uid||account.status().state!=='connected'||account.status().user?.uid!==vault.uid)throw Error('This private panel belongs to a different account.');
  const a=await network(firebase.databaseURL+'/admins/'+encodeURIComponent(vault.uid)+'.json?auth='+encodeURIComponent(token),{signal:AbortSignal.timeout(15000)});
  if(!a.ok||await a.json()!==true)throw Error('Administrator authorization is required.');
  if(account.status().state!=='connected'||account.status().user?.uid!==vault.uid)throw Error('Administrator account changed during verification.');
  if(!Array.isArray(vault.keys))throw Error('Invalid private key vault.');return vault;
 }
 return {
  async status(){try{const v=await authorized();return {available:true,keys:v.keys.map(k=>({id:k.id,label:k.label,subject:k.subject,expiresAt:k.expiresAt}))};}catch{return {available:false,keys:[]};}},
  async copy(id){const v=await authorized(),key=v.keys.find(k=>k.id===id);if(!key||typeof key.value!=='string')throw Error('Key unavailable.');if(key.expiresAt&&key.expiresAt<=Date.now())throw Error('This key has expired.');clipboard.writeText(key.value);const timeout=setTimeout(()=>{if(clipboard.readText()===key.value)clipboard.clear();},60000);timeout.unref?.();return true;}
 };
}
module.exports={createKeyVault};
