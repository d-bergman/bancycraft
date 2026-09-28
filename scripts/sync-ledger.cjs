// Copy the owned website's ledger, preserving its calculations, catalog and guide.
// Local tools have no cloud SDK; shared bookkeeping opens the real website in
// a key-gated, sandboxed native browser window, retaining its backend rules.
const fs=require('node:fs'),path=require('node:path'),{load}=require('cheerio');
const root=path.resolve(__dirname,'..');
const website=process.argv[2]||path.resolve(root,'../banrigaming.github.io');
const output=path.join(root,'public/ledger');fs.mkdirSync(output,{recursive:true});
const html=fs.readFileSync(path.join(website,'dragonwilds/tannery-ledger.html'),'utf8');
const $=load(html);
$('#bankSignedOutGate').html('<h3>Shared Bancy bank</h3><p>A valid BancyCraft cipher key and your existing Bancy member sign-in are required. The same shared requests, approvals, balance and chest capacity are used by the website.</p><button id="desktopBank" type="button">Open shared bank in BancyCraft</button>');
$('#tab-bank').attr('hidden','');
$('#requestOrderFunds').attr('hidden','');
const body=$('#main-content').prop('outerHTML')+'<div class="dw-toast" id="ledgerToast" role="status" aria-live="polite" hidden></div>';
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>Dragonwilds Production Ledger</title><link rel="stylesheet" href="ledger.css"></head><body class="dragonwilds-tool-page">${body}<script src="ledger.js"></script><script src="desktop.js"></script></body></html>`);
const source=fs.readFileSync(path.join(website,'assets/js/tannery-ledger.js'),'utf8');
const adapter=`function onAuthStateChanged(_auth,callback){callback(null);}
function getFirebaseServices(){return {auth:null,database:null};}
function isAdminUid(){return Promise.resolve(false);}
function ref(){throw new Error('Use the shared bank window for cloud bookkeeping.');}
const onValue=ref,push=ref,runTransaction=ref,set=ref,update=ref;
`;
fs.writeFileSync(path.join(output,'ledger.js'),adapter+source.slice(source.indexOf('const MATERIAL_STACK')));
const css=fs.readFileSync(path.join(website,'assets/css/tannery-ledger.css'),'utf8').replace('../img/hero/banri-hero-02.webp','hero.webp');
fs.writeFileSync(path.join(output,'ledger.css'),`html,body{margin:0;background:#061016;color:#eaf7f8;font:15px system-ui,sans-serif}button,input,select{font:inherit}button{color:inherit}a{color:#8ce9f1}[hidden]{display:none!important}input,select{color-scheme:dark} .dw-ledger-shell{width:calc(100% - 24px)}\n`+css);
fs.copyFileSync(path.join(website,'assets/img/hero/banri-hero-02.webp'),path.join(output,'hero.webp'));
fs.writeFileSync(path.join(output,'desktop.js'),`// Only public calculations run in this sandboxed frame.
document.getElementById('desktopBank').addEventListener('click',()=>parent.postMessage({kind:'bancy-ledger-bank'},'*'));
document.getElementById('requestOrderFunds').addEventListener('click',event=>{event.stopImmediatePropagation();const order=orderSummary();if(order.totalCost>0)parent.postMessage({kind:'bancy-ledger-bank',order:{amount:order.totalCost,note:orderRequestNote(order)}},'*');},true);
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.kind!=='bancy-ledger-access')return;document.getElementById('tab-bank').hidden=!event.data.unlocked;document.getElementById('requestOrderFunds').hidden=!event.data.unlocked;if(!event.data.unlocked&&document.getElementById('tab-bank').getAttribute('aria-selected')==='true')document.getElementById('tab-profit').click();});
parent.postMessage({kind:'bancy-ledger-ready'},'*');
`);
// An opaque sandbox cannot load file:// subresources. Inline the owned code
// and styles in this frame rather than grant it access to the native parent.
let document=fs.readFileSync(path.join(output,'index.html'),'utf8').replace("script-src 'self'", "script-src 'unsafe-inline'");
const style=fs.readFileSync(path.join(output,'ledger.css'),'utf8').replace('url("hero.webp")','url("data:image/webp;base64,'+fs.readFileSync(path.join(output,'hero.webp')).toString('base64')+'")');
document=document.replace('<link rel="stylesheet" href="ledger.css">',()=>'<style>'+style+'</style>');
const React=require('react'),icons=require('lucide-react'),{renderToStaticMarkup}=require('react-dom/server');
const names=[...new Set([...html.matchAll(/data-lucide="([\w-]+)"/g),...source.matchAll(/data-lucide="([\w-]+)"/g)].map(m=>m[1]))],markup={};
for(const name of names){const Icon=icons[name.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')];if(Icon)markup[name]=renderToStaticMarkup(React.createElement(Icon,{size:20,strokeWidth:1.8}));}
const iconScript='window.lucide={createIcons(){const icons='+JSON.stringify(markup)+';document.querySelectorAll("[data-lucide]").forEach(element=>{if(icons[element.dataset.lucide])element.outerHTML=icons[element.dataset.lucide];});}};';
for(const file of ['ledger.js','desktop.js'])document=document.replace('<script src="'+file+'"></script>',()=>'<script>'+(file==='ledger.js'?iconScript:'')+fs.readFileSync(path.join(output,file),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
// Preserve the desktop design whenever the website calculations are refreshed.
const desktopTheme=fs.readFileSync(path.join(output,'desktop-theme.css'),'utf8');
document=document.replace('</head>',()=>'<style>'+desktopTheme+'</style></head>');
document=document.replace(/<h1[^>]*>[\s\S]*?<\/h1>/,'<h1>Production Ledger</h1>');
fs.writeFileSync(path.join(output,'index.html'),document);
fs.writeFileSync(path.join(root,'docs/LEDGER-SOURCE.json'),JSON.stringify({sourceRepository:website,sourceCommit:require('node:child_process').spawnSync('git',['rev-parse','HEAD'],{cwd:website,encoding:'utf8'}).stdout.trim(),copiedAt:new Date().toISOString(),files:['dragonwilds/tannery-ledger.html','assets/js/tannery-ledger.js','assets/css/tannery-ledger.css'],sharedBank:'https://bancy.gg/dragonwilds/tannery-ledger',localChanges:['remove site navigation/CDNs','offline cloud adapter','key-gated native shared bank bridge']},null,2)+'\n');
console.log('Copied complete public ledger tools, merchant catalog and guide; shared bank remains synchronized with the website.');
