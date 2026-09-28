const { _electron: electron } = require('@playwright/test'), fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), profile = path.join(root, 'test-results', 'feedback-061-' + Date.now());
(async () => {
  fs.mkdirSync(profile, { recursive: true });
  const c=require('../src/catalog/data/valheim.json'),item=c.items.find(i=>i.name==='Breastplate of the Protector');
  fs.writeFileSync(path.join(profile,'workspace.json'),JSON.stringify({schemaVersion:2,game:'valheim',plans:[],supplies:[],lists:[{id:'f8585096-65d3-40e8-a4ad-bb26d2453385',name:'Protector QA',game:'valheim',quick:false,targets:[{itemId:item.id,name:item.name,quantity:1}],recipes:{},progress:{},collapsed:{},useSupplies:false,hideCompleted:false,updatedAt:new Date().toISOString()}]}));
  const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: path.join(root, 'release/win-unpacked/BancyCraft.exe'), env });
  try {
    const page = await app.firstWindow();
    await page.getByRole('button', { name: 'Settings & updates', exact: true }).click();
    await page.getByRole('button', { name: 'Report a bug or suggest an idea', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Report a bug or suggest an idea' });
    await modal.getByRole('combobox').selectOption('Suggestion');
    await modal.getByLabel('Subject', { exact: true }).fill('Please add a favorite station filter');
    await modal.getByLabel('Details', { exact: true }).fill('I would like to filter my favorite crafting stations.');
    assert(await modal.getByRole('button', { name: 'Send report', exact: true }).isDisabled());
    await page.screenshot({ path: path.join(root, 'test-results/feedback-settings.png') });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Report a bug or suggest an idea', exact: true }).click();
    assert.equal(await modal.getByLabel('Subject', { exact: true }).inputValue(), 'Please add a favorite station filter');
    await page.keyboard.press('Escape');
    const status = await page.evaluate(() => window.bancy.feedbackStatus()); assert.equal(status.configured, false);
    await page.getByRole('button',{name:'Shopping Lists',exact:true}).click();
    await page.getByRole('button',{name:/Protector QA/}).click();
    await page.getByRole('button',{name:'Crafting tree for Breastplate of the Protector',exact:true}).click();
    const tree=page.getByRole('dialog',{name:'Crafting tree · Breastplate of the Protector',exact:true});
    await tree.getByText('Petrified Tissue',{exact:true}).first().waitFor();
    await tree.getByText('Frost Foundry',{exact:true}).first().waitFor();
    await page.screenshot({path:path.join(root,'test-results/valheim-protector-tree.png')});
    await page.keyboard.press('Escape');
    console.log('Native feedback modal: type, draft retention, safe unconfigured state and Escape passed.');
  } finally { await app.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

