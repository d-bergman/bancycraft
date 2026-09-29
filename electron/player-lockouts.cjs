// Shared by the renderer, native bridge and private controller. No credentials.
function actionLock(snapshot,id,action){
 const servers=snapshot?.servers;if(!Array.isArray(servers))return 'Refresh server status before requesting an action.';
 const target=servers.find(s=>s.id===id);if(!target)return 'This server is not in the current controller registry.';
 if(!['running','stopped'].includes(target.status))return 'This server is unavailable.';
 if(action==='start'&&target.status==='running')return 'This server is already running.';
 if(action==='stop'&&target.status!=='running')return 'This server is already stopped.';
 const affected=action==='start'?servers.filter(s=>s.id!==id&&s.status==='running'):target.status==='running'?[target]:[];
 for(const s of affected){if(!['ok','log_fallback'].includes(s.playerQueryStatus)||!Number.isSafeInteger(s.playersOnline)||s.playersOnline<0)return 'Locked: player count could not be verified for '+s.label+'.';if(s.playersOnline>0)return 'Locked: '+s.label+' has '+s.playersOnline+' player'+(s.playersOnline===1?'':'s')+' online.';}
 return '';
}
module.exports={actionLock};
