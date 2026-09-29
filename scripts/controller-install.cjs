// Applies a reviewed key-verification change to the private controller source.
// No private credentials are read or written by this installer.
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const target=process.argv[2];if(!target||!path.isAbsolute(target))throw Error('Provide the absolute controller server.js path.');
 const {verifyControllerKey}=await import('../server/controller-key.mjs');
 const publicKey=fs.readFileSync(path.resolve(__dirname,'../electron/access-public.pem'),'utf8');
 let text=fs.readFileSync(target,'utf8');
 if(text.includes('BANCYCRAFT_CONTROLLER_KEYS_V1')){console.log('Controller key verification already installed.');return;}
 if(!text.includes('async function authenticateControllerUser')||!text.includes('const authorized = await isControllerAuthorized(decoded);'))throw Error('Controller source has changed. Review before applying.');
 text="import {verify as verifyCraftSignature} from 'node:crypto';\n"+text;
 const code=`\n// BANCYCRAFT_CONTROLLER_KEYS_V1: public verification key, never an issued access key.\nconst craftIssuerPublicKey=${JSON.stringify(publicKey)};\n${verifyControllerKey.toString()}\nasync function authorizeCraftKey(req){\n const key=verifyControllerKey(req.get('X-BancyCraft-Key'),craftIssuerPublicKey,req.user.uid);\n const revoked=await getDatabase().ref('serverController/revokedKeys').child(key.id).get();\n if(revoked.val()===true)throw Error('Controller key has been revoked.');\n return key;\n}\napp.get('/api/app-access',authenticateFirebaseUser,async(req,res)=>{\n try{const key=await authorizeCraftKey(req);res.json({authorized:true,expiresAt:key.expiresAt});}\n catch{res.status(403).json({error:'controller_key_denied',message:'A valid controller key for this website account is required.'});}\n});\n`;
 text=text.replace('app.get("/api/servers",',code+'\napp.get("/api/servers",');
 text=text.replace('maintenanceScheduler: true,','maintenanceScheduler: true,\n    bancyCraftKeys: true,');
 text=text.replace('Authorization, Content-Type','Authorization, Content-Type, X-BancyCraft-Key');
 text=text.replace('const authorized = await isControllerAuthorized(decoded);',"let authorized;\n    if(req.get('X-BancyCraft-Key')){try{await authorizeCraftKey(req);authorized=true;}catch{return res.status(403).json({error:'controller_key_denied'});}}\n    else authorized = await isControllerAuthorized(decoded);");
 const backup=target+'.before-bancycraft-keys.bak';if(!fs.existsSync(backup))fs.copyFileSync(target,backup);
 fs.writeFileSync(target,text);console.log('Controller source updated with account-bound signed keys; restart only game-server-controller to load it.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
