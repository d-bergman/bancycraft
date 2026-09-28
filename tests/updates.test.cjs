const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { generateKeyPairSync, sign } = require('node:crypto');
const { EventEmitter } = require('node:events');
const { installerDigest, verifyInstaller } = require('../electron/update-auth.cjs');
const { configureUpdater, startAutomaticChecks } = require('../electron/updates.cjs');
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
test('automatic schedule checks after startup and every six hours, then cancels on shutdown',async()=>{
  const jobs=[];const canceled=[];let checks=0;
  const timers={setTimeout(fn,ms){jobs.push({fn,ms,type:'timeout'});return 1;},setInterval(fn,ms){jobs.push({fn,ms,type:'interval'});return 2;},clearTimeout(id){canceled.push(id);},clearInterval(id){canceled.push(id);}};
  const stop=startAutomaticChecks({async check(options){assert.equal(options.background,true);checks++;}},timers);
  assert.equal(checks,0);assert.deepEqual(jobs.map(j=>[j.type,j.ms]),[['timeout',0],['interval',21600000]]);
  await jobs[0].fn();await jobs[1].fn();assert.equal(checks,2);stop();assert.deepEqual(canceled,[1,2]);
  const rejecting=[];startAutomaticChecks({check(){throw Error('offline');}},{...timers,setTimeout(fn){rejecting.push(fn);return 3;},setInterval(fn){rejecting.push(fn);return 4;}});
  await rejecting[0]();await rejecting[1]();
});
test('background checks do not overwrite an offered update, interrupt downloading or install automatically',async()=>{
  const updater=new EventEmitter();const states=[];let checks=0,downloads=0,installs=0,finishCheck;
  updater.checkForUpdates=async()=>{checks++;updater.emit('checking-for-update');await new Promise(resolve=>finishCheck=resolve);updater.emit('update-available',{version:'9.9.9'});};
  updater.downloadUpdate=async()=>{downloads++;updater.emit('download-progress',{percent:20});};updater.quitAndInstall=()=>installs++;
  const controller=configureUpdater(updater,(state)=>states.push(state));
  const pending=controller.check({background:true});await controller.check({background:true});assert.equal(checks,1);
  finishCheck();await pending;await controller.check({background:true});assert.equal(checks,1);assert.equal(states.at(-1),'available');assert.equal(downloads,0);assert.equal(installs,0);
  await controller.download();assert.equal(downloads,1);updater.emit('update-downloaded');await controller.check({background:true});assert.equal(states.at(-1),'ready');assert.equal(checks,1);assert.equal(installs,0);
});
