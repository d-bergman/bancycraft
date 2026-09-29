// Install fail-closed manual-action guards inside the controller mutation queue.
const fs=require('node:fs'),path=require('node:path'),{actionLock}=require('../electron/player-lockouts.cjs');
const target=process.argv[2];if(!target||!path.isAbsolute(target))throw Error('Provide an absolute server.js path.');
let text=fs.readFileSync(target,'utf8');if(text.includes('BANCYCRAFT_PLAYER_LOCKOUTS_V1')){console.log('Player lockouts already installed.');process.exit(0);}
for(const action of ['start','stop','restart'])if(!text.includes(`enqueueMutation(() => ${action}Server(req.params.server))`))throw Error('Controller routes changed; review required.');
const code=`\n// BANCYCRAFT_PLAYER_LOCKOUTS_V1\n${actionLock.toString()}\nasync function manualServerAction(id,action){\n playerQueryCache.clear();\n const servers=await loadApprovedServers();\n const before=await getServerSnapshotFor(servers);\n const reason=actionLock(before,id,action);\n if(reason)throw httpError(409,'players_lockout',reason);\n return action==='start'?startServer(id):action==='stop'?stopServer(id):restartServer(id);\n}\n`;
text=text.replace('let mutationQueue = Promise.resolve();',code+'\nlet mutationQueue = Promise.resolve();');
for(const action of ['start','stop','restart'])text=text.replace(`enqueueMutation(() => ${action}Server(req.params.server))`,`enqueueMutation(() => manualServerAction(req.params.server,'${action}'))`);
text=text.replace('bancyCraftKeys: true,','bancyCraftKeys: true,\n    playerLockouts: true,');
fs.copyFileSync(target,target+'.before-player-lockouts.bak');fs.writeFileSync(target,text);console.log('Manual player lockouts installed; restart only game-server-controller.');
