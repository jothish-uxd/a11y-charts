// Automated accessibility audit of the docs site. Writes docs/accessibility-audit.md.
//
//   npm install          (once; installs axe-core and Playwright, used only by this script)
//   npm run audit
//
// Runs in Chromium by default: your installed Chrome if it finds one, otherwise
// Playwright's own (npx playwright install chromium). CHROME_PATH points at a specific one.
// To test another engine, install it and set BROWSER:
//   npx playwright install webkit && BROWSER=webkit npm run audit     (Safari's engine)
//   npx playwright install firefox && BROWSER=firefox npm run audit
// Only Chromium runs rewrite docs/accessibility-audit.md; other engines print their
// results and exit non-zero on any failure. Set WRITE_REPORT=1 to write the file anyway.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromium, firefox, webkit } from "playwright";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const axeVersion = require("axe-core/package.json").version;
const pkg = JSON.parse(readFileSync(root + "package.json", "utf8"));
const OUT = root + "docs/accessibility-audit.md";
const KEEP = "<!-- Everything below this line is written by hand and kept when the audit is re-run. -->";

const PAGES = [
  ["overview", "Overview"], ["bar", "Horizontal bars"], ["vertical-bars", "Vertical bars"], ["radar", "Radar chart"],
  ["radial", "Radial bar chart"], ["donut", "Donut"], ["segmented-bar", "Segmented horizontal"],
  ["segmented-vertical", "Segmented vertical"], ["sunburst", "Sunburst chart"], ["line", "Multi-line"],
  ["spiral", "Spiral graph"], ["arc", "Arc diagram"], ["scatter", "Scatter plot"],
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const ENGINE = (process.env.BROWSER || "chromium").toLowerCase();
const ENGINES = { chromium, firefox, webkit };
if (!ENGINES[ENGINE]) throw new Error(`BROWSER must be one of ${Object.keys(ENGINES).join(", ")}`);
const launch = async () => {
  if (ENGINE !== "chromium") return ENGINES[ENGINE].launch();
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  try { return await chromium.launch({ channel: "chrome" }); } catch { return chromium.launch(); }
};
const browser = await launch();
const ENGINE_NAME = { chromium: "Chromium", firefox: "Firefox", webkit: "WebKit" }[ENGINE];
const browserVersion = browser.version();
const url = pathToFileURL(root + "index.html").href;

/* ---- 1. axe-core on every page, light and dark ---- */
const axeRows = [], violations = [], review = new Map(), rulesRun = new Set();
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  await page.waitForTimeout(600);
  await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
  await page.evaluate(axeSource);
  for (const [route, name] of PAGES) {
    await page.evaluate(r => { location.hash = "#" + r; }, route);
    await page.waitForTimeout(250);
    const r = await page.evaluate(tags => axe.run(document, { runOnly: { type: "tag", values: tags } }), TAGS);
    [...r.passes, ...r.violations, ...r.incomplete].forEach(x => rulesRun.add(x.id));
    axeRows.push({ name, theme, fail: r.violations.length, pass: r.passes.length, review: r.incomplete.reduce((t, x) => t + x.nodes.length, 0) });
    r.violations.forEach(v => violations.push({ name, theme, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, example: v.nodes[0].target.join(" ") }));
    r.incomplete.forEach(v => {
      const e = review.get(v.id) || { help: v.help, nodes: 0, pages: new Set(), reasons: new Set() };
      e.nodes += v.nodes.length; e.pages.add(name);
      v.nodes.forEach(n => (n.any || []).concat(n.all || []).forEach(c => c.message && e.reasons.add(c.message.replace(/\s+/g, " ").slice(0, 140))));
      review.set(v.id, e);
    });
  }
  await page.close();
}

/* ---- 2. Scripted keyboard and structure checks on every live chart ---- */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url);
await page.waitForTimeout(600);
const chartRows = [];
for (const [route, name] of PAGES.slice(1)) {
  await page.evaluate(r => { location.hash = "#" + r; }, route);
  await page.waitForTimeout(250);
  const sel = `#demo-${route}`;
  const s = await page.evaluate(q => {
    const f = document.querySelector(q + " .ac-chart"), marks = [...f.querySelectorAll(".ac-mark")];
    const table = f.querySelector("table");
    return {
      marks: marks.length,
      oneStop: marks.filter(m => m.getAttribute("tabindex") === "0").length === 1,
      labelled: marks.every(m => (m.getAttribute("aria-label") || "").trim().length > 8 && m.getAttribute("role") === "img"),
      named: !!document.getElementById(f.getAttribute("aria-labelledby"))?.textContent.trim(),
      summary: (document.getElementById(f.getAttribute("aria-describedby"))?.textContent || "").length > 60,
      table: !!table && !!table.querySelector("caption") && table.querySelectorAll("thead th[scope=col]").length > 1 && table.querySelectorAll("tbody th[scope=row]").length > 0,
      keysShown: !!f.querySelector(".ac-keys kbd"),
    };
  }, sel);
  // Keyboard: focus the chart's Tab stop, then press keys and watch where focus goes.
  await page.keyboard.press("Tab");
  await page.evaluate(q => document.querySelector(q + ' .ac-mark[tabindex="0"]').focus(), sel);
  const at = () => page.evaluate(q => { const a = document.activeElement; return a && a.closest(q) ? a.getAttribute("aria-label") : null; }, sel);
  const first = await at();
  await page.keyboard.press("ArrowRight"); const second = await at();
  const ring = await page.evaluate(() => { const a = document.activeElement, t = a.querySelector(".ac-marker") || a; return getComputedStyle(t).stroke; });
  const tip = await page.evaluate(q => document.querySelector(q + " .ac-tip").classList.contains("is-visible"), sel);
  await page.keyboard.press("Escape"); const tipGone = await page.evaluate(q => !document.querySelector(q + " .ac-tip").classList.contains("is-visible"), sel);
  await page.keyboard.press("End"); const end = await at();
  await page.keyboard.press("Home"); const home = await at();
  const stops = await page.evaluate(q => document.querySelectorAll(q + ' .ac-mark[tabindex="0"]').length, sel);
  const strip = await page.evaluate(r => document.querySelector(`#panel-${r} .hears-text`).textContent, route);
  chartRows.push({ name, marks: s.marks, checks: {
    "One Tab stop": s.oneStop && stops === 1,
    "Every mark labelled": s.labelled,
    "Chart named": s.named,
    "Summary attached": s.summary,
    "Data table": s.table,
    "Keys printed": s.keysShown,
    "Arrow moves focus": !!first && !!second && first !== second,
    "Home / End": !!end && !!home && end !== home,
    "Focus ring": /0,\s*104,\s*214|#0068d6/i.test(ring),
    "Tooltip + Escape": tip && tipGone,
    "Announcement": strip === home,
  } });
}
await browser.close();

/* ---- 3. Write the report ---- */
const mark = ok => (ok ? "Pass" : "**FAIL**");
const checkNames = Object.keys(chartRows[0].checks);
const axeFail = axeRows.filter(r => r.fail).length, chartFail = chartRows.filter(r => Object.values(r.checks).includes(false)).length;
const byPage = PAGES.map(([, name]) => { const l = axeRows.find(r => r.name === name && r.theme === "light"), d = axeRows.find(r => r.name === name && r.theme === "dark"); return `| ${name} | ${l.fail ? `**${l.fail} failed**` : "Pass"} | ${d.fail ? `**${d.fail} failed**` : "Pass"} | ${l.pass} | ${Math.max(l.review, d.review)} |`; });
const kept = existsSync(OUT) && readFileSync(OUT, "utf8").includes(KEEP) ? readFileSync(OUT, "utf8").split(KEEP)[1] : "\n";
const date = new Date().toISOString().slice(0, 10);

const report = `# Automated accessibility audit

Generated by \`npm run audit\` on ${date} for accessible-charts v${pkg.version}. Do not edit the part above the marker near the end; re-run the script instead.

**Result: ${axeFail + chartFail === 0 ? "all automated checks pass" : `${axeFail} page states and ${chartFail} charts have failures`}.** ${axeRows.length} page states checked with axe-core (0 violations expected), and ${chartRows.length} charts put through ${checkNames.length} scripted checks each.

Automated checks find only a portion of accessibility problems. They cannot judge whether a summary is useful or how a chart sounds in a screen reader. See the [accessibility statement](../ACCESSIBILITY.md) for what has not been tested.

## How it was tested

| | |
| --- | --- |
| Tool | axe-core ${axeVersion} |
| Browser | ${ENGINE_NAME} ${browserVersion}, 1440 × 900 |
| Rules | ${TAGS.map(t => `\`${t}\``).join(", ")} (WCAG 2.0, 2.1 and 2.2 at A and AA, plus axe best practices): ${rulesRun.size} rules applied |
| Pages | The docs site (\`index.html\`): the overview and all ${PAGES.length - 1} chart pages |
| Themes | Light and dark |

## 1. axe-core, page by page

"Rules passed" is the number of rules that applied to the page and passed. "Needs review" counts elements axe could not decide on by itself; they are explained below the table.

| Page | Light | Dark | Rules passed | Needs review |
| --- | --- | --- | --- | --- |
${byPage.join("\n")}

${violations.length ? `### Failures\n\n| Page | Theme | Rule | Impact | Elements | Example |\n| --- | --- | --- | --- | --- | --- |\n${violations.map(v => `| ${v.name} | ${v.theme} | \`${v.id}\`: ${v.help} | ${v.impact} | ${v.nodes} | \`${v.example}\` |`).join("\n")}\n` : "No violations on any page in either theme.\n"}
### Needs review

These are not failures. axe flags an element as "needs review" when it cannot work out the answer, and a person has to look.

${review.size ? `| Rule | Elements | Why axe could not decide |\n| --- | --- | --- |\n${[...review].map(([id, e]) => `| \`${id}\`: ${e.help} | ${e.nodes} across ${e.pages.size} pages | ${[...e.reasons].slice(0, 2).join(" / ")} |`).join("\n")}` : "Nothing was flagged for review."}

## 2. Scripted checks, chart by chart

Each live example is driven with real key presses in the browser.

| Check | What it verifies |
| --- | --- |
| One Tab stop | Exactly one mark is in the Tab order, before and after arrow keys are used |
| Every mark labelled | Every mark has \`role="img"\` and a spoken label |
| Chart named | The chart's \`<figure>\` is named by its title |
| Summary attached | A plain-language summary is attached to the figure as its description |
| Data table | A table with a caption, column headers and row headers |
| Keys printed | The keyboard instructions are shown above the chart |
| Arrow moves focus | Right arrow moves focus to a different mark |
| Home / End | End and Home move focus to different marks |
| Focus ring | The focused mark is drawn in the focus color |
| Tooltip + Escape | Focus opens the tooltip and Escape closes it |
| Announcement | The \`ac:announce\` event carries the focused mark's label (checked through the "Screen reader hears" strip) |

| Chart | Marks | ${checkNames.join(" | ")} |
| --- | --- | ${checkNames.map(() => "---").join(" | ")} |
${chartRows.map(r => `| ${r.name} | ${r.marks} | ${checkNames.map(c => mark(r.checks[c])).join(" | ")} |`).join("\n")}

${KEEP}${kept}`;
const write = ENGINE === "chromium" || process.env.WRITE_REPORT === "1";
if (write) writeFileSync(OUT, report);
for (const v of violations) console.log(`FAIL axe ${v.name} (${v.theme}): ${v.id}, ${v.help}, ${v.nodes} elements, e.g. ${v.example}`);
for (const r of chartRows) for (const [c, ok] of Object.entries(r.checks)) if (!ok) console.log(`FAIL ${r.name}: ${c}`);
console.log(`${ENGINE_NAME} ${browserVersion}. axe: ${axeRows.length} page states, ${axeFail} with failures. charts: ${chartRows.length} x ${checkNames.length} checks, ${chartFail} charts with failures.${write ? " Wrote docs/accessibility-audit.md" : ""}`);
process.exit(axeFail + chartFail ? 1 : 0);
