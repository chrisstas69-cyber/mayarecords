const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const ts = require(root + '/node_modules/typescript');
const load = (file, imports) => {
  const mod = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(root + '/' + file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})', {filename:file})(name => { if (!(name in imports)) throw Error('Unmocked import: ' + name); return imports[name]; }, mod, mod.exports);
  return mod.exports;
};
const pricing = load('src/lib/commerce/pricing.ts', {});
let s;
class Query {
  constructor(table) {this.table=table;this.filters=[];this.op='select';}
  select() {return this;}
  update(value) {this.op='update';this.value=value;return this;}
  eq(...args) {this.filters.push(['eq',...args]);return this;}
  lt(...args) {this.filters.push(['lt',...args]);return this;}
  gt(...args) {this.filters.push(['gt',...args]);return this;}
  async execute() {
    s.queries.push(this);
    if (this.op==='update') return {data:s.claimed,error:s.claimError};
    return {data:({orders:s.existing,releases:s.release,tracks:s.track,order_items:s.items,download_tokens:s.token})[this.table],error:s.queryError?.[this.table]??null};
  }
  maybeSingle() {return this.execute();}
  then(resolve,reject) {return this.execute().then(resolve,reject);}
}
const supabase = {
  from(table) {return new Query(table);},
  async rpc(name,args) {s.rpcs.push({name,args});return {data:'order',error:s.rpcError};},
  storage: {from(bucket) {assert.equal(bucket,'masters');return {async createSignedUrl(path,expiry,options) {s.signs.push({path,expiry,options});return {data:s.signed,error:s.signError};}};}}
};
const stripe = { checkout:{sessions:{async retrieve() {if(s.retrieveError)throw Error('Stripe unavailable');return s.session;}, async listLineItems(id,args) {s.pages.push(args); if(s.listError)throw Error('line items failed');return s.linePages[s.pages.length-1];}}}};
const fulfill = load('src/lib/commerce/fulfill.ts', {'server-only':{},'stripe':function(){return stripe;},'@/lib/commerce/pricing':pricing,'@/lib/supabase/server':{createServiceClient:()=>s.configured?supabase:null}}).fulfillCheckoutSession;
const ResponseMock = {json(data,init) {return {data,...init};},redirect(url,init) {return {url,status:307,...init};}};
const route = load('src/app/api/download/[token]/route.ts', {'next/server':{NextResponse:ResponseMock},'@/lib/commerce/pricing':pricing,'@/lib/supabase/server':{createServiceClient:()=>s.configured?supabase:null}}).GET;
const uuid='00000000-0000-4000-8000-000000000001';
const reset = () => s={configured:true,session:{id:'cs_paid',payment_status:'paid',mode:'payment',amount_total:199,currency:'usd',customer_details:{email:'test@example.test'}},existing:null,items:[],release:{id:'release',state:'published',master_url:'masters/ep.zip'},track:{id:'track',release_id:'release',master_url:'masters/track.zip'},rpcs:[],queries:[],pages:[],signs:[],claimed:{token:uuid},signed:{signedUrl:'https://storage.example.test/signed'},token:{token:uuid,item_type:'digital_track',track_id:'track',master_url:'masters/track.zip',expires_at:new Date(Date.now()+3600000).toISOString(),download_count:0,max_downloads:5,releases:{master_url:'masters/ep.zip'}}};
const line=(id,type='merch')=>({id,quantity:1,currency:'usd',price:{unit_amount:199,product:{name:'Item '+id,metadata:{item_type:type,product_id:'product',release_id:'release',track_id:'track'}}}});
let checks=0;
async function test(name,fn){reset();await fn();checks++;}
(async()=>{
  process.env.STRIPE_SECRET_KEY='test-placeholder';
  await test('all pages after first ten',async()=>{s.linePages=[{data:Array.from({length:10},(_,i)=>line('li_'+i)),has_more:true},{data:[line('li_10','digital_track')],has_more:false}];const r=await fulfill('cs_paid');assert.ok(r.order);assert.equal(s.rpcs[0].args.p_items.length,11);assert.equal(s.pages[1].starting_after,'li_9');assert.equal(s.rpcs[0].args.p_items[10].master_url,'masters/track.zip');assert.equal(s.rpcs[0].name,'fulfill_paid_checkout');});
  await test('50 accepted',async()=>{s.linePages=[{data:Array.from({length:50},(_,i)=>line('li_'+i)),has_more:false}];assert.ok((await fulfill('cs_paid')).order);assert.equal(s.rpcs[0].args.p_items.length,50);});
  await test('51 rejected before RPC',async()=>{s.linePages=[{data:Array.from({length:50},(_,i)=>line('li_'+i)),has_more:true}];assert.ok((await fulfill('cs_paid')).error);assert.equal(s.rpcs.length,0);});
  await test('unpaid no reads/writes',async()=>{s.session.payment_status='unpaid';assert.ok((await fulfill('cs_paid')).error);assert.equal(s.queries.length,0);assert.equal(s.rpcs.length,0);});
  await test('idempotent fulfilled load object token',async()=>{s.existing={id:'order',status:'fulfilled',email:'saved@example.test'};s.items=[{item_type:'digital_track',title:'Saved',download_tokens:{token:uuid,expires_at:'future'}}];const r=await fulfill('cs_paid');assert.equal(r.order.downloads[0].token,uuid);assert.equal(r.order.email,'saved@example.test');assert.equal(s.pages.length,0);assert.equal(s.rpcs.length,0);});
  await test('idempotent fulfilled load array token',async()=>{s.existing={id:'order',status:'fulfilled',email:null};s.items=[{item_type:'digital_release',title:'Saved',download_tokens:[{token:uuid,expires_at:'future'}]}];assert.equal((await fulfill('cs_paid')).order.downloads.length,1);});
  await test('unpublished rejected',async()=>{s.linePages=[{data:[line('li_track','digital_track')],has_more:false}];s.release.state='draft';assert.ok((await fulfill('cs_paid')).error);assert.equal(s.rpcs.length,0);});
  await test('track mismatch rejected',async()=>{s.linePages=[{data:[line('li_track','digital_track')],has_more:false}];s.track.release_id='other';assert.ok((await fulfill('cs_paid')).error);assert.equal(s.rpcs.length,0);});
  await test('track missing master never uses EP',async()=>{s.linePages=[{data:[line('li_track','digital_track')],has_more:false}];s.track.master_url=null;assert.ok((await fulfill('cs_paid')).error);assert.equal(s.rpcs.length,0);});
  await test('existing read errors reject',async()=>{s.queryError={orders:{message:'db read failed'}};assert.match((await fulfill('cs_paid')).error,/db read failed/);assert.equal(s.rpcs.length,0);});
  await test('RPC failures reject',async()=>{s.linePages=[{data:[line('li_track','digital_track')],has_more:false}];s.rpcError={message:'transaction failed'};assert.match((await fulfill('cs_paid')).error,/transaction failed/);});
  await test('list pagination failures reject',async()=>{s.listError=true;assert.ok((await fulfill('cs_paid')).error);assert.equal(s.rpcs.length,0);});
  const get=()=>route({}, {params:Promise.resolve({token:uuid})});
  await test('snapshot signed private path',async()=>{const r=await get();assert.equal(r.status,307);assert.equal(s.signs[0].path,'track.zip');assert.equal(s.signs[0].expiry,600);assert.equal(r.headers['Cache-Control'],'private, no-store');assert.ok(s.queries[1].filters.some(f=>f[0]==='eq'&&f[1]==='download_count'&&f[2]===0));});
  await test('historical null track ID still uses snapshot',async()=>{s.token.track_id=null;assert.equal((await get()).status,307);assert.equal(s.signs[0].path,'track.zip');});
  await test('missing track snapshot no EP fallback',async()=>{s.token.master_url=null;assert.equal((await get()).status,404);assert.equal(s.signs.length,0);});
  await test('legacy EP master fallback',async()=>{s.token.item_type='digital_release';s.token.track_id=null;s.token.master_url=null;assert.equal((await get()).status,307);assert.equal(s.signs[0].path,'ep.zip');});
  await test('EP snapshot takes precedence',async()=>{s.token.item_type='digital_release';s.token.track_id=null;s.token.master_url='masters/paid-ep.zip';assert.equal((await get()).status,307);assert.equal(s.signs[0].path,'paid-ep.zip');});
  await test('expired denied',async()=>{s.token.expires_at='2000-01-01';assert.equal((await get()).status,410);assert.equal(s.signs.length,0);});
  await test('exhausted denied',async()=>{s.token.download_count=5;assert.equal((await get()).status,429);assert.equal(s.signs.length,0);});
  await test('unsafe URL denied',async()=>{s.token.master_url='https://public.example.test/audio.zip';assert.equal((await get()).status,404);assert.equal(s.signs.length,0);});
  await test('CAS collision never redirects',async()=>{s.claimed=null;assert.equal((await get()).status,429);});
  await test('claim failure never redirects',async()=>{s.claimError={message:'database unavailable'};assert.equal((await get()).status,500);});
  await test('sign failure does not claim',async()=>{s.signError={message:'not found'};assert.equal((await get()).status,500);assert.equal(s.queries.filter(q=>q.op==='update').length,0);});
  await test('unconfigured fulfillment and delivery',async()=>{s.configured=false;assert.ok((await fulfill('cs_paid')).error);assert.equal((await get()).status,503);});
  console.log(`${checks} fulfillment/delivery contracts passed without Stripe, network, or backend credentials.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
