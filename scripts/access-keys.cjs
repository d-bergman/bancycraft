// Private issuer tool. Never ships in the app; never prints key contents.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {generateKeyPairSync,createPublicKey,sign,randomUUID}=require('node:crypto');
const directory=path.join(process.env.LOCALAPPDATA,'BancyCraft-access-keys');
const privateFile=path.join(directory,'issuer-private.pem');
const publicFile=path.resolve(__dirname,'../electron/access-public.pem');
fs.mkdirSync(directory,{recursive:true});
if(!fs.existsSync(privateFile)) {
  if(fs.existsSync(publicFile)) throw new Error('Restore the original issuer key; do not rotate existing users silently.');
  const pair=generateKeyPairSync('ed25519');
  fs.writeFileSync(privateFile,pair.privateKey.export({format:'pem',type:'pkcs8'}),{flag:'wx'});
  fs.writeFileSync(publicFile,pair.publicKey.export({format:'pem',type:'spki'}));
  if(spawnSync('icacls',[directory,'/inheritance:r','/grant:r',`${process.env.USERDOMAIN}\\${process.env.USERNAME}:(OI)(CI)F`,'SYSTEM:(OI)(CI)F'],{encoding:'utf8'}).status!==0) throw new Error('Unable to restrict issuer folder permissions.');
}
const privateKey=fs.readFileSync(privateFile);
if(createPublicKey(privateKey).export({format:'pem',type:'spki'})!==createPublicKey(fs.readFileSync(publicFile)).export({format:'pem',type:'spki'}))throw new Error('Issuer key does not match the app.');
const command=process.argv[2],controller=command==='issue-controller';const [uid,subject,days,output]=controller?process.argv.slice(3):[undefined,...process.argv.slice(3)];if(controller&&!/^[A-Za-z0-9_-]{1,128}$/.test(uid||''))throw Error('Controller keys need the recipient website UID.');
if(command==='init')console.log('Private access-key issuer initialized outside the repository.');
else if(command==='issue'||controller) {
  if(!subject?.trim()||subject.length>120||!/^\d+$/.test(days||'')||Number(days)<1||Number(days)>3650)throw new Error('Use issue <recipient> <days 1-3650> [private output path].');
  const now=Date.now(),payload=Buffer.from(JSON.stringify({id:randomUUID(),subject:subject.trim(),scope:controller?'bancy-controller':'bancy-community',...(controller?{uid}:{}),issuedAt:now,expiresAt:now+Number(days)*86400000})).toString('base64url');
  const token='BC1.'+payload+'.'+sign(null,Buffer.from('BC1.'+payload),privateKey).toString('base64url');
  const target=output?path.resolve(output):path.join(directory,subject.replace(/[^\w-]/g,'-')+'-'+now+'.txt');
  fs.writeFileSync(target,token+'\n',{flag:'wx'});console.log('Access key saved to '+target);
} else throw new Error('Use init, issue, or issue-controller <website UID> <recipient> <days> [private output path].');
