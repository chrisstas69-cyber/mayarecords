const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'.next/mix-tests');
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'src/lib/mixes.ts','src/lib/soundcloud.ts','--outDir',out,'--module','commonjs','--target','es2022','--skipLibCheck'],{cwd:root,stdio:'inherit'});
const {canonicalSoundCloudTrack,soundCloudEmbedUrl} = require(path.join(out,'soundcloud.js'));
const {mixDate,mixDateLabel,mixDuration,selectMixes,mixYears} = require(path.join(out,'mixes.js'));
const mixes = require('../data/joeski-mixes.json');
const sources = require('../data/joeski-mixes-sources.json');
const audit = require('../data/joeski-mixes-import.json');

test('SoundCloud tracks are canonical and profiles, playlists, foreign hosts and unsafe URLs are rejected',()=>{
 assert.equal(canonicalSoundCloudTrack('https://www.soundcloud.com/djjoeski/deeper-rythms-vol-9?x=1#t=2'),'https://soundcloud.com/djjoeski/deeper-rythms-vol-9');
 for(const bad of [null,'','https://soundcloud.com/djjoeski','https://soundcloud.com/djjoeski/sets/x','https://soundcloud.com/djjoeski/tracks','https://soundcloud.com.evil.test/user/track','http://soundcloud.com/user/track','javascript:alert(1)','https://user:secret@soundcloud.com/user/track','https://soundcloud.com:444/user/track','https://soundcloud.com/user/track\\x','https://soundcloud.com/user/track\n','https://soundcloud.com/user/%74rack'])assert.equal(canonicalSoundCloudTrack(bad),null,bad);
 const embed = new URL(soundCloudEmbedUrl('https://soundcloud.com/djjoeski/deeper-rythms-vol-9'));
 assert.equal(embed.origin,'https://w.soundcloud.com');assert.equal(embed.searchParams.get('auto_play'),'false');assert.equal(embed.searchParams.get('single_active'),'true');assert.equal(embed.searchParams.get('url'),'https://soundcloud.com/djjoeski/deeper-rythms-vol-9');assert.equal(soundCloudEmbedUrl('https://evil.test/a/b'),null);
});

test('published archive is complete, deduplicated, source-backed, with local covers and no full audio in Git',()=>{
 assert.equal(audit.archive_complete,true,'Do not ship a partial archive');
 assert.equal(audit.published_mix_count,mixes.length);assert.equal(audit.source_mix_count,mixes.length+audit.duplicates.length);
 assert.equal(new Set(mixes.map(m=>m.id)).size,mixes.length);assert.equal(new Set(mixes.map(m=>m.slug)).size,mixes.length);
 assert.equal(mixes.filter(m=>m.external_url).length,audit.verified_soundcloud_count);
 assert.equal(new Set(mixes.filter(m=>m.external_url).map(m=>m.external_url)).size,audit.verified_soundcloud_count);
 assert.equal(mixes.filter(m=>!m.external_url).length,audit.pending_soundcloud_count);
 for(const mix of mixes){
  assert.ok(mix.duration_seconds>0);assert.equal(mix.audio_url,null);assert.equal(mix.recorded_on,null);assert.match(mix.cover_url,/^\/images\/mixes\/mix-[a-f0-9]+\.(jpg|jpeg|png|webp)$/);assert.ok(fs.statSync(path.join(root,'public',mix.cover_url)).size>0);
  const source = sources[mix.id];assert.ok(source);assert.match(source.sha256,/^[a-f0-9]{64}$/);assert.ok(!path.isAbsolute(source.source_file));assert.equal(source.duration_seconds,mix.duration_seconds);
  if(mix.external_url){assert.equal(canonicalSoundCloudTrack(mix.external_url),mix.external_url);assert.equal(source.soundcloud.url,mix.external_url);assert.equal(mix.published_on,source.soundcloud.date?.slice(0,10)||null);} else assert.equal(source.match,'pending');
 }
 const tracked = execFileSync('git',['ls-files','public/images/mixes'],{cwd:root,encoding:'utf8'});assert.ok(!/\.(mp3|wav|aiff|flac)$/im.test(tracked));
});

test('date semantics and full-hour durations are honest',()=>{
 const base={recorded_on:null,published_on:null,archive_date:'2017-03-17'};
 assert.equal(mixDate(base),'2017-03-17');assert.equal(mixDateLabel(base),'Archive date');assert.equal(mixDateLabel({...base,published_on:'2018-01-02'}),'Published');assert.equal(mixDate({...base,published_on:'2018-01-02'}),'2018-01-02');assert.equal(mixDateLabel({...base,recorded_on:'2016-01-01'}),'Recorded');
 assert.equal(mixDuration(3631),'1:00:31');assert.equal(mixDuration(3599),'59:59');assert.equal(mixDuration(18000),'5:00:00');for(const bad of [null,NaN,-1,0])assert.equal(mixDuration(bad),'Length unavailable');
});

test('multiword accent-insensitive search, year and length filters intersect',()=>{
 const fixture=[{id:'a',title:'Montréal Stereo live',archive_date:'2023-11-18',duration_seconds:7200},{id:'b',title:'Radio mix',archive_date:'2017-01-02',duration_seconds:3599},{id:'c',title:'Studio',archive_date:'2017-02-02',duration_seconds:3600},{id:'d',title:'Unknown',duration_seconds:null}];
 assert.deepEqual(selectMixes(fixture,' MONTREAL stereo ').map(m=>m.id),['a']);assert.equal(selectMixes(fixture,'montreal','2017').length,0);
 assert.deepEqual(selectMixes(fixture,'','2017','short').map(m=>m.id),['b']);assert.deepEqual(selectMixes(fixture,'','','medium').map(m=>m.id),['c']);assert.deepEqual(selectMixes(fixture,'','','long').map(m=>m.id),['a']);
 assert.equal(selectMixes(fixture,'not-a-real-set').length,0);assert.deepEqual(mixYears(fixture),['2023','2017']);
});

test('all sorts retain catalog without mutating it; pages cover every mix exactly once',()=>{
 const before=JSON.stringify(mixes);
 for(const sort of ['newest','oldest','title','longest']){
  const result=selectMixes(mixes,'','','',sort);assert.equal(result.length,mixes.length);
  for(let i=1;i<result.length;i++){
   const a=result[i-1],b=result[i];
   if(sort==='newest')assert.ok(mixDate(a)>=mixDate(b));if(sort==='oldest')assert.ok(mixDate(a)<=mixDate(b));if(sort==='title')assert.ok(a.title.localeCompare(b.title,'en')<=0);if(sort==='longest')assert.ok(a.duration_seconds>=b.duration_seconds);
  }
  const paged=[];for(let i=0;i<result.length;i+=12)paged.push(...result.slice(i,i+12));assert.deepEqual(paged,result);
 }
 assert.equal(JSON.stringify(mixes),before);
});


test('published mix reads are guarded, use bundled archive on absent/error/empty backend, and respect published DB results', async()=>{
 const ts=require('typescript'),vm=require('node:vm');
 async function load(configured,data,error){
  let created=0,selected=false;const query={select(){return this},eq(key,value){assert.equal(key,'state');assert.equal(value,'published');selected=true;return this},async order(){return {data,error}}};
  const imports={'server-only':{},'@/lib/supabase/server':{createClient:async()=>{created++;return {from(table){assert.equal(table,'mixes');return query}}}},'@/lib/supabase/config':{isSupabaseConfigured:()=>configured},'./seed':{SEED_MIXES:mixes},'../../../data/site-promotion.json':{},'../promotion':{readPromotion:()=>null}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,'src/lib/data/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{if(!(name in imports))throw Error('Unmocked import '+name);return imports[name]},mod,mod.exports);
  const result=await mod.exports.getPublishedMixes();assert.equal(created,configured?1:0);assert.equal(selected,configured);return result;
 }
 assert.equal(await load(false,null,null),mixes);assert.equal(await load(true,null,{message:'unconfigured table'}),mixes);assert.equal(await load(true,[],null),mixes);
 const database=[{id:'live-mix',state:'published'}];assert.equal(await load(true,database,null),database);
 assert.match(fs.readFileSync(path.join(root,'src/app/(site)/mixes/page.tsx'),'utf8'),/export const dynamic = ["']force-dynamic["']/);
});
