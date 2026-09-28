const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { generateKeyPairSync, sign } = require('node:crypto');
const { EventEmitter } = require('node:events');
const { installerDigest, verifyInstaller } = require('../electron/update-auth.cjs');
const { configureUpdater } = require('../electron/updates.cjs');
test('update verifier accepts the trusted key and rejects tampering or another key',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bancy-update-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'installer.exe');fs.writeFileSync(file,'installer fixture');const key=generateKeyPairSync('ed25519');const signature=sign(null,await installerDigest(file),key.privateKey).toString('base64');
  assert.equal(await verifyInstaller(file,signature,key.publicKey),true);
  assert.equal(await verifyInstaller(file,signature,generateKeyPairSync('ed25519').publicKey),false);
  fs.appendFileSync(file,'modified');assert.equal(await verifyInstaller(file,signature,key.publicKey),false);
  assert.equal(await verifyInstaller(file,'not-a-signature',key.publicKey),false);
});
test('updater requires explicit download and ready state before install, and handles errors',async()=>{
  const updater=new EventEmitter();const states=[];let checks=0,downloads=0,installs=0;
  updater.checkForUpdates=async()=>{checks++;updater.emit('checking-for-update');updater.emit('update-available',{version:'0.3.0'});};
  updater.downloadUpdate=async()=>{downloads++;updater.emit('download-progress',{percent:50});updater.emit('update-downloaded');};
  updater.quitAndInstall=(silent,restart)=>{assert.equal(silent,true);assert.equal(restart,true);installs++;};
  const controller=configureUpdater(updater,(state,message,extra)=>states.push({state,message,...extra}));
  controller.install();await controller.download();assert.equal(installs,0);assert.equal(downloads,0);
  await controller.check();assert.equal(checks,1);assert.equal(downloads,0);assert.equal(updater.autoInstallOnAppQuit,false);assert.equal(updater.allowDowngrade,false);
  await controller.download();assert.equal(downloads,1);assert.equal(states.at(-1).state,'ready');controller.install();assert.equal(installs,1);
  updater.emit('error',new Error('offline'));assert.equal(states.at(-1).state,'error');
});
