const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.next/micasa-tests');
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'src/lib/micasa.ts','--outDir',out,'--module','commonjs','--target','es2022','--skipLibCheck'],{cwd:root});
const {selectMicasa}=require(path.join(out,'micasa.js'));
const releases=require('../data/micasa-releases.json');
test('15 unique catalog releases and exact selected Discogs record links',()=>{
 assert.equal(releases.length,15);assert.equal(new Set(releases.map(r=>r.catalogNumber)).size,15);
 assert.equal(releases.filter(r=>r.artwork.length).length,13);
 assert.ok(!releases.some(r=>r.catalogNumber==='MICASA009'));
 for(const r of releases){assert.match(r.discogsUrl,new RegExp(`^https://www\\.discogs\\.com/release/${r.discogsId}(?:-|$)`));assert.ok(r.tracks.length);assert.ok(r.year>=2002&&r.year<=2005);for(const a of r.artwork)assert.ok(fs.existsSync(path.join(root,'public',a.src)));}
});
test('misnamed 009 image is matched to El Ritual 008, not a duplicate release',()=>{
 const r=releases.find(r=>r.catalogNumber==='MICASA008');assert.equal(r.discogsId,266699);assert.equal(r.title,'El Ritual');assert.ok(r.artwork.every(a=>a.sourceFilename.startsWith('MICASA009_')));
});
test('missing 015/016 artwork is honest and alternate pressings deduplicated',()=>{
 for(const n of ['MICASA015','MICASA016'])assert.equal(releases.find(r=>r.catalogNumber===n).artwork.length,0);
 for(const r of releases)assert.equal(new Set(r.pressings.map(p=>p.id)).size,r.pressings.length);
});
test('multiword artist/title/track/catalog search, years, empty/reset and sorting',()=>{
 const before=JSON.stringify(releases);
 assert.equal(selectMicasa(releases,' onionz THRU ','2002','catalog').length,1);
 assert.equal(selectMicasa(releases,'progresso','all','catalog')[0].catalogNumber,'MICASA008');
 assert.equal(selectMicasa(releases,'micasa016','all','catalog')[0].discogsId,523181);
 assert.equal(selectMicasa(releases,'no such record','all','catalog').length,0);
 assert.equal(selectMicasa(releases,'Onionz','2004','catalog').length,0);
 assert.equal(selectMicasa(releases,'','all','catalog').length,15);
 const newest=selectMicasa(releases,'','all','newest');assert.equal(newest[0].year,2005);assert.equal(newest.at(-1).year,2002);
 assert.deepEqual(selectMicasa(releases,'','all','catalog').map(r=>r.catalogNumber),releases.map(r=>r.catalogNumber));assert.equal(JSON.stringify(releases),before);
});
test('archive has no commerce or audio integration, and links and controls are accessible',()=>{
 const s=fs.readFileSync(path.join(root,'src/components/site/MicasaArchive.tsx'),'utf8');
 assert.doesNotMatch(s,/addItem|useCart|AudioPlayer|stripe|supabase|<audio/i);assert.match(s,/noopener noreferrer/);assert.match(s,/aria-pressed/);assert.match(s,/role="status"/);assert.match(s,/Original artwork not recovered/);
 const tabs=fs.readFileSync(path.join(root,'src/components/site/DiscographyTabs.tsx'),'utf8');assert.match(tabs,/\/labels\/micasa/);
});
test('rendered page retains every release, primary URL, track and missing-artwork disclosure',()=>{
 const vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const mod={exports:{}};
 const js=ts.transpileModule(fs.readFileSync(path.join(root,'src/components/site/MicasaArchive.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const imports={'@/lib/micasa':{selectMicasa},'../../../data/micasa-releases.json':{default:releases},'next/image':{default:({src,alt})=>React.createElement('img',{src,alt})},'lucide-react':{Search:()=>null,ArrowUpRight:()=>null}};
 vm.runInThisContext('(function(require,module,exports){'+js+'\n})')(n=>n in imports?imports[n]:require(n),mod,mod.exports);
 const html=renderToStaticMarkup(React.createElement(mod.exports.MicasaArchive));
 assert.equal((html.match(/<article /g)||[]).length,15);assert.equal((html.match(/Original artwork not recovered/g)||[]).length,2);assert.match(html,/Showing 15 of 15 releases/);
 for(const r of releases){assert.ok(html.includes(`href="${r.discogsUrl}"`));assert.ok(html.includes(`${r.catalogNumber}-title`));}
 assert.doesNotMatch(html,/<audio|Add to cart|Buy MP3|\$\d/);
});
