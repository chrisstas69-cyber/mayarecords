const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, imports = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename: file })(name => {
    if (!(name in imports)) throw Error('Unmocked import: ' + name);
    return imports[name];
  }, mod, mod.exports);
  return mod.exports;
}
const catalog = load('src/lib/catalog-browser.ts');
const promo = load('src/lib/promotion.ts');
const releases = [
  { id:'1',slug:'maya001',catalog_number:'MAYA001',title:'Água',artist_name:'Zulu',genre:'House',release_date:'2020-01-01',digital_price_cents:199,preview_url:'/audio.mp3',state:'published',tracks:[{title:'Joeski Remix'}] },
  { id:'2',slug:'maya264',catalog_number:'MAYA264',title:'Dance',artist_name:'Alpha',genre:'Tribal',release_date:'2026-10-16',digital_price_cents:599,preview_url:null,state:'published',tracks:[] },
  { id:'x',slug:'ruben-zurita-x',catalog_number:'TBC',title:'X',artist_name:'Ruben Zurita',genre:'House',release_date:null,digital_price_cents:null,preview_url:null,state:'published',tracks:[] },
];
const select = (filters={}, sort='cat-desc') => catalog.selectCatalog(releases,{...catalog.EMPTY_CATALOG_FILTERS,...filters},sort,['1']);
test('catalog searches accents, multiple words and track mixes, combining filters', () => {
  assert.deepEqual(select({query:' AGUA joeski '}).map(r=>r.id),['1']);
  assert.equal(select({query:'X',genre:'House',artist:'Ruben Zurita'}).length,1);
  assert.equal(select({query:'X',genre:'Tribal'}).length,0);
  assert.deepEqual(select({availability:'preview'}).map(r=>r.id),['1']);
  assert.equal(select({availability:'direct'}).length,2);
  assert.deepEqual(select({savedOnly:true}).map(r=>r.id),['1']);
});
test('all six sorts preserve source and put unconfirmed numbers/missing dates last', () => {
  const before=JSON.stringify(releases);
  for(const sort of ['cat-desc','cat-asc','date-desc','date-asc']) {
    assert.equal(select({},sort).at(-1).id,'x');
    assert.equal(select({},sort)[0].id,sort.endsWith('asc')?'1':'2');
  }
  assert.equal(select({},'title-asc')[0].id,'1');
  assert.equal(select({},'artist-asc')[0].id,'2');
  assert.equal(JSON.stringify(releases),before);
});
test('pagination clamps after shrinking results and supports empty / all', () => {
  assert.deepEqual(catalog.catalogPage([1,2,3],9,2),{pages:2,current:2,visible:[3]});
  assert.deepEqual(catalog.catalogPage([],9,20),{pages:1,current:1,visible:[]});
  assert.deepEqual(catalog.catalogPage([1,2,3],9,0),{pages:1,current:1,visible:[1,2,3]});
});
test('promotion validates public destinations and rejects executable/malformed values', () => {
  for(const url of ['/store','/releases/maya264','https://example.com/shop?item=shirt']) assert.equal(promo.safePublicUrl(url),true,url);
  for(const url of ['javascript:alert(1)','data:text/html,x','http://example.com','//example.com','/\\evil.com','https://user:password@example.com','/space path','/new\nline']) assert.equal(promo.safePublicUrl(url),false,url);
  for(const value of [null,[],{enabled:'true'},{kind:'invalid'},{title:7},{title:'a'.repeat(121)},{description:'a'.repeat(501)},{primary_url:'javascript:alert(1)'},{secondary_label:'More'},{release_slug:'../draft'}]) assert.ok(promo.validatePromotion(value).error);
  assert.ok(promo.validatePromotion({kind:'presale'}).error);
  assert.ok(promo.validatePromotion({kind:'merch',title:'Shirt',primary_label:'Shop',primary_url:'/store'}).value);
});
test('automatic release promotion chooses next published release, otherwise latest; hides unavailable selections', () => {
  const config=promo.PROMOTION_DEFAULTS;
  assert.equal(promo.resolvePromotion(config,releases,'2026-10-23').release.id,'2');
  assert.equal(promo.resolvePromotion(config,releases,'2026-10-01').badge,'Upcoming release');
  const later={...releases[1],id:'later',release_date:'2026-12-01'};
  const draft={...releases[1],id:'draft',slug:'draft',release_date:'2026-10-02',state:'draft'};
  assert.equal(promo.resolvePromotion(config,[later,draft,...releases],'2026-10-01').release.id,'2');
  assert.equal(promo.resolvePromotion({...config,release_slug:'maya001'},releases,'2026-10-23').release.id,'1');
  assert.equal(promo.resolvePromotion({...config,release_slug:'draft'},[draft,...releases],'2026-10-23'),null);
  assert.equal(promo.resolvePromotion({...config,enabled:false},releases,'2026-10-23'),null);
  assert.equal(promo.resolvePromotion(config,[],'2026-10-23'),null);
});
test('merch and arbitrary campaigns do not borrow unrelated release music; presale needs a real destination', () => {
  for (const kind of ['merch','campaign','presale']) {
    const config={...promo.PROMOTION_DEFAULTS,kind,title:'New collection',primary_label:'Shop',primary_url:'https://example.com/shop'};
    const result=promo.resolvePromotion(config,releases,'2026-10-23');
    assert.equal(result.release,undefined);
    assert.equal(result.href,'https://example.com/shop');
    assert.equal(result.title,'New collection');
  }
  const fallback={...promo.PROMOTION_DEFAULTS,title:'Configured fallback'};
  assert.equal(promo.readPromotion({},fallback).title,'Configured fallback');
  assert.equal(promo.readPromotion({title:7},fallback),fallback);
});
test('settings action authenticates admin, validates before writes, handles RLS/zero-row failure and revalidates both pages', async () => {
  let state;
  class Query {
    constructor(table) {this.table=table;}
    select() {return this;}
    eq() {return this;}
    update(value) {state.writes.push(value);return this;}
    async maybeSingle() {return this.table==='profiles'?{data:{role:state.role},error:null}:{data:state.row,error:state.error};}
  }
  const client={auth:{getUser:async()=>({data:{user:state.user}})},from:table=>new Query(table)};
  const {updateSiteSettings}=load('src/lib/actions/settings.ts',{'next/cache':{revalidatePath:(...args)=>state.revalidated.push(args)},'@/lib/supabase/server':{createClient:async()=>state.configured?client:null},'@/lib/promotion':promo});
  const input={hero_headline:'Test',hero_subline:'',hero_media_url:'',booking_email:'',demo_email:'',promotion:promo.PROMOTION_DEFAULTS};
  const reset=()=>state={configured:true,user:{id:'admin'},role:'admin',row:{id:1},error:null,writes:[],revalidated:[]};
  reset();assert.equal((await updateSiteSettings(input)).ok,true);assert.equal(state.writes.length,1);assert.deepEqual(state.revalidated,[['/','layout'],['/releases']]);
  for(const patch of [{configured:false},{user:null},{role:'artist'}]) {reset();Object.assign(state,patch);assert.equal((await updateSiteSettings(input)).ok,false);assert.equal(state.writes.length,0);}
  reset();assert.equal((await updateSiteSettings({...input,promotion:{primary_url:'javascript:alert(1)'}})).ok,false);assert.equal(state.writes.length,0);
  for(const patch of [{row:null},{error:{message:'row-level security denied'}},{error:{message:'column promotion does not exist'}}]) {reset();Object.assign(state,patch);assert.equal((await updateSiteSettings(input)).ok,false);assert.equal(state.revalidated.length,0);}
});
test('public settings gracefully handle absent backend, absent migration and configured promotion', async () => {
  let configured=false, calls=0, row=null;
  class Query {select(){return this;}eq(){return this;}async maybeSingle(){return {data:row};}}
  const data=load('src/lib/data/catalog.ts',{'server-only':{},'@/lib/supabase/server':{createClient:async()=>{calls++;return {from:()=>new Query()};}},'@/lib/supabase/config':{isSupabaseConfigured:()=>configured},'./seed':{SEED_RELEASES:releases},'../../../data/site-promotion.json':{default:require('../data/site-promotion.json')},'../promotion':promo});
  assert.equal((await data.getSiteSettings()).promotion.kind,'release');assert.equal(calls,0);
  configured=true;row={hero_headline:'Existing CMS before migration'};
  assert.equal((await data.getSiteSettings()).promotion.kind,'release');
  row={promotion:{enabled:true,kind:'campaign',title:'Radio',primary_label:'Listen',primary_url:'/mixes'}};
  assert.equal((await data.getSiteSettings()).promotion.title,'Radio');
  row={promotion:{primary_url:'javascript:alert(1)'}};
  assert.equal((await data.getSiteSettings()).promotion.kind,'release');
});
