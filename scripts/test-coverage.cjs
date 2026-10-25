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
  const mod = { exports: {} };
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
      if (["react", "react/jsx-runtime"].includes(name)) return require(name);
      if (!(name in imports)) throw Error("Unmocked " + name);
      return imports[name];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const mayaUrls = require("../data/joeski-press-maya-focus.json");
const coverage = load("src/lib/coverage.ts", { "../../data/joeski-press-maya-focus.json": { default: mayaUrls } });
const source = require("../data/joeski-press.json");
const items = coverage.parsePressItems(source);
const { PressBrowser } = load("src/components/site/PressBrowser.tsx", {
  "@/lib/coverage": coverage,
  "../../../data/joeski-press-artwork.json": { default: require("../data/joeski-press-artwork.json") },
  "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
  "lucide-react": { Search: () => null, ArrowUpRight: () => null },
});
const render = (rows = items) =>
  renderToStaticMarkup(React.createElement(PressBrowser, { items: rows }));
const entry = (date, fields = {}) => ({
  date,
  outlet: "Test outlet",
  headline: "Headline",
  type: "Feature",
  summary: "Summary",
  url: "",
  status: "Live",
  ...fields,
});

test("every JSON row and field is retained without rewriting URLs or dates", () => {
  assert.deepEqual(items, source);
  assert.ok(items.length > 0);
  for (let i = 0; i < items.length; i++) assert.notEqual(items[i], source[i]);
  assert.equal(
    coverage.selectPress(items, "", "", "newest").length,
    items.length,
  );
});
test("counts, distinct types/outlets and year range derive from data, including replacement datasets", () => {
  const stats = coverage.pressStats(items);
  assert.equal(stats.total, source.length);
  assert.equal(stats.outlets, new Set(source.map((x) => x.outlet)).size);
  assert.deepEqual(
    coverage.pressTypes(items),
    [...new Set(source.map((x) => x.type))].sort((a, b) =>
      a.localeCompare(b, "en"),
    ),
  );
  const changed = [
    entry("1997", { type: "New type" }),
    entry("2030", { outlet: "Other outlet" }),
    entry("n/a (living profile)"),
  ];
  assert.deepEqual(coverage.pressStats(changed), {
    total: 3,
    outlets: 2,
    years: "1997–2030",
  });
  assert.deepEqual(coverage.pressStats([]), {
    total: 0,
    outlets: 0,
    years: "",
  });
  assert.equal(coverage.pressStats([entry("2024")]).years, "2024");
});
test("search covers outlet, headline and summary, combines words/types and ignores accents/case", () => {
  const rows = [
    entry("2024", {
      outlet: "Armigé",
      headline: "Studio secrets",
      summary: "New York rhythm",
      type: "Interview",
    }),
    entry("2023", {
      outlet: "Other",
      headline: "Armige studio",
      type: "Review",
    }),
  ];
  assert.equal(
    coverage.selectPress(rows, " ARMIGE rhythm ", "Interview", "newest").length,
    1,
  );
  assert.equal(
    coverage.selectPress(rows, "studio", "Review", "newest").length,
    1,
  );
  assert.equal(
    coverage.selectPress(rows, "no-such-result", "", "newest").length,
    0,
  );
  assert.equal(
    coverage.selectPress(rows, "rhythm", "Review", "newest").length,
    0,
  );
});
test("year groups follow both sorts but entries inside each year always stay newest first; undated stays last", () => {
  const rows = [
    entry("2024-02"),
    entry("2001-02"),
    entry("2024"),
    entry("2024-11-24"),
    entry("n/a (living profile)"),
    entry("2001-12"),
  ];
  const before = JSON.stringify(rows);
  for (const sort of ["newest", "oldest"]) {
    const groups = coverage.groupPressByYear(
      coverage.selectPress(rows, "", "", sort),
    );
    assert.deepEqual(
      groups.map((g) => g.year),
      sort === "newest"
        ? ["2024", "2001", "Undated"]
        : ["2001", "2024", "Undated"],
    );
    assert.deepEqual(
      groups.find((g) => g.year === "2024").entries.map((e) => e.date),
      ["2024-11-24", "2024-02", "2024"],
    );
    assert.deepEqual(
      groups.find((g) => g.year === "2001").entries.map((e) => e.date),
      ["2001-12", "2001-02"],
    );
    assert.equal(groups.flatMap((g) => g.entries).length, rows.length);
  }
  assert.equal(JSON.stringify(rows), before);
});
test("date display preserves partial precision and never invents a date for the living profile", () => {
  for (const [date, label] of [
    ["2001-02", "Feb 2001"],
    ["2002", "2002"],
    ["2016-02-14", "Feb 14, 2016"],
    ["2024-02-29", "Feb 29, 2024"],
    ["n/a (living profile)", "n/a (living profile)"],
  ])
    assert.equal(coverage.pressDateLabel(date), label);
  for (const date of ["2023-02-29", "2024-13", "n/a (living profile)"])
    assert.equal(coverage.pressYear(date), null);
});
test("rendered archive includes every row and exact supplied link, plus safe new-tab attributes", () => {
  const html = render();
  assert.equal((html.match(/<article\b/g) || []).length, source.length);
  const hrefs = [
    ...html.matchAll(
      /<a href="([^"]*)" target="_blank" rel="noopener noreferrer"/g,
    ),
  ].map((m) =>
    m[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#x27;", "'"),
  );
  assert.deepEqual(
    hrefs.sort(),
    source
      .filter((x) => x.url && x.status === "Live")
      .map((x) => x.url)
      .sort(),
  );
  assert.match(html, /Showing \d+ of \d+ items/);
  assert.match(html, /Offline — verified via secondary sources/);
  assert.match(html, /Undated/);
  assert.match(html, /n\/a \(living profile\)/);
});
test("empty and non-Live URLs have no READ button, empty archive has a reset state", () => {
  const rows = [
    entry("2002", { status: "Snippet only" }),
    entry("2001-02", {
      url: "https://web.archive.org/web/200102/https://example.org/story?x=1&y=2",
      status: "Wayback archive",
    }),
  ];
  const html = render(rows);
  assert.equal((html.match(/<article\b/g) || []).length, 2);
  assert.equal((html.match(/<a /g) || []).length, 0);
  assert.match(html, /Snippet only/);
  assert.doesNotMatch(html, /href="https:\/\/web\.archive/);
  assert.match(html, /Feb 2001/);
  assert.match(render([]), /No press items found/);
  assert.match(render([]), /Showing 0 of 0 items/);
  assert.equal(
    (render([rows[0], rows[0]]).match(/<article\b/g) || []).length,
    2,
  );
});
test("JSON boundary rejects malformed records and executable URLs without restricting future status/type labels", () => {
  for (const value of [
    null,
    {},
    [{}],
    [entry("2024", { headline: 42 })],
    [entry("2024", { url: "javascript:alert(1)" })],
    [entry("2024", { url: "data:text/html,x" })],
    [entry("2024", { url: "https://user:secret@example.org" })],
  ])
    assert.throws(() => coverage.parsePressItems(value));
  const row = entry("2024", {
    type: "Future category",
    status: "Offline — verified via secondary sources",
    url: "http://www.internationaldjmag.com/joeski.html",
  });
  assert.deepEqual(coverage.parsePressItems([row]), [row]);
});
test("new route/nav/sitemap stay separate from the unchanged gated press kit and shared footer", () => {
  const nav = fs.readFileSync(
    path.join(root, "src/components/site/NavBar.tsx"),
    "utf8",
  );
  assert.match(nav, /href: "\/coverage", label: "Press"/);
  assert.match(nav, /href: "\/press", label: "Press Kit"/);
  assert.match(
    fs.readFileSync(path.join(root, "src/app/sitemap.ts"), "utf8"),
    /\$\{base\}\/coverage/,
  );
  const page = fs.readFileSync(
    path.join(root, "src/app/(site)/coverage/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(page, /supabase|fetch\(/i);
  assert.match(page, /JOESKI_PRESS/);
});


test("thumbnail-first archive rows retain all articles, approved cover and honest fallbacks", () => {
  const html = render();
  assert.ok(html.includes("press-archive-row"));
  assert.ok(html.indexOf("press-row-thumbnail") < html.indexOf("press-row-copy"));
  assert.ok(html.includes('/press/joeski-mixmag-80-2024-cover.webp'));
  assert.ok(html.includes('branded press artwork'));
  assert.equal((html.match(/<article /g) || []).length, source.length);
  const map = require("../data/joeski-press-artwork.json");
  for (const [url, image] of Object.entries(map)) {
    assert.ok(source.some(item => item.url === url));
    assert.ok(image.src.startsWith("/press/") && !image.src.includes(".."));
    assert.ok(fs.existsSync(path.join(root, "public", image.src)));
    assert.ok(image.alt && image.source);
  }
});


test("Maya focus matches the maintained URL shortlist and composes with all filters", () => {
  assert.equal(new Set(mayaUrls).size, mayaUrls.length);
  assert.ok(mayaUrls.length >= 8);
  assert.ok(mayaUrls.every(url => source.some(item => item.url === url)));
  const selected = coverage.selectPress(items, "", "", "newest", true);
  assert.deepEqual(selected.map(item => item.url).sort(), [...mayaUrls].sort());
  const interviews = coverage.selectPress(items, "maya", "Interview", "oldest", true);
  assert.ok(interviews.length > 0);
  assert.ok(interviews.every(item => mayaUrls.includes(item.url) && item.type === "Interview"));
  assert.equal(coverage.selectPress(items, "no-such-press-zzzz", "", "newest", true).length, 0);
  assert.ok(!coverage.isMayaPress(entry("2026", { summary: "Maya Records", url: "https://example.org" })));
});
test("offline original never renders as a link and canonical Night Bazaar item is unique", () => {
  const offline = items.filter(item => item.status.startsWith("Offline"));
  assert.equal(offline.length, 1);
  const html = render(offline);
  assert.match(html, /Original page offline/);
  assert.doesNotMatch(html, /<a /);
  assert.doesNotMatch(html, /href=.*internationaldjmag/);
  const playlist = items.filter(item => item.url.includes("thenightbazaar.co.uk/joeski-i-had"));
  assert.equal(playlist.length, 1);
  assert.equal(playlist[0].date, "2023-09-08");
  assert.ok(!items.some(item => item.url.includes("myhouseradio.fm")));
  assert.ok(items.every(item => Object.keys(item).length === 7));
});


test("year filtering intersects Maya, query and type while preserving unknown dates", () => {
  const rows = coverage.selectPress(items, "", "", "newest", true, "2022");
  assert.equal(rows.length, 2);
  assert.ok(rows.every(item => coverage.pressYear(item.date) === "2022" && mayaUrls.includes(item.url)));
  assert.equal(coverage.selectPress(items,"Groove","Interview","newest",true,"2022").length,1);
  assert.equal(coverage.selectPress(items,"","","newest",false,"Undated").length,1);
  assert.equal(coverage.selectPress(items,"","","newest",false,"2099").length,0);
});
test("editorial highlights link to existing Live entries, disappear safely with missing data", () => {
  const { PressHighlights } = load("src/components/site/PressHighlights.tsx", {
    "@/lib/coverage": coverage,
    "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
    "lucide-react": { ArrowUpRight: () => null },
  });
  const html = renderToStaticMarkup(React.createElement(PressHighlights, {items}));
  assert.equal((html.match(/<a /g)||[]).length,3);
  assert.match(html,/Pete Tong/);
  assert.match(html,/Ten Maya Records/);
  assert.match(html,/cover.webp/);
  assert.equal(renderToStaticMarkup(React.createElement(PressHighlights,{items:[]})),"");
  assert.equal(renderToStaticMarkup(React.createElement(PressHighlights,{items:items.map(item=>({...item,status:"Offline"}))})),"");
});


test("verified radio recordings use Listen actions without duplicating Hall of Fame", () => {
  const hof = items.filter(item => item.headline === "Pete Tong's Hall of Fame: Joeski");
  assert.equal(hof.length, 1);
  assert.equal(hof[0].date, "2014-04-25");
  assert.equal(hof[0].url, "https://soundcloud.com/djjoeski/pete-tongs-hall-of-fame-joeski");
  const radio = items.filter(item => item.url === "https://www.mixcloud.com/CarlCox/carl-cox-global-572/");
  assert.equal(radio.length, 1);
  assert.equal(radio[0].type, "Radio");
  assert.equal(radio[0].date, "2014-03-10");
  assert.ok(coverage.isMayaPress(radio[0]));
  assert.match(radio[0].summary, /Joseph Capriati, not Joeski/);
  for (const item of [hof[0],radio[0]]) {
    assert.equal(coverage.pressActionLabel(item), "Listen");
    assert.match(render([item]), /Listen/);
  }
  assert.equal(coverage.pressActionLabel(entry("2024",{url:"https://soundcloud.com.evil.example/story"})),"Read");
  assert.equal(coverage.selectPress(items,"","Radio","newest").length, radio.length);
});
