const FORM='https://docs.google.com/forms/d/e/1FAIpQLSd1WcyVB3WX-uaS_4s6NCv2z803AYyyVNr5FTkKpIO3Plp9jw';
const games={dragonwilds:'RuneScape: Dragonwilds',valheim:'Valheim',enshrouded:'Enshrouded',grounded2:'Grounded 2',vrising:'V Rising',duneawakening:'Dune: Awakening'};
function validateReport(v){
 if(!v||!games[v.game]||!['Bug report','Suggestion'].includes(v.type))throw Error('Choose a game and report type.');
 for(const [key,max] of [['subject',180],['details',12000],['email',254],['version',40]])if(typeof v[key]!=='string'||v[key].length>max)throw Error('Invalid report '+key+'.');
 if(!v.subject.trim()||!v.details.trim())throw Error('Subject and details are required.');
 if(v.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))throw Error('Enter a valid reply email.');return v;
}
function createFeedback(network=(...a)=>fetch(...a)){
 let sending=false;
 return {async send(value){
  const v=validateReport(value);if(sending)throw Error('A report is already being sent.');sending=true;
  try{
   const page=await network(FORM+'/viewform',{signal:AbortSignal.timeout(20000)});if(!page.ok)throw Error('The feedback form is unavailable.');
   const html=await page.text(),match=html.match(/FB_PUBLIC_LOAD_DATA_ = ([\s\S]*?);<\/script>/);
   const questions=match?JSON.parse(match[1])?.[1]?.[1]:null,entries=[1489342635,1253522163,1682093595,1534635437,1485346503,1936007140];
   if(!questions||questions.some(q=>q?.[4]?.[0]?.[2]&&!entries.includes(q[4][0][0]))||entries.some(id=>!questions.some(q=>q?.[4]?.[0]?.[0]===id)))throw Error('The hosted form changed. Please try again after the app is updated.');
   const body=new URLSearchParams({'entry.1489342635':v.game==='duneawakening'?'Other / planned game':games[v.game],'entry.1253522163':v.type,'entry.1682093595':v.subject.trim(),'entry.1534635437':(v.game==='duneawakening'?'Game: Dune: Awakening\n\n':'')+v.details.trim(),'entry.1485346503':v.version,'entry.1936007140':v.email.trim()});
   const r=await network(FORM+'/formResponse',{method:'POST',body,signal:AbortSignal.timeout(25000)}),receipt=await r.text();
   const confirmed=receipt.includes('viewform?usp=form_confirm')&&!/name=["']entry\./.test(receipt);
   if(!r.ok||!confirmed)throw Error('Google did not confirm submission. Your draft is kept here; check your connection before retrying.');return {sent:true};
  }finally{sending=false;}
 }};
}
module.exports={createFeedback,validateReport,FORM};
