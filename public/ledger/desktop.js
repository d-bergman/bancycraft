// Only public calculations run in this sandboxed frame.
document.getElementById('desktopBank').addEventListener('click',()=>parent.postMessage({kind:'bancy-ledger-bank'},'*'));
document.getElementById('requestOrderFunds').addEventListener('click',event=>{event.stopImmediatePropagation();const order=orderSummary();if(order.totalCost>0)parent.postMessage({kind:'bancy-ledger-bank',order:{amount:order.totalCost,note:orderRequestNote(order)}},'*');},true);
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.kind!=='bancy-ledger-access')return;document.getElementById('tab-bank').hidden=!event.data.unlocked;document.getElementById('requestOrderFunds').hidden=!event.data.unlocked;if(!event.data.unlocked&&document.getElementById('tab-bank').getAttribute('aria-selected')==='true')document.getElementById('tab-profit').click();});
parent.postMessage({kind:'bancy-ledger-ready'},'*');
