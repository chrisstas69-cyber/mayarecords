const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.next/remix-tests');
execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
  'src/lib/remixes.ts', '--outDir', out, '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck'], { cwd: root, stdio: 'inherit' });
const { selectRemixes, remixLabels, remixYearRange, remixDisplayTitle } = require(path.join(out, 'remixes.js'));
const source = require('../data/joeski-remixes.json');
const artwork = require('../data/joeski-remixes-artwork.json');
const overrides = require('../data/joeski-remixes-overrides.json');
const remixes = source.map(row => ({ ...row, cover_url: artwork[row.id]?.cover_url ?? null, ...overrides[row.id] }));

test('all 114 distinct source entries are retained; store URLs are exact HTTPS track links', () => {
  assert.equal(source.length, 114);
  assert.equal(new Set(source.map(row => row.id)).size, 114);
  assert.equal(source.filter(row => row.beatport_url).length, 102);
  assert.equal(source.filter(row => !row.beatport_url).length, 12);
  for (const row of source) {
    assert.match(row.traxsource_url, /^https:\/\/www\.traxsource\.com\/track\/\d+\//);
    if (row.beatport_url) assert.match(row.beatport_url, /^https:\/\/www\.beatport\.com\/track\/[^/]+\/\d+$/);
    assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(row.date)));
    assert.ok(['verified', 'different_mix', 'not_on_beatport'].includes(row.beatport_status));
    assert.equal(row.beatport_status === 'not_on_beatport', row.beatport_url === null);
  }
});

test('all four sorts work without mutating source order or URLs', () => {
  const before = JSON.stringify(remixes);
  for (const sort of ['newest', 'oldest', 'title', 'artist']) {
    const result = selectRemixes(remixes, '', '', sort);
    assert.equal(result.length, 114);
    for (let i = 1; i < result.length; i++) {
      if (sort === 'newest') assert.ok(result[i-1].date >= result[i].date);
      if (sort === 'oldest') assert.ok(result[i-1].date <= result[i].date);
      if (sort === 'title') assert.ok(remixDisplayTitle(result[i-1]).localeCompare(remixDisplayTitle(result[i]), 'en') <= 0);
      if (sort === 'artist') assert.ok(result[i-1].artist.localeCompare(result[i].artist, 'en') <= 0);
    }
  }
  assert.equal(JSON.stringify(remixes), before);
});

test('search covers artist/title/mix/label/release; ignores case, accents and surrounding whitespace', () => {
  assert.equal(selectRemixes(remixes, '  FALFAN ', '', 'newest')[0].id, 1);
  assert.equal(selectRemixes(remixes, 'See You Again', '', 'newest')[0].id, 1);
  assert.equal(selectRemixes(remixes, 'Mindfuck', '', 'newest')[0].id, 1);
  assert.ok(selectRemixes(remixes, 'Poker Flat', '', 'newest').every(row => row.label === 'Poker Flat Recordings'));
  assert.equal(selectRemixes(remixes, 'Sundowna', '', 'newest')[0].id, 106);
  assert.equal(selectRemixes(remixes, 'no-such-remix-xyz', '', 'newest').length, 0);
});

test('label options are complete, unique, sorted; label/search filters intersect and clear correctly', () => {
  const labels = remixLabels(remixes);
  assert.equal(labels.length, 81);
  assert.equal(new Set(labels).size, labels.length);
  assert.deepEqual(labels, [...labels].sort((a,b) => a.localeCompare(b, 'en')));
  for (const label of labels) {
    const expected = remixes.filter(row => row.label === label);
    assert.equal(selectRemixes(remixes, '', label, 'newest').length, expected.length);
  }
  assert.equal(selectRemixes(remixes, 'See You Again', 'Ready Mix Records', 'newest').length, 1);
  assert.equal(selectRemixes(remixes, 'See You Again', 'Poker Flat Recordings', 'newest').length, 0);
  assert.equal(selectRemixes(remixes, '', '', 'newest').length, 114);
});

test('year range is derived; the source title gap is shown honestly without changing source', () => {
  assert.equal(remixYearRange(remixes), '2001–2026');
  assert.equal(remixYearRange([]), '');
  assert.equal(remixDisplayTitle(source.find(row => row.id === 106)), 'Sundowna EP');
  assert.equal(remixDisplayTitle(remixes.find(row => row.id === 106)), 'Sundowna');
  assert.equal(remixDisplayTitle(source[0]), source[0].title);
  assert.ok(source.find(row => row.id === 106).title.startsWith('(Traxsource lists'));
});

test('every mapped artwork file is a local raster image with a recorded public source', () => {
  for (const row of remixes) {
    const entry = artwork[row.id];
    assert.ok(entry, `Missing artwork provenance row ${row.id}`);
    assert.ok(row.cover_url, `Missing artwork for remix ${row.id}`);
    assert.match(row.cover_url, /^\/images\/remixes\/[\w-]+\.(jpg|png|webp)$/);
    const file = fs.readFileSync(path.join(root, 'public', row.cover_url));
    assert.ok(file.readUInt16BE(0) === 0xffd8 || file.subarray(0,4).toString('hex') === '89504e47' || file.subarray(8,12).toString() === 'WEBP');
    assert.match(entry.source_page_url, /^https:\/\//);
    assert.match(entry.source_image_url, /^https:\/\//);
    assert.match(entry.checked_date, /^\d{4}-\d{2}-\d{2}$/);
  }
});
