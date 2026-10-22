const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.next/commerce-tests');
execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
  'src/lib/commerce/cart.ts', 'src/lib/commerce/checkout-items.ts', 'src/lib/commerce/pricing.ts',
  '--outDir', out, '--rootDir', 'src', '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck'], { cwd: root, stdio: 'inherit' });
const { addCartItem, normalizeCart, isCartItem } = require(path.join(out, 'lib/commerce/cart.js'));
const { buildCheckoutItems } = require(path.join(out, 'lib/commerce/checkout-items.js'));
const { privateMasterPath } = require(path.join(out, 'lib/commerce/pricing.js'));

const release = {
  id: 'release-1', title: 'Fundamentals', artist_name: 'Martin Aquino', state: 'published',
  catalog_number: 'MAYA079', digital_price_cents: 599, master_url: 'masters/ep.zip',
  tracks: [
    { id: 'track-1', title: 'Original Mix', digital_price_cents: 199, master_url: 'masters/track-1.zip' },
    { id: 'track-2', title: 'Dub Mix', digital_price_cents: 249, master_url: 'masters/track-2.zip' },
  ],
};
const ep = { kind: 'digital_release', releaseId: release.id, name: release.title, artistName: 'Martin Aquino', catalogNumber: 'MAYA079', priceCents: 599, coverUrl: null };
const track1 = { ...ep, kind: 'digital_track', trackId: 'track-1', releaseTitle: release.title, name: 'Original Mix', priceCents: 199 };
const track2 = { ...track1, trackId: 'track-2', name: 'Dub Mix', priceCents: 249 };
const merch = { kind: 'merch', productId: 'shirt', name: 'Shirt', priceCents: 3800, size: 'L', quantity: 1, imageUrl: null };
const product = { id: 'shirt', name: 'Shirt', active: true, price_cents: 3800, currency: 'usd', sizes: ['L'] };

test('distinct tracks in the same EP coexist; the same track is never charged twice', () => {
  assert.equal(addCartItem([track1], track2).length, 2);
  assert.equal(addCartItem([track1], track1).length, 1);
});
test('full EP replaces only its individual tracks and preserves other products', () => {
  const other = { ...track1, releaseId: 'release-2' };
  assert.deepEqual(addCartItem([track1, track2, merch, other], ep), [merch, other, ep]);
  assert.deepEqual(addCartItem([ep], track1), [ep]);
  assert.equal(addCartItem([merch], merch)[0].quantity, 2);
});
test('existing saved full-release carts remain compatible; corrupt carts fail closed', () => {
  assert.ok(isCartItem(ep));
  assert.ok(!isCartItem(null));
  assert.ok(!isCartItem({ ...track1, trackId: undefined }));
  assert.deepEqual(normalizeCart([track1, ep, ep]), [ep]);
});
test('checkout takes track price and identity from the server catalog, not the cart', () => {
  const result = buildCheckoutItems([{ ...track2, priceCents: 1, name: 'Forged title' }], [], [release]);
  assert.ok(result.ok);
  assert.equal(result.items[0].priceCents, 249);
  assert.equal(result.items[0].masterPath, 'track-2.zip');
  assert.equal(result.items[0].metadata.track_id, 'track-2');
  assert.equal(result.items[0].metadata.item_type, 'digital_track');
  assert.ok(!result.items[0].name.includes('Forged title'));
});
test('whole-release pricing and digital-only delivery are preserved without overlapping charges', () => {
  const result = buildCheckoutItems([track1, { ...ep, priceCents: 1 }], [], [release]);
  assert.ok(result.ok);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].priceCents, 599);
  assert.equal(result.items[0].metadata.item_type, 'digital_release');
  assert.equal(result.items[0].masterPath, 'ep.zip');
});
test('track cannot borrow another EP identity or the full EP download', () => {
  assert.ok(!buildCheckoutItems([{ ...track1, trackId: 'foreign-track' }], [], [release]).ok);
  const missingTrackMaster = { ...release, tracks: [{ ...release.tracks[0], master_url: null }] };
  assert.ok(!buildCheckoutItems([track1], [], [missingTrackMaster]).ok);
});
test('unpublished, disabled, missing and malformed items cannot be charged', () => {
  assert.ok(!buildCheckoutItems([track1], [], [{ ...release, state: 'draft' }]).ok);
  assert.ok(!buildCheckoutItems([track1], [], [{ ...release, tracks: [{ ...release.tracks[0], digital_price_cents: null }] }]).ok);
  for (const input of [null, [], [{ ...track1, kind: 'unknown' }], [{ ...merch, quantity: -1 }], Array(51).fill(track1)]) {
    assert.ok(!buildCheckoutItems(input, [product], [release]).ok);
  }
});
test('mixed merchandise and digital carts preserve validated variants and quantities', () => {
  const result = buildCheckoutItems([merch, track1], [product], [release]);
  assert.ok(result.ok);
  assert.equal(result.items[0].metadata.size, 'L');
  assert.equal(result.items[0].priceCents, 3800);
  assert.ok(!buildCheckoutItems([{ ...merch, size: 'FAKE' }], [product], [release]).ok);
});
test('master paths stay confined to private storage', () => {
  assert.equal(privateMasterPath('masters/tracks/a.zip'), 'tracks/a.zip');
  for (const value of ['https://cdn.test/preview.mp3', '/media/preview.mp3', 'masters/../ep.zip', 'masters//ep.zip', 'masters/a//b.zip', 'masters/a/', 'masters/%2e%2e/ep.zip', 'masters/ep.zip?x=1']) assert.equal(privateMasterPath(value), null);
});
