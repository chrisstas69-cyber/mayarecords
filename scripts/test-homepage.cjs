const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}) {
  const module = { exports: {} };
  const js = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInThisContext("(function(require,module,exports){" + js + "\n})")(
    (name) => {
      if (name === "react/jsx-runtime") return require(name);
      if (!(name in imports)) throw Error("Unmocked " + name);
      return imports[name];
    },
    module,
    module.exports,
  );
  return module.exports;
}
const home = load("src/lib/homepage.ts");
const mixes = load("src/lib/mixes.ts");
const promotion = load("src/lib/promotion.ts");
const link = ({ children, ...props }) =>
  React.createElement("a", props, children);
const image = ({ fill, priority, unoptimized, ...props }) =>
  React.createElement("img", props);
const { HomePageLanding } = load("src/components/site/HomePageLanding.tsx", {
  "next/link": { default: link },
  "next/image": { default: image },
  "lucide-react": { ArrowUpRight: () => null },
  "@/lib/homepage": home,
  "@/lib/mixes": mixes,
  "./HomeInteractions": {
    FeaturedMixPlay: ({ mix }) =>
      React.createElement("button", null, "Listen to " + mix.title),
  },
});
const release = {
  id: "r",
  slug: "maya264",
  title: "Real release",
  catalog_number: "MAYA264",
  artist_name: "Joeski",
  cover_url: "/media/covers/maya264.jpg",
  release_date: "2026-10-16",
  state: "published",
};
const render = (extra = {}) =>
  renderToStaticMarkup(
    React.createElement(HomePageLanding, {
      releases: [release],
      edits: [
        {
          slug: "edit",
          title: "Real edit",
          original_artist: "Original Artist",
        },
      ],
      mix: {
        id: "mix",
        title: "Real session",
        external_url: "https://soundcloud.com/djjoeski/real",
        duration_seconds: 3642,
      },
      promotion: null,
      ...extra,
    }),
  );
test("six numbered destinations resolve to existing site pages or the press section", () => {
  assert.deepEqual(
    home.HOME_DESTINATIONS.map((x) => x.number),
    ["01", "02", "03", "04", "05", "06"],
  );
  assert.equal(new Set(home.HOME_DESTINATIONS.map((x) => x.href)).size, 6);
  for (const x of home.HOME_DESTINATIONS)
    if (!x.href.includes("#"))
      assert.ok(
        fs.existsSync(path.join(root, "src/app/(site)", x.href, "page.tsx")),
        x.href,
      );
  assert.match(render(), /id="press-feature"/);
});
test("latest release selection excludes drafts and future releases without changing catalog", () => {
  const source = [
    release,
    { ...release, slug: "future", release_date: "2027-01-01" },
    { ...release, slug: "draft", state: "draft" },
    { ...release, slug: "old", release_date: "2001-01-01" },
  ];
  const before = JSON.stringify(source);
  assert.deepEqual(
    home.latestHomeReleases(source, "2026-10-24").map((r) => r.slug),
    ["maya264", "old"],
  );
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(home.latestHomeReleases([], "2026-10-24"), []);
});
test("real content replaces prototype labels; no private member media or autoplay is emitted", () => {
  const html = render();
  for (const text of [
    "Real release",
    "Real edit",
    "Original Artist",
    "Real session",
    "1:00:42",
    'href="/releases/maya264"',
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(
    html,
    /coming soon|to be supplied|Selection to be announced|<iframe|<audio|private-media|api\/members\/edits|href="\/concepts"/i,
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});
test("promotion slot handles release, merch, secondary actions and disabled state", () => {
  const p = promotion.resolvePromotion(
    {
      ...promotion.PROMOTION_DEFAULTS,
      kind: "merch",
      title: "Official shirt",
      primary_url: "/store",
      primary_label: "Shop merch",
      secondary_label: "Details",
      secondary_url: "/about",
    },
    [release],
    "2026-10-24",
  );
  const html = render({ promotion: p });
  assert.match(html, /Official shirt/);
  assert.match(html, /Shop merch/);
  assert.match(html, /Details/);
  assert.doesNotMatch(html, /Forthcoming on Maya|preview\.mp3/);
  assert.doesNotMatch(render(), /aria-label="Featured promotion"/);
});
test("exact portrait assets and approved complete PDF are local, nonempty and referenced", () => {
  const html = render();
  for (const asset of [
    "joeski-iconic.webp",
    "joeski-underground.webp",
    "joeski-analog.webp",
  ]) {
    assert.ok(
      fs.statSync(path.join(root, "public/images/portraits", asset)).size >
        1000,
    );
    assert.ok(html.includes(asset));
  }
  const pdf = fs.readFileSync(
    path.join(root, "public/press/joeski-mixmag-80-2024.pdf"),
  );
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 10000000);
  assert.equal(
    require("node:crypto").createHash("sha256").update(pdf).digest("hex"),
    "71fe12dfc962895bf49d0b6aba546a4f713ae4a13d5db64abe8d8762505c3006",
  );
  assert.match(
    html,
    /href="\/press\/joeski-mixmag-80-2024.pdf" target="_blank" rel="noopener noreferrer"/,
  );
  assert.match(html, /Cheyenne Bosco/);
  assert.match(html, /Andreas Hofweber/);
});
test("empty content keeps useful navigation and does not invent a playable mix", () => {
  const html = render({ releases: [], edits: [], mix: null });
  assert.match(html, /Explore the mix archive/);
  assert.match(html, /Browse mixes/);
  assert.doesNotMatch(html, /Listen to |Real release|Real edit/);
});
