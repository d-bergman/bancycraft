const { _electron: electron } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const profile = path.join(root, 'test-results', `lists-profile-${Date.now()}`);
const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE;
const executablePath = process.argv[2] || require('electron');
async function launch() { const app = await electron.launch({ executablePath, args: process.argv[2] ? [] : [root], env }); const page = await app.firstWindow(); await page.getByRole('heading', { name:'Your next build starts here.' }).waitFor(); return {app,page}; }
async function stored(page) { return page.evaluate(() => window.bancy.load()); }
async function idle(page) { await page.waitForFunction(() => !document.querySelector('[aria-label="Active game"]').disabled); }
(async()=>{
  fs.mkdirSync(profile,{recursive:true});
  const old = {schemaVersion:1,game:'dragonwilds',plans:[{id:'legacy-plan',name:'Keep my project',game:'dragonwilds',quantity:2,notes:'Legacy notes',status:'planned',updatedAt:'2026-09-27'}],supplies:[]};
  fs.writeFileSync(path.join(profile,'workspace.json'),JSON.stringify(old));
  let run=await launch();const errors=[];
  try {
    run.page.on('pageerror',error=>errors.push(error.message));await run.page.context().setOffline(true);
    await run.page.getByRole('button',{name:'Item Browser',exact:true}).click();
    await run.page.getByLabel('Search catalog',{exact:true}).fill('Fine Cloth');
    await run.page.getByLabel('Quantity for Fine Cloth',{exact:true}).fill('2');
    await run.page.getByRole('button',{name:'Add Fine Cloth to list',exact:true}).click();
    await run.page.getByRole('button',{name:'New list',exact:true}).click();
    await run.page.getByLabel('List name',{exact:true}).fill('Workshop test');
    await run.page.getByRole('button',{name:'Create & add items',exact:true}).click();
    await run.page.getByRole('dialog',{name:'Pick a list'}).waitFor({state:'hidden'});
    let data=await stored(run.page);assert.equal(data.lists[0].targets[0].quantity,2);assert.equal(data.plans[0].notes,'Legacy notes');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(profile,'workspace.json.v1.bak'))),old);
    await run.page.getByRole('button',{name:'Open list',exact:true}).click();
    const thread=run.page.getByLabel('Requirement Fine Thread',{exact:true});await thread.waitFor();
    await thread.getByRole('button',{name:'Complete Fine Thread',exact:true}).click();await idle(run.page);
    data=await stored(run.page);const {buildShoppingList}=await import('../src/planner/engine.mjs');const catalog=require('../src/catalog/data/dragonwilds.json');
    const computed=buildShoppingList(data.lists[0],catalog);assert.ok(computed.rows.some(r=>r.inherited>0&&r.name!=='Fine Cloth'));
    await run.page.screenshot({path:path.join(root,'test-results','shopping-desktop.png')});
    await thread.getByRole('button',{name:'Reset Fine Thread',exact:true}).click();await idle(run.page);
    assert.ok(!Object.values((await stored(run.page)).lists[0].progress).some(n=>n>0));
    await run.page.getByRole('button',{name:'Complete Fine Cloth',exact:true}).click();await idle(run.page);
    assert.equal((await stored(run.page)).lists.length,1,'Saved lists remain after completion');
    await run.page.getByLabel('Hide completed rows',{exact:true}).check();await idle(run.page);
    assert.equal(await run.page.locator('.shopping-row').count(),0);
    await run.page.getByLabel('Hide completed rows',{exact:true}).uncheck();await idle(run.page);
    await run.page.getByRole('button',{name:'Reset Target items',exact:true}).click();await idle(run.page);
    await run.page.getByRole('button',{name:'Item Browser',exact:true}).click();
    await run.page.getByLabel('Search catalog',{exact:true}).fill('Coarse Thread');
    await run.page.getByRole('button',{name:'Quick list for Coarse Thread',exact:true}).click();await idle(run.page);
    await run.page.getByRole('button',{name:'Complete Coarse Thread',exact:true}).click();await idle(run.page);
    assert.equal((await stored(run.page)).lists.length,1,'Completed quick list is removed');
    await run.page.getByRole('button',{name:'Item Browser',exact:true}).click();await run.page.getByLabel('Search catalog',{exact:true}).fill('Bronze');
    await run.page.getByLabel('Select Bronze Sword',{exact:true}).check();assert.equal(await run.page.getByLabel('Selected items',{exact:true}).count(),0);
    await run.page.getByLabel('Select Bronze Dagger',{exact:true}).check();await run.page.getByLabel('Selected items',{exact:true}).waitFor();
    await run.page.getByLabel('Selected items',{exact:true}).scrollIntoViewIfNeeded();
    await run.page.screenshot({path:path.join(root,'test-results','search-selection-desktop.png')});
    await run.page.getByRole('button',{name:'Add selection to a list',exact:true}).click();
    await run.page.locator('.picker-row').filter({hasText:'Workshop test'}).click();await idle(run.page);
    await run.page.getByRole('dialog',{name:'Pick a list'}).waitFor({state:'hidden'});assert.equal((await stored(run.page)).lists[0].targets.length,3);
    await run.page.getByRole('button',{name:'Gearsets',exact:true}).click();await run.page.getByLabel('Search gearsets',{exact:true}).fill('Iron');
    await run.page.getByRole('button',{name:'Add gearset to list',exact:true}).click();await run.page.locator('.picker-row').filter({hasText:'Workshop test'}).click();
    await run.page.getByRole('dialog',{name:'Pick a list'}).waitFor({state:'hidden'});assert.equal((await stored(run.page)).lists[0].targets.length,6);
    await run.app.close();run=await launch();assert.equal((await stored(run.page)).lists[0].targets.length,6);
    await run.page.getByRole('button',{name:'Shopping Lists',exact:true}).click();await run.page.getByRole('button',{name:/^Workshop test/}).click();
    await run.app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1050,740));
    assert.equal(await run.page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    const help=await run.page.getByRole('button',{name:'Help',exact:true}).boundingBox();assert.ok(help.y+help.height<=await run.page.evaluate(()=>window.innerHeight));
    await run.page.screenshot({path:path.join(root,'test-results','shopping-compact.png')});
    await run.page.getByRole('button',{name:'Settings & updates',exact:true}).click();await run.page.getByRole('button',{name:'Check for updates',exact:true}).waitFor();
    await run.page.screenshot({path:path.join(root,'test-results','updates-desktop.png')});
    assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',profile,checks:['legacy migration and backup','item quantity and new-list drawer','pre-craft completion propagation and reset','regular list retention','hide completed','quick list deletion','multi-select and add to existing list','gearset bundle','restart persistence','compact layout','updater control']},null,2));
  } catch(error){ await run.page.screenshot({path:path.join(root,'test-results','lists-failure.png')}).catch(()=>{});console.error((await run.page.locator('body').innerText()).slice(-5000));throw error; }
  finally{await run.app.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
