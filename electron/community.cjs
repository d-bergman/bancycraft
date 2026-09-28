const {BrowserWindow,session}=require('electron');
const partition='persist:bancycraft-community'+(process.env.BANCYCRAFT_TEST_DATA?'-test-'+require('node:path').basename(process.env.BANCYCRAFT_TEST_DATA):'');
function createCommunity(access) {
  const windows=new Set();
  const allowed=url=>{try {const u=new URL(url);return u.protocol==='https:'&&['bancy.gg','www.bancy.gg'].includes(u.hostname)&&!u.username&&!u.password;}catch{return false;}};
  function close(){for(const win of windows)if(!win.isDestroyed())win.destroy();windows.clear();}
  async function prepare(win,order){
    if(!order)return;
    access.require();
    await win.webContents.executeJavaScript(`(()=>{const order=${JSON.stringify(order)};document.querySelector('[data-ledger-tab=bank]')?.click();document.querySelector('[data-bank-amount-mode=direct]')?.click();const amount=document.getElementById('bankRequestAmount'),note=document.getElementById('bankRequestNote'),type=document.getElementById('bankRequestType');if(amount&&note&&type){amount.value=order.amount;note.value=order.note;type.value='purchase';amount.dispatchEvent(new Event('input',{bubbles:true}));const message=document.createElement('p');message.textContent='Merchant order imported from BancyCraft. Sign in, review the amount and submit when ready.';document.getElementById('panel-bank').prepend(message);}})()`);
  }
  return {
    close,
    async lock(){close();await session.fromPartition(partition).clearStorageData();},
    async bank(order){
      access.require();
      for(const win of windows){win.show();win.focus();if(!win.webContents.getURL().includes('/dragonwilds/tannery-ledger'))await win.loadURL('https://bancy.gg/dragonwilds/tannery-ledger');await prepare(win,order);return;}
      const win=new BrowserWindow({width:1400,height:950,minWidth:900,minHeight:700,title:'BancyCraft · Dragonwilds shared bank',backgroundColor:'#061016',autoHideMenuBar:true,webPreferences:{partition,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
      windows.add(win);win.on('closed',()=>windows.delete(win));
      win.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
      win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
      win.webContents.on('will-attach-webview',event=>event.preventDefault());
      win.webContents.on('will-navigate',(event,url)=>{if(!access.status().unlocked||!allowed(url)){event.preventDefault();if(!access.status().unlocked)close();}});
      win.webContents.on('will-redirect',(event,url)=>{if(!allowed(url))event.preventDefault();});
      win.webContents.on('did-finish-load',()=>{if(allowed(win.webContents.getURL()))win.webContents.executeJavaScript("document.querySelector('[data-ledger-tab=bank]')?.click()").catch(()=>{});});
      try{await win.loadURL('https://bancy.gg/dragonwilds/tannery-ledger');}catch{win.destroy();throw new Error('The shared bank could not load. Check your connection and try again.');}
      await prepare(win,order);
    }
  };
}
module.exports={createCommunity};
