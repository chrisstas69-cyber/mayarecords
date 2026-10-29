const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..');
function load(file,imports={}){const mod={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext('(function(require,module,exports){'+js+'\n})')(n=>n in imports?imports[n]:require(n),mod,mod.exports);return mod.exports;}
const data=require('../data/big-chief-releases.json'),micasa=require('../data/micasa-releases.json');
const selection=load('src/lib/micasa.ts');
const archive=load('src/components/site/MicasaArchive.tsx',{'@/lib/micasa':selection,'../../../data/micasa-releases.json':{default:micasa},'next/image':{default:({src,alt})=>React.createElement('img',{src,alt})},'lucide-react':{Search:()=>null,ArrowUpRight:()=>null}});
const showcases=load('src/lib/release-showcase.ts',{'../../data/big-chief-releases.json':{default:data},'../../data/micasa-releases.json':{default:micasa}});
const feature=load('src/components/site/ReleaseShowcase.tsx',{'next/image':{default:({src,alt})=>React.createElement('img',{src,alt})},'next/link':{default:({children,...p})=>React.createElement('a',p,children)},'lucide-react':{ArrowUpRight:()=>null,Headphones:()=>null},'@/lib/release-showcase':showcases});
const render=r=>renderToStaticMarkup(React.createElement(archive.VinylArchive,{releases:r,label:'Big Chief',labelUrl:'https://www.discogs.com/label/5300-Big-Chief'}));
test('25 BC catalogs, 40 local sides, no unrelated CB-1 or duplicate promo cards',()=>{
 assert.equal(data.length,25);assert.equal(new Set(data.map(r=>r.catalogNumber)).size,25);assert.equal(data.flatMap(r=>r.artwork).length,40);
 for(let i=0;i<25;i++)assert.equal(data[i].catalogNumber,'BC'+String(i+1).padStart(3,'0'));
 for(const r of data){assert.match(r.discogsUrl,new RegExp(`^https://www\\.discogs\\.com/release/${r.discogsId}(?:-|$)`));assert.ok(r.tracks.length);assert.ok(r.artwork.length);assert.equal(new Set(r.pressings.map(p=>p.id)).size,r.pressings.length);for(const a of r.artwork)assert.ok(fs.existsSync(path.join(root,'public',a.src)));}
 assert.ok(data.find(r=>r.catalogNumber==='BC016').format.startsWith('2 ×'));
});
test('render archive includes all primary links/tracks and correctly named artwork controls',()=>{
 const html=render(data);assert.equal((html.match(/<article /g)||[]).length,25);assert.match(html,/Showing 25 of 25 releases/);assert.match(html,/Additional label/);assert.match(html,/Illustrated label/);
 for(const r of data){assert.ok(html.includes(`href="${r.discogsUrl}"`));assert.ok(html.includes(`${r.catalogNumber}-title`));}
 assert.match(html,/https:\/\/www.discogs.com\/label\/5300-Big-Chief/);assert.doesNotMatch(html,/<audio|Add to cart|Buy MP3|\$\d/);
});
test('shared archive filters work for Big Chief and tolerate an empty dataset',()=>{
 assert.equal(selection.selectMicasa(data,'jay tripwire peeping','2002','catalog')[0].catalogNumber,'BC007');assert.equal(selection.selectMicasa(data,'BC025','all','catalog')[0].discogsId,261299);assert.equal(selection.selectMicasa(data,'nonexistent','all','catalog').length,0);
 assert.match(render([]),/No releases match/);assert.doesNotMatch(render([]),/Infinity|NaN/);
});
test('sample campaigns reuse historical truth and have no fake schedule/audio/video',()=>{
 assert.equal(showcases.RELEASE_SHOWCASES.length,2);
 for(const s of showcases.RELEASE_SHOWCASES){assert.equal(s.isDemo,true);assert.equal(s.scheduledDate,null);assert.equal(s.audioUrl,null);assert.equal(s.videoUrl,null);assert.ok(s.release.discogsUrl);assert.ok(s.exampleReleasePriceCents<=s.exampleTrackPriceCents*s.release.tracks.length);}
 assert.equal(showcases.RELEASE_SHOWCASES[0].release.title,'Peeping Tom');
});
test('demo detail has disabled full-release and track purchases, no audio/autoplay/cart',()=>{
 for(const s of showcases.RELEASE_SHOWCASES){const html=renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(feature.ReleaseShowcaseFeature,{showcase:s,full:true}),React.createElement(feature.SampleTracklist,{showcase:s})));
 assert.match(html,/Design demo only/);assert.match(html,/not a reissue announcement, preorder or sale/);assert.match(html,/Preview audio not supplied/);assert.match(html,/not scheduled/);assert.match(html,/Full release/);assert.equal((html.match(/disabled=""/g)||[]).length,s.release.tracks.length+2);assert.doesNotMatch(html,/<audio|<video|autoplay|checkout|Add to cart/);}
});
test('demo routes noindex, excluded from sitemap, future Maya hub guarded through existing data layer',()=>{
 const sample=fs.readFileSync(path.join(root,'src/app/(site)/showcase/[slug]/page.tsx'),'utf8'),hub=fs.readFileSync(path.join(root,'src/app/(site)/new-releases/page.tsx'),'utf8');
 assert.match(sample,/index: false/);assert.match(sample,/notFound\(\)/);assert.match(hub,/index: false/);assert.match(hub,/dynamic = "force-dynamic"/);assert.match(hub,/latestHomeReleases\(await getPublishedReleases/);
 const sitemap=fs.readFileSync(path.join(root,'src/app/sitemap.ts'),'utf8');assert.match(sitemap,/\/labels\/big-chief/);assert.doesNotMatch(sitemap,/\/showcase\/|\/new-releases/);
});
test('homepage primary action leads to release-first hub and Big Chief founder credit matches approval',()=>{
 const home=fs.readFileSync(path.join(root,'src/components/site/HomePageLanding.tsx'),'utf8');assert.match(home,/home-button--primary" href="\/new-releases"/);
 const page=fs.readFileSync(path.join(root,'src/app/(site)/labels/big-chief/page.tsx'),'utf8');assert.match(page,/Founded by Joeski &amp; Stas/);
 const tabs=fs.readFileSync(path.join(root,'src/components/site/DiscographyTabs.tsx'),'utf8');assert.match(tabs,/\/labels\/big-chief/);assert.match(tabs,/\/labels\/micasa/);
});
test('Big Chief header uses supplied emblem and real vector lettering, not a guessed font',()=>{
 const page=fs.readFileSync(path.join(root,'src/app/(site)/labels/big-chief/page.tsx'),'utf8');assert.match(page,/emblem-artwork\.webp/);assert.match(page,/wordmark-gold\.svg/);assert.match(page,/<span className="sr-only">Big Chief<\/span>/);
 for(const name of ['gold','white']){const svg=fs.readFileSync(path.join(root,`public/images/labels/big-chief/wordmark-${name}.svg`),'utf8');assert.match(svg,/<path /);assert.doesNotMatch(svg,/<image|<script|data:/);}
 const provenance=require('../data/big-chief-brand.json');assert.match(provenance.sha256,/^[a-f0-9]{64}$/);assert.match(provenance.wordmark,/not an identified or reusable font/);
 const html=renderToStaticMarkup(React.createElement(feature.ReleaseShowcaseFeature,{showcase:showcases.RELEASE_SHOWCASES[0]}));assert.match(html,/wordmark-gold\.svg/);assert.match(html,/alt="Big Chief"/);
});
