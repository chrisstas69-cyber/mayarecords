const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const overrides = {};
const cache = new Map();
function load(relative) {
  if(cache.has(relative)) return cache.get(relative);
  const mod={exports:{}};
  if(relative.endsWith('.json')) return {default:JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'))};
  const js=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+js+'\n})')(name=>{
    if(name in overrides) return overrides[name];
    let target=name.startsWith('@/')?'src/'+name.slice(2):path.normalize(path.join(path.dirname(relative),name));
    if(!/\.(json|tsx?)$/.test(target)) target+='.ts';
    return load(target);
  },mod,mod.exports);
  cache.set(relative,mod.exports);return mod.exports;
}
const enrich=load('src/lib/data/artist-enrichment.ts').enrichArtist;
const records=require('../src/lib/data/artists-enrichment.json');
const archive=load('src/lib/data/artists.generated.ts').ARCHIVE_ARTISTS;
let configured=false,throws=false,created=0,rows=[];
class Query {
 constructor(table){this.table=table;this.slug=null;}
 select(){return this;}eq(key,value){if(key==='slug')this.slug=value;return this;}order(){return this;}
 async maybeSingle(){return {data:rows.find(a=>a.slug===this.slug)??null};}
 then(resolve,reject){return Promise.resolve({data:this.table==='artists'?rows:[],error:null}).then(resolve,reject);}
}
overrides['server-only']={};
overrides['@/lib/supabase/config']={isSupabaseConfigured:()=>configured};
overrides['@/lib/supabase/server']={createClient:async()=>{created++;if(throws)throw Error('offline');return {from:table=>new Query(table)}}};
const catalog=load('src/lib/data/catalog.ts');
const seed=load('src/lib/data/seed.ts');
test('all 64 archive slugs are represented exactly once and local images exist',()=>{
 assert.equal(records.length,64);assert.equal(new Set(records.map(r=>r.slug)).size,64);
 assert.deepEqual(records.map(r=>r.slug).sort(),archive.map(r=>r.slug).sort());
 for(const r of records)if(r.photo_url)assert.ok(fs.existsSync(path.join(root,'public',r.photo_url)),r.slug);
});
test('fills empty fields without overwriting current identity, bios, photos or links',()=>{
 const original={...seed.SEED_ARTISTS.find(a=>a.slug==='joeski')};const before=JSON.stringify(original);const result=enrich(original);assert.equal(JSON.stringify(original),before);assert.deepEqual(result,original);
 const empty={id:'h',slug:'harry-romero',name:'Existing Harry name',origin:'',bio:' ',photo_url:null,links:[]};const filled=enrich(empty);assert.equal(filled.name,empty.name);assert.ok(filled.bio.length>0);assert.equal(filled.photo_url,'/images/artists/harry-romero.jpg');assert.ok(filled.links.length>0);assert.equal('confidence' in filled,false);assert.equal('notes' in filled,false);
});
test('unknown slug unchanged and supplied null values stay null',()=>{
 const a={id:'z',slug:'not-an-artist',name:'Unknown',origin:null,bio:null,photo_url:null,links:[]};assert.equal(enrich(a),a);
 const k=enrich({...a,slug:'kax',name:'Káax'});assert.equal(k.bio,null);assert.equal(k.photo_url,null);
});
test('without Supabase every archive artist has a working data result and releases retain their artist IDs',async()=>{
 configured=false;created=0;const artists=await catalog.getArtists();for(const a of archive){assert.ok(artists.some(x=>x.slug===a.slug));const result=await catalog.getArtistBySlug(a.slug);assert.ok(result);assert.equal(result.artist.slug,a.slug);assert.ok(result.releases.every(r=>r.artist_id===result.artist.id));}assert.equal(created,0);assert.equal(await catalog.getArtistBySlug('no-such-artist'),null);
});
test('configured partial database preserves its fields and does not hide archive artists',async()=>{
 configured=true;rows=[{id:'db-harry',slug:'harry-romero',name:'Harry Romero',origin:'Verified location',bio:null,photo_url:null,links:[],releases:[{count:1}]}];
 const artists=await catalog.getArtists();assert.ok(archive.every(a=>artists.some(x=>x.slug===a.slug)));const harry=(await catalog.getArtistBySlug('harry-romero')).artist;assert.equal(harry.id,'db-harry');assert.equal(harry.origin,'Verified location');assert.ok(harry.bio);assert.ok((await catalog.getArtistBySlug('333-3ski')).artist.bio);
});
test('empty, erroring and unreachable database falls back to bundled enrichment',async()=>{
 configured=true;rows=[];assert.ok((await catalog.getArtistBySlug('harry-romero')).artist.bio);assert.ok((await catalog.getArtists()).length>=64);throws=true;assert.ok((await catalog.getArtistBySlug('harry-romero')).artist.bio);assert.ok((await catalog.getArtists()).length>=64);throws=false;configured=false;
});
