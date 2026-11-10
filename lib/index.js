/*! accessible-charts v0.2.0 | MIT | https://github.com/jothish-uxd/a11y-charts */
// Chart components that work beyond sight. No dependencies, no build step.
// Every chart renders: a plain-language summary, one Tab stop with arrow-key
// navigation between marks, a spoken label on every mark, a texture (never a
// colour alone) for every category, and a real data table.

const NS = "http://www.w3.org/2000/svg";
let uid = 0;

/* ------------------------------------------------------------------ helpers */
const esc = v => String(v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = v => (Number.isFinite(+v) ? +v : 0);
const fmt = v => (Number.isInteger(v) ? v : +v.toFixed(1)).toLocaleString("en-US");
const pct = (a, b) => (b ? `${+((a / b) * 100).toFixed(1)}%` : "0%");
const sum = (list, f = d => d.value) => list.reduce((t, d) => t + f(d), 0);
const maxBy = (list, f = d => d.value) => list.reduce((m, d) => (f(d) > f(m) ? d : m), list[0]);
const minBy = (list, f = d => d.value) => list.reduce((m, d) => (f(d) < f(m) ? d : m), list[0]);
// "1 characters" reads wrong aloud, so a count of one drops a plain plural "s".
const one = unit => (/[^s]s$/.test(unit) ? unit.slice(0, -1) : unit);
const withUnit = (v, unit) => (!unit ? fmt(v) : unit[0] === "%" ? `${fmt(v)}${unit}` : `${fmt(v)} ${v === 1 ? one(unit) : unit}`);
const joinNames = names => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);
const short = (text, n) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text);

function html(tag, attrs = {}, content) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  if (content != null) el.innerHTML = content;
  return el;
}
function svg(tag, attrs = {}, parent, text) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
  if (parent) parent.appendChild(el);
  return el;
}
function wrapWords(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function wrappedText(parent, text, x, y, maxChars, attrs = {}) {
  const t = svg("text", { x, y, ...attrs }, parent);
  wrapWords(text, maxChars).slice(0, 3).forEach((line, i) => svg("tspan", { x, dy: i ? "1.25em" : 0 }, t, line));
  return t;
}
// A round upper bound and tick step for an axis.
function niceScale(maxValue, target = 4) {
  if (!(maxValue > 0)) return { max: 1, step: 1 };
  const raw = maxValue / target, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  return { max: Math.ceil(maxValue / step - 1e-9) * step, step };
}
const ticks = (max, step) => Array.from({ length: Math.round(max / step) + 1 }, (_, i) => +(i * step).toFixed(6));
// Angles are radians from 12 o'clock, clockwise.
const polar = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
function band(cx, cy, r0, r1, a0, a1) {
  if (a1 - a0 >= 2 * Math.PI) a1 = a0 + 2 * Math.PI - 0.0001;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r0, a0), [x1, y1] = polar(cx, cy, r1, a0);
  const [x2, y2] = polar(cx, cy, r1, a1), [x3, y3] = polar(cx, cy, r0, a1);
  return `M${x0} ${y0}L${x1} ${y1}A${r1} ${r1} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 ${large} 0 ${x0} ${y0}Z`;
}

/* ----------------------------------------------------------------- textures */
// Seven base textures. Past seven, the same textures repeat at a larger scale
// and then rotated, so a chart is never capped at a fixed number of categories.
const TEXTURES = [
  ["diagonalForward", 7, `<path d="M-1 1L1 -1M0 7L7 0M6 8L8 6" stroke="currentColor" stroke-width="2.3"/>`],
  ["dots", 7, `<circle cx="3.5" cy="3.5" r="1.8" fill="currentColor"/>`],
  ["vertical", 7, `<rect width="2.6" height="7" fill="currentColor"/>`],
  ["horizontal", 7, `<rect width="7" height="2.6" fill="currentColor"/>`],
  ["solid", 8, `<rect width="8" height="8" fill="currentColor"/>`],
  ["checker", 9, `<rect width="4.5" height="4.5" fill="currentColor"/><rect x="4.5" y="4.5" width="4.5" height="4.5" fill="currentColor"/>`],
  ["crosshatch", 6, `<path d="M-1 1L1 -1M0 6L6 0M5 7L7 5M-1 5L1 7M0 0L6 6M5 -1L7 1" stroke="currentColor" stroke-width="1.2"/>`],
];
const VARIANTS = ["", "scale(1.9)", "rotate(28) scale(1.4)", "rotate(-28) scale(2.4)"];
function textureMarkup(id, i) {
  const [, size, marks] = TEXTURES[i % TEXTURES.length];
  const variant = VARIANTS[Math.floor(i / TEXTURES.length) % VARIANTS.length];
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}"${variant ? ` patternTransform="${variant}"` : ""}><rect width="${size}" height="${size}" class="ac-pattern-bg"/>${marks}</pattern>`;
}
/** Names of the built-in textures, in the order charts hand them out. */
export const textures = TEXTURES.map(t => t[0]);

/* ---------------------------------------------------- line + marker grammar */
const DASHES = ["", "9 6", "1.5 6", "14 5 2 5", "5 4", "18 6"];
const SHAPES = ["circle", "square", "triangle", "diamond"];
// Series i gets a shape, a fill (hollow or solid) and a dash, so no two of the first 24 match.
const seriesStyle = i => ({ shape: SHAPES[i % 4], filled: (i + Math.floor(i / 4)) % 2 === 1, dash: DASHES[i % DASHES.length] });
// options.shapes overrides the order, e.g. ["filled square", "hollow circle"].
function styleFor(o, i, base = seriesStyle(i)) {
  const want = Array.isArray(o.shapes) ? String(o.shapes[i] || "") : "";
  const shape = SHAPES.find(sh => want.includes(sh));
  return shape ? { ...base, shape, filled: want.includes("filled") } : base;
}
const shapeName = st => `${st.filled ? "filled" : "hollow"} ${st.shape}`;
function marker(parent, st, x, y, r = 6, extra = {}) {
  const common = { class: `ac-marker${st.filled ? " is-filled" : ""}`, ...extra };
  if (st.shape === "square") return svg("rect", { x: x - r, y: y - r, width: r * 2, height: r * 2, rx: 1.5, ...common }, parent);
  if (st.shape === "triangle") return svg("path", { d: `M${x} ${y - r * 1.25}L${x + r * 1.15} ${y + r * 0.85}H${x - r * 1.15}Z`, ...common }, parent);
  if (st.shape === "diamond") return svg("path", { d: `M${x} ${y - r * 1.3}L${x + r * 1.3} ${y}L${x} ${y + r * 1.3}L${x - r * 1.3} ${y}Z`, ...common }, parent);
  return svg("circle", { cx: x, cy: y, r, ...common }, parent);
}
function markerSwatch(st, withLine) {
  const el = svg("svg", { viewBox: "0 0 34 16", width: 34, height: 16, class: "ac-swatch-line", "aria-hidden": "true" });
  if (withLine) svg("line", { x1: 1, y1: 8, x2: 33, y2: 8, class: "ac-line", "stroke-dasharray": st.dash }, el);
  marker(el, st, 17, 8, 4.5);
  return el.outerHTML;
}

/* -------------------------------------------------------------------- frame */
// Builds the shared structure around every chart and wires the keyboard model.
function frame(target, o, type, w, h) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) throw new Error("accessible-charts: target element not found");
  const id = `ac${++uid}`;
  const title = o.title || "Chart";
  el.textContent = "";
  const fig = html("figure", { class: `ac-chart ac-chart-${type}`, role: "group", "aria-labelledby": `${id}-title`, "aria-describedby": `${id}-sr` });
  fig.appendChild(html("figcaption", { class: "ac-title", id: `${id}-title` }, esc(title)));
  const sr = fig.appendChild(html("p", { class: "ac-sr", id: `${id}-sr` }));
  const keys = fig.appendChild(html("p", { class: "ac-keys", "aria-hidden": "true" }));
  const legendEl = fig.appendChild(html("div", { class: "ac-legend", role: "list", "aria-label": "Legend", hidden: "" }));
  const plot = fig.appendChild(html("div", { class: "ac-plot" }));
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}`, role: "group", class: "ac-svg", style: `max-width:${w}px` }, plot);
  const defs = svg("defs", {}, root);
  const back = svg("g", { "aria-hidden": "true" }, root);      // axes, grid, tracks
  const marksLayer = svg("g", {}, root);                         // focusable marks
  const front = svg("g", { "aria-hidden": "true", class: "ac-front" }, root); // value labels
  const tip = plot.appendChild(html("div", { class: "ac-tip", "aria-hidden": "true" }));
  const details = fig.appendChild(html("div", { class: "ac-details" }));
  el.appendChild(fig);

  const marks = [];
  const made = new Set();
  let hintText = "";

  const api = {
    id, el, fig, svg: root, back, marks: marksLayer, front, w, h,
    texture(i) {
      // options.patterns names a texture per category; anything unnamed takes the next default.
      const named = Array.isArray(o.patterns) ? textures.indexOf(o.patterns[i]) : -1;
      if (named >= 0) i = named;
      const pid = `${id}-p${i}`;
      if (!made.has(i)) { made.add(i); defs.insertAdjacentHTML("beforeend", textureMarkup(pid, i)); }
      return `url(#${pid})`;
    },
    textureSwatch(i) {
      return `<svg class="ac-swatch" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3" fill="${api.texture(i)}" class="ac-swatch-box"/></svg>`;
    },
    legend(items) {
      if (!items.length || o.legend === false) return;
      legendEl.hidden = false;
      legendEl.innerHTML = items.map(it => `<div class="ac-legend-item" role="listitem">${it.swatch}<span>${esc(it.label)}${it.note != null ? ` <span class="ac-legend-note">${esc(it.note)}</span>` : ""}</span></div>`).join("");
    },
    // node: SVG element. label: what a screen reader says. tip: lines for the tooltip.
    // row/col place the mark on the arrow-key grid; group ties marks that stay lit together.
    mark(node, { label, tip: lines, row = 0, group }) {
      node.setAttribute("role", "img");
      node.setAttribute("aria-label", label);
      node.setAttribute("tabindex", "-1");
      node.classList.add("ac-mark");
      const m = { node, label, lines, row, group, moves: null };
      marks.push(m);
      return m;
    },
    summary(text, hint) {
      const full = typeof o.summary === "string" && o.summary !== "auto" ? o.summary : text;
      // Hints are written once with {Key} tokens: keycaps on screen, words for screen readers.
      const spoken = { "←": "Left", "→": "Right", "↑": "Up", "↓": "Down" };
      hintText = hint.replace(/\{([^}]+)\}/g, (_, k) => spoken[k] || k).replace(/Left Right/g, "Left and Right").replace(/Up Down/g, "Up and Down").replace(/Home End/g, "Home and End");
      sr.textContent = `Chart summary. ${full} ${hintText} The full values are in the data table that follows.`;
      keys.innerHTML = `<strong>Keyboard</strong> ${esc(hint).replace(/\{([^}]+)\}/g, "<kbd>$1</kbd>")}`;
      if (o.summary !== false && o.showSummary !== false) details.appendChild(html("section", { class: "ac-summary" }, `<h3>Summary</h3><p>${esc(full)}</p>`));
    },
    table(columns, rows) {
      if (o.table === false || o.showTable === false) return;
      const head = columns.map((c, i) => `<th scope="col"${i ? ' class="ac-num"' : ""}>${esc(String(c).replace(/^[a-z]/, ch => ch.toUpperCase()))}</th>`).join("");
      const body = rows.map(r => `<tr>${r.map((c, i) => (i ? `<td class="ac-num">${esc(c)}</td>` : `<th scope="row">${typeof c === "object" ? c.html : esc(c)}</th>`)).join("")}</tr>`).join("");
      details.appendChild(html("section", { class: "ac-table" }, `<h3>Data table</h3><div class="ac-table-scroll"><table><caption class="ac-sr">${esc(title)}: data</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`));
    },
    done() {
      root.setAttribute("aria-label", `${title}. Interactive chart with ${marks.length} ${marks.length === 1 ? "mark" : "marks"}. ${hintText}`);
      if (!marks.length) return handle;
      const rows = [...new Set(marks.map(m => m.row))].map(r => marks.filter(m => m.row === r));
      const setStop = m => marks.forEach(n => n.node.setAttribute("tabindex", n === m ? "0" : "-1"));
      const show = m => {
        marks.forEach(n => {
          n.node.classList.toggle("is-active", n === m);
          n.node.classList.toggle("is-dimmed", n !== m && !(m.group != null && (m.keep ? m.keep.has(n) : n.group === m.group)));
        });
        tip.innerHTML = m.lines.map((line, i) => (i ? `<span>${esc(line)}</span>` : `<strong>${esc(line)}</strong>`)).join("");
        const a = m.node.getBoundingClientRect(), p = plot.getBoundingClientRect();
        tip.style.left = `${Math.min(Math.max(a.left + a.width / 2 - p.left, 90), p.width - 90)}px`;
        tip.style.top = `${a.top - p.top}px`;
        tip.classList.toggle("is-below", a.top - p.top < 70);
        if (a.top - p.top < 70) tip.style.top = `${a.bottom - p.top}px`;
        tip.classList.add("is-visible");
        fig.dispatchEvent(new CustomEvent("ac:announce", { bubbles: true, detail: { label: m.label } }));
      };
      const clear = () => {
        marks.forEach(n => n.node.classList.remove("is-active", "is-dimmed"));
        tip.classList.remove("is-visible");
      };
      const go = m => { if (m) { setStop(m); m.node.focus(); } };
      marks.forEach(m => {
        m.node.addEventListener("focus", () => { setStop(m); show(m); });
        m.node.addEventListener("blur", clear);
        m.node.addEventListener("mouseenter", () => show(m));
        m.node.addEventListener("mouseleave", () => { if (document.activeElement !== m.node) clear(); else show(m); });
        m.node.addEventListener("click", () => go(m));
        m.node.addEventListener("keydown", e => {
          if (e.key === "Escape") { tip.classList.remove("is-visible"); return; }
          const ri = rows.findIndex(r => r.includes(m)), row = rows[ri], ci = row.indexOf(m);
          const across = d => rows[(ri + d + rows.length) % rows.length];
          const grid = {
            ArrowRight: () => row[(ci + 1) % row.length],
            ArrowLeft: () => row[(ci - 1 + row.length) % row.length],
            ArrowDown: () => (rows.length > 1 ? across(1)[Math.min(ci, across(1).length - 1)] : row[(ci + 1) % row.length]),
            ArrowUp: () => (rows.length > 1 ? across(-1)[Math.min(ci, across(-1).length - 1)] : row[(ci - 1 + row.length) % row.length]),
            Home: () => row[0],
            End: () => row[row.length - 1],
          };
          const move = (m.moves && m.moves[e.key]) || grid[e.key];
          if (!move) return;
          e.preventDefault();
          go(move());
        });
      });
      setStop(marks[0]);
      return handle;
    },
  };
  const handle = {
    /** The <figure> element the chart rendered. */
    element: fig,
    /** Remove the chart and everything it added. */
    destroy() { el.textContent = ""; },
  };
  return api;
}
// Public wrapper: validates, renders, and adds update() to the returned handle.
function chart(render) {
  return function (target, options = {}) {
    let current = { ...options };
    const handle = render(target, current);
    handle.update = next => { current = { ...current, ...next }; Object.assign(handle, render(target, current), { update: handle.update }); return handle; };
    return handle;
  };
}
const rows = list => (Array.isArray(list) ? list : []).map(d => ({ ...d, label: String(d.label ?? ""), value: num(d.value) }));

/* --------------------------------------------------------------- bar chart */
function renderBar(target, o) {
  const data = rows(o.data), unit = o.unit || "", total = sum(data);
  const vertical = o.orientation === "vertical";
  const ranked = [...data].sort((a, b) => b.value - a.value);
  const rank = d => ranked.indexOf(d) + 1;
  const shown = o.sort === false ? data : ranked;
  const scale = o.axisMax ? { max: o.axisMax, step: o.axisMax / 4 } : niceScale(Math.max(...data.map(d => d.value), 0));
  const w = 720, h = vertical ? 400 : shown.length * 44 + 56;
  const f = frame(target, o, "bar", w, h);

  if (vertical) {
    const m = { l: 52, r: 16, t: 28, b: 78 }, ph = h - m.t - m.b, pw = w - m.l - m.r;
    const slot = pw / shown.length, bw = Math.min(slot * 0.68, 84);
    const y = v => m.t + ph - (v / scale.max) * ph;
    ticks(scale.max, scale.step).forEach(t => {
      svg("line", { x1: m.l, x2: w - m.r, y1: y(t), y2: y(t), class: t ? "ac-grid" : "ac-axis" }, f.back);
      svg("text", { x: m.l - 10, y: y(t) + 4, "text-anchor": "end", class: "ac-tick" }, f.back, fmt(t));
    });
    shown.forEach((d, i) => {
      const x = m.l + slot * i + (slot - bw) / 2;
      const node = svg("rect", { x, y: y(d.value), width: bw, height: Math.max(m.t + ph - y(d.value), 1), fill: f.texture(i), class: "ac-shape" }, f.marks);
      f.mark(node, { label: `${d.label}: ${withUnit(d.value, unit)}, ${pct(d.value, total)} of ${fmt(total)}. Rank ${rank(d)} of ${data.length}.`, tip: [d.label, withUnit(d.value, unit), `${pct(d.value, total)} of total`] });
      svg("text", { x: x + bw / 2, y: y(d.value) - 8, "text-anchor": "middle", class: "ac-value" }, f.front, fmt(d.value));
      wrappedText(f.back, d.label, x + bw / 2, m.t + ph + 20, Math.max(8, Math.floor(slot / 7)), { "text-anchor": "middle", class: "ac-label" });
    });
  } else {
    const m = { l: 232, r: 56, t: 10, b: 40 }, pw = w - m.l - m.r;
    shown.forEach((d, i) => {
      const y = m.t + i * 44;
      svg("text", { x: m.l - 14, y: y + 21, "text-anchor": "end", class: "ac-label" }, f.back, short(d.label, 32));
      svg("rect", { x: m.l, y: y + 6, width: pw, height: 22, class: "ac-track" }, f.back);
      const bw = Math.max((d.value / scale.max) * pw, 1);
      const node = svg("rect", { x: m.l, y: y + 6, width: bw, height: 22, fill: f.texture(i), class: "ac-shape" }, f.marks);
      f.mark(node, { label: `${d.label}: ${withUnit(d.value, unit)}, ${pct(d.value, total)} of ${fmt(total)}. Rank ${rank(d)} of ${data.length}.`, tip: [d.label, withUnit(d.value, unit), `${pct(d.value, total)} of total`] });
      svg("text", { x: m.l + pw + 12, y: y + 22, class: "ac-value" }, f.front, fmt(d.value));
    });
    const ay = m.t + shown.length * 44 + 4;
    svg("line", { x1: m.l, x2: m.l + pw, y1: ay, y2: ay, class: "ac-axis" }, f.back);
    svg("line", { x1: m.l, x2: m.l, y1: m.t, y2: ay, class: "ac-axis" }, f.back);
    svg("text", { x: m.l, y: ay + 20, class: "ac-tick" }, f.back, "0");
    svg("text", { x: m.l + pw, y: ay + 20, "text-anchor": "end", class: "ac-tick" }, f.back, fmt(scale.max));
  }
  const [a, b] = ranked, z = ranked[ranked.length - 1];
  f.summary(data.length < 2 ? `This bar chart shows ${a ? `${a.label} at ${withUnit(a.value, unit)}` : "no data"}.`
    : `This bar chart compares ${data.length} groups totalling ${withUnit(total, unit)}. ${a.label} ranks first with ${fmt(a.value)} (${pct(a.value, total)}), followed by ${b.label} with ${fmt(b.value)}. ${z.label} is lowest with ${fmt(z.value)}, a range of ${fmt(a.value - z.value)}.`,
    `{Tab} into the chart, then {←} {→} between bars, {Home} {End} to the first and last.`);
  f.table(["Category", unit || "Value", "Share", "Rank"], shown.map(d => [d.label, fmt(d.value), pct(d.value, total), rank(d)]));
  return f.done();
}

/* ------------------------------------------------------- stacked bar chart */
function renderStacked(target, o) {
  const data = (o.data || []).map(d => ({ label: String(d.label), segments: rows(d.segments) }));
  const unit = o.unit || "", vertical = o.orientation !== "horizontal";
  const keys = [...new Set(data.flatMap(d => d.segments.map(s => s.label)))];
  const totals = data.map(d => sum(d.segments)), grand = sum(totals, v => v);
  const scale = o.axisMax ? { max: o.axisMax, step: o.axisMax / 4 } : niceScale(Math.max(...totals, 0));
  const w = 720, h = vertical ? 400 : data.length * 48 + 56;
  const f = frame(target, o, "stacked", w, h);
  const addSeg = (d, s, di, node) => f.mark(node, {
    row: di, group: s.label,
    label: `${d.label}, ${s.label}: ${withUnit(s.value, unit)}, ${pct(s.value, totals[di])} of ${d.label}'s ${fmt(totals[di])}.`,
    tip: [`${d.label} · ${s.label}`, withUnit(s.value, unit), `${pct(s.value, totals[di])} of ${fmt(totals[di])}`],
  });
  if (vertical) {
    const m = { l: 52, r: 16, t: 28, b: 62 }, ph = h - m.t - m.b, pw = w - m.l - m.r;
    const slot = pw / data.length, bw = Math.min(slot * 0.6, 96);
    const y = v => m.t + ph - (v / scale.max) * ph;
    ticks(scale.max, scale.step).forEach(t => {
      svg("line", { x1: m.l, x2: w - m.r, y1: y(t), y2: y(t), class: t ? "ac-grid" : "ac-axis" }, f.back);
      svg("text", { x: m.l - 10, y: y(t) + 4, "text-anchor": "end", class: "ac-tick" }, f.back, fmt(t));
    });
    data.forEach((d, di) => {
      const x = m.l + slot * di + (slot - bw) / 2;
      let acc = 0;
      d.segments.forEach(s => {
        const node = svg("rect", { x, y: y(acc + s.value), width: bw, height: Math.max(y(acc) - y(acc + s.value), 1), fill: f.texture(keys.indexOf(s.label)), class: "ac-shape" }, f.marks);
        addSeg(d, s, di, node);
        acc += s.value;
      });
      if (o.totals !== false) svg("text", { x: x + bw / 2, y: y(acc) - 8, "text-anchor": "middle", class: "ac-value" }, f.front, fmt(acc));
      wrappedText(f.back, d.label, x + bw / 2, m.t + ph + 20, Math.max(8, Math.floor(slot / 7)), { "text-anchor": "middle", class: "ac-label" });
    });
  } else {
    const m = { l: 232, r: 56, t: 10, b: 40 }, pw = w - m.l - m.r;
    data.forEach((d, di) => {
      const y = m.t + di * 48;
      svg("text", { x: m.l - 14, y: y + 23, "text-anchor": "end", class: "ac-label" }, f.back, short(d.label, 32));
      svg("rect", { x: m.l, y: y + 6, width: pw, height: 26, class: "ac-track" }, f.back);
      let acc = 0;
      d.segments.forEach(s => {
        const node = svg("rect", { x: m.l + (acc / scale.max) * pw, y: y + 6, width: Math.max((s.value / scale.max) * pw, 1), height: 26, fill: f.texture(keys.indexOf(s.label)), class: "ac-shape" }, f.marks);
        addSeg(d, s, di, node);
        acc += s.value;
      });
      if (o.totals !== false) svg("text", { x: m.l + pw + 12, y: y + 24, class: "ac-value" }, f.front, fmt(acc));
    });
    const ay = m.t + data.length * 48 + 4;
    svg("line", { x1: m.l, x2: m.l + pw, y1: ay, y2: ay, class: "ac-axis" }, f.back);
    svg("text", { x: m.l, y: ay + 20, class: "ac-tick" }, f.back, "0");
    svg("text", { x: m.l + pw, y: ay + 20, "text-anchor": "end", class: "ac-tick" }, f.back, fmt(scale.max));
  }
  f.legend(keys.map((k, i) => ({ label: k, swatch: f.textureSwatch(i) })));
  const top = data[totals.indexOf(Math.max(...totals))];
  const keyTotals = keys.map(k => ({ label: k, value: sum(data, d => sum(d.segments.filter(s => s.label === k))) }));
  const topKey = maxBy(keyTotals);
  f.summary(data.length ? `This stacked bar chart splits ${withUnit(grand, unit)} across ${data.length} groups and ${keys.length} segments. ${top.label} is the largest group with ${fmt(Math.max(...totals))} (${pct(Math.max(...totals), grand)}). Across all groups, ${topKey.label} is the largest segment with ${fmt(topKey.value)} (${pct(topKey.value, grand)}).` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} between segments, {↑} {↓} between bars.`);
  f.table(["Group", ...keys, "Total"], data.map((d, i) => [d.label, ...keys.map(k => { const s = d.segments.find(x => x.label === k); return s ? fmt(s.value) : "–"; }), fmt(totals[i])]));
  return f.done();
}

/* ------------------------------------------------------------ donut chart */
function renderDonut(target, o) {
  const data = o.sort === true ? rows(o.data).sort((p, q) => q.value - p.value) : rows(o.data), unit = o.unit || "", total = sum(data);
  const f = frame(target, o, "donut", 420, 420);
  const cx = 210, cy = 210, pad = data.length > 1 ? 0.022 : 0;
  let a = 0;
  data.forEach((d, i) => {
    const span = total ? (d.value / total) * 2 * Math.PI : 0;
    if (span > pad * 2) {
      const node = svg("path", { d: band(cx, cy, 100, 160, a + pad, a + span - pad), fill: f.texture(i), class: "ac-shape" }, f.marks);
      f.mark(node, { label: `${d.label}: ${withUnit(d.value, unit)} of ${fmt(total)}, ${pct(d.value, total)}.`, tip: [d.label, `${fmt(d.value)} of ${withUnit(total, unit)}`, `${pct(d.value, total)} of total`] });
    }
    a += span;
  });
  svg("text", { x: cx, y: cy - 12, "text-anchor": "middle", class: "ac-center-label" }, f.back, o.centerLabel || "Total");
  svg("text", { x: cx, y: cy + 30, "text-anchor": "middle", class: "ac-center-total" }, f.back, fmt(total));
  f.legend(data.map((d, i) => ({ label: d.label, note: `${fmt(d.value)} (${pct(d.value, total)})`, swatch: f.textureSwatch(i) })));
  const ranked = [...data].sort((x, y) => y.value - x.value), top3 = sum(ranked.slice(0, 3));
  f.summary(data.length < 2 ? `This donut chart shows ${withUnit(total, unit)}.`
    : `This donut chart shows how ${withUnit(total, unit)} split across ${data.length} groups. ${ranked[0].label} is the largest slice with ${fmt(ranked[0].value)} (${pct(ranked[0].value, total)}), followed by ${ranked[1].label} with ${fmt(ranked[1].value)} (${pct(ranked[1].value, total)}).${data.length > 3 ? ` The three largest groups account for ${pct(top3, total)} of the total.` : ""} ${ranked[ranked.length - 1].label} is the smallest with ${fmt(ranked[ranked.length - 1].value)}.`,
    `{Tab} into the chart, then {←} {→} around the slices, {Home} {End} to the first and last.`);
  f.table(["Category", unit || "Value", "Share"], data.map(d => [d.label, fmt(d.value), pct(d.value, total)]));
  return f.done();
}

/* ------------------------------------------------------------- line chart */
function renderLine(target, o) {
  const cats = (o.categories || []).map(String), unit = o.unit || "";
  const series = (o.series || []).map((s, i) => ({ label: String(s.label), values: (s.values || []).map(num), st: styleFor(o, i) }));
  const all = series.flatMap(s => s.values);
  const scale = o.axisMax ? { max: o.axisMax, step: o.axisMax / 4 } : niceScale(Math.max(...all, 0));
  const w = 720, h = 380, m = { l: 56, r: 28, t: 22, b: 46 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
  const f = frame(target, o, "line", w, h);
  const x = i => m.l + (cats.length > 1 ? (i / (cats.length - 1)) * pw : pw / 2);
  const y = v => m.t + ph - (v / scale.max) * ph;
  ticks(scale.max, scale.step).forEach(t => {
    svg("line", { x1: m.l, x2: w - m.r, y1: y(t), y2: y(t), class: t ? "ac-grid" : "ac-axis" }, f.back);
    svg("text", { x: m.l - 12, y: y(t) + 4, "text-anchor": "end", class: "ac-tick" }, f.back, fmt(t));
  });
  const every = Math.ceil(cats.length / 9);
  cats.forEach((c, i) => { if (i % every === 0) svg("text", { x: x(i), y: h - 16, "text-anchor": "middle", class: "ac-tick" }, f.back, short(c, 12)); });
  series.forEach(s => svg("polyline", { points: s.values.map((v, i) => `${x(i)},${y(v)}`).join(" "), class: "ac-line", "stroke-dasharray": s.st.dash }, f.back));
  series.forEach((s, si) => s.values.forEach((v, i) => {
    const prev = i ? v - s.values[i - 1] : null;
    const change = prev == null ? "First point." : prev === 0 ? "No change from the previous point." : `${prev > 0 ? "Up" : "Down"} ${fmt(Math.abs(prev))} from ${cats[i - 1]}.`;
    const g = svg("g", {}, f.marks);
    svg("circle", { cx: x(i), cy: y(v), r: 13, class: "ac-hit" }, g);
    marker(g, s.st, x(i), y(v), 6.5);
    f.mark(g, { row: si, group: si, label: `${s.label}, ${cats[i]}: ${withUnit(v, unit)}. ${change} Point ${i + 1} of ${s.values.length}.`, tip: [`${s.label} · ${cats[i]}`, withUnit(v, unit), change] });
  }));
  f.legend(series.map(s => ({ label: s.label, swatch: markerSwatch(s.st, true) })));
  const parts = series.map(s => {
    const first = s.values[0], last = s.values[s.values.length - 1], peak = Math.max(...s.values);
    return `${s.label} ${last > first ? "rose" : last < first ? "fell" : "held"} from ${fmt(first)} to ${fmt(last)}, peaking at ${fmt(peak)} in ${cats[s.values.indexOf(peak)]}`;
  });
  const lead = series.length ? maxBy(series, s => s.values[s.values.length - 1]) : null;
  f.summary(series.length ? `This line chart tracks ${series.length} series across ${cats.length} points, from ${cats[0]} to ${cats[cats.length - 1]}${unit ? `, measured in ${unit}` : ""}. ${parts.join(". ")}.${series.length > 1 ? ` The highest at the end is ${lead.label}.` : ""}` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} along a line, {↑} {↓} to switch series.`);
  f.table(["Period", ...series.map(s => `${s.label} (${shapeName(s.st)})`)], cats.map((c, i) => [c, ...series.map(s => fmt(s.values[i] ?? 0))]));
  return f.done();
}

/* ------------------------------------------------------------ radar chart */
function renderRadar(target, o) {
  const axes = (o.axes || []).map(String), unit = o.unit || "";
  const series = (o.series || []).map((s, i) => ({ label: String(s.label), values: (s.values || []).map(num), st: styleFor(o, i) }));
  const max = o.max || niceScale(Math.max(...series.flatMap(s => s.values), 0)).max;
  const w = 640, h = 480, cx = 320, cy = 244, R = 170, n = axes.length;
  const f = frame(target, o, "radar", w, h);
  const at = (i, v) => polar(cx, cy, (v / max) * R, (i / n) * 2 * Math.PI);
  [0.25, 0.5, 0.75, 1].forEach(k => svg("polygon", { points: axes.map((_, i) => at(i, max * k).join(",")).join(" "), class: k === 1 ? "ac-ring is-outer" : "ac-ring" }, f.back));
  axes.forEach((label, i) => {
    const [x2, y2] = at(i, max), [lx, ly] = polar(cx, cy, R + 22, (i / n) * 2 * Math.PI);
    svg("line", { x1: cx, y1: cy, x2, y2, class: "ac-grid" }, f.back);
    svg("text", { x: lx, y: ly + 4, "text-anchor": Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end", class: "ac-label" }, f.back, label);
  });
  series.forEach(s => svg("polygon", { points: s.values.map((v, i) => at(i, v).join(",")).join(" "), class: "ac-line", "stroke-dasharray": s.st.dash }, f.back));
  series.forEach((s, si) => axes.forEach((axis, i) => {
    const v = s.values[i] ?? 0, [px, py] = at(i, v);
    const order = [...series].sort((p, q) => (q.values[i] ?? 0) - (p.values[i] ?? 0));
    const g = svg("g", {}, f.marks);
    svg("circle", { cx: px, cy: py, r: 13, class: "ac-hit" }, g);
    marker(g, s.st, px, py, 6.5);
    f.mark(g, { row: si, group: si, label: `${s.label}, ${axis}: ${fmt(v)} ${unit || `of ${fmt(max)}`}. Rank ${order.indexOf(s) + 1} of ${series.length} on ${axis}.`, tip: [`${s.label} · ${axis}`, `${fmt(v)} ${unit || `of ${fmt(max)}`}`, `Rank ${order.indexOf(s) + 1} of ${series.length}`] });
  }));
  f.legend(series.map(s => ({ label: s.label, swatch: markerSwatch(s.st, true) })));
  const parts = series.map(s => {
    const hi = Math.max(...s.values), lo = Math.min(...s.values);
    return `${s.label} averages ${fmt(sum(s.values, v => v) / (s.values.length || 1))}, strongest on ${axes[s.values.indexOf(hi)]} (${fmt(hi)}) and weakest on ${axes[s.values.indexOf(lo)]} (${fmt(lo)})`;
  });
  f.summary(series.length ? `This radar chart compares ${joinNames(series.map(s => s.label))} on ${n} measures, each scored out of ${fmt(max)}. ${parts.join(". ")}.` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} around the measures, {↑} {↓} to switch series.`);
  f.table(["Measure", ...series.map(s => `${s.label} (${shapeName(s.st)})`)], axes.map((a, i) => [a, ...series.map(s => fmt(s.values[i] ?? 0))]));
  return f.done();
}

/* ------------------------------------------------------- radial bar chart */
function renderRadial(target, o) {
  const unit = o.unit || "", sweep = ((o.sweep || 270) * Math.PI) / 180;
  const ranked = rows(o.data).sort((a, b) => b.value - a.value);
  const data = o.sort === "input" ? rows(o.data) : ranked;
  const max = o.max || niceScale(Math.max(...data.map(d => d.value), 0)).max;
  const w = 640, h = 520, cx = 340, cy = 270, thick = Math.min(30, 170 / Math.max(data.length, 1)), gapR = 9;
  const f = frame(target, o, "radial", w, h);
  data.forEach((d, i) => {
    const r0 = 58 + i * (thick + gapR), r1 = r0 + thick, a1 = Math.max((Math.min(d.value, max) / max) * sweep, 0.02);
    svg("path", { d: band(cx, cy, r0, r1, 0, sweep), class: "ac-track" }, f.back);
    const node = svg("path", { d: band(cx, cy, r0, r1, 0, a1), fill: f.texture(i), class: "ac-shape" }, f.marks);
    f.mark(node, { label: `${d.label}: ${withUnit(d.value, unit)}, out of ${fmt(max)}. Rank ${ranked.findIndex(x => x.label === d.label) + 1} of ${data.length}.`, tip: [d.label, withUnit(d.value, unit), `Rank ${ranked.findIndex(x => x.label === d.label) + 1} of ${data.length}`] });
    svg("text", { x: cx - 12, y: cy - (r0 + r1) / 2 + 4, "text-anchor": "end", class: "ac-label" }, f.back, `${short(d.label, 24)}  ${fmt(d.value)}`);
  });
  const top = ranked[0], low = ranked[ranked.length - 1];
  f.summary(data.length ? `This radial bar chart ranks ${data.length} groups against a maximum of ${withUnit(max, unit)}. ${top.label} leads with ${fmt(top.value)}; ${low.label} is lowest with ${fmt(low.value)}. The average is ${fmt(sum(data) / data.length)}. The largest value sits on the innermost ring.` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} between rings, {Home} {End} to the innermost and outermost.`);
  f.table(["Group", unit || "Value", "Rank"], data.map(d => [d.label, fmt(d.value), ranked.findIndex(x => x.label === d.label) + 1]));
  return f.done();
}

/* --------------------------------------------------------- sunburst chart */
function renderSunburst(target, o) {
  const unit = o.unit || "", rootNode = JSON.parse(JSON.stringify(o.data || { label: "All", children: [] }));
  const nodes = [];
  (function size(n) { if (n.children && n.children.length) n.value = sum(n.children, size); else n.value = num(n.value); return n.value; })(rootNode);
  (function place(n, a0, a1, parent, depth, tex) {
    Object.assign(n, { a0, a1, parent, depth, tex });
    if (parent) { n.path = [...(parent.path || []), n.label]; nodes.push(n); }
    let a = a0;
    (n.children || []).forEach((c, i) => { const span = n.value ? (c.value / n.value) * (a1 - a0) : 0; place(c, a, a + span, n, depth + 1, depth === 0 ? i : tex); a += span; });
  })(rootNode, 0, 2 * Math.PI, null, 0, 0);
  const total = rootNode.value, fullDepth = Math.max(1, ...nodes.map(n => n.depth));
  const depth = Math.min(fullDepth, o.maxDepth || fullDepth), all = [...nodes];
  nodes.splice(0, nodes.length, ...all.filter(n => n.depth <= depth)); // deeper levels stay in the table
  const f = frame(target, o, "sunburst", 600, 600);
  const cx = 300, cy = 300, inner = 86, ringW = (286 - inner) / depth;
  svg("text", { x: cx, y: cy - 12, "text-anchor": "middle", class: "ac-center-label" }, f.back, short(rootNode.label, 18));
  svg("text", { x: cx, y: cy + 30, "text-anchor": "middle", class: "ac-center-total" }, f.back, fmt(total));
  nodes.forEach(n => {
    const r0 = inner + (n.depth - 1) * ringW + 2, r1 = inner + n.depth * ringW - 2;
    const node = svg("path", { d: band(cx, cy, r0, r1, n.a0 + 0.012, Math.max(n.a1 - 0.012, n.a0 + 0.013)), fill: f.texture(n.tex), class: "ac-shape" }, f.marks);
    const kids = (n.children || []).length;
    const ofParent = n.depth > 1 ? ` ${pct(n.value, n.parent.value)} of ${n.parent.label},` : "";
    n.m = f.mark(node, { row: n.depth, group: n.tex, label: `${n.label}: ${withUnit(n.value, unit)}.${ofParent} ${pct(n.value, total)} of all ${fmt(total)}. Path: ${n.path.join(", then ")}. ${kids ? `${kids} subgroups.` : "No subgroups."} Ring ${n.depth} of ${depth}.`, tip: [n.label, n.path.slice(0, -1).join(" › ") || "Top level", `${withUnit(n.value, unit)}, ${pct(n.value, total)} of all`] });
    const mid = (n.a0 + n.a1) / 2, rm = (r0 + r1) / 2;
    const text = n.short || n.label;   // a shorter name for the ring; the full label is still spoken
    if ((n.a1 - n.a0) * rm > text.length * 8 + 20) {
      const [lx, ly] = polar(cx, cy, rm, mid);
      svg("text", { x: lx, y: ly + 4, "text-anchor": "middle", class: "ac-on-shape" }, f.front, text);
    }
  });
  nodes.forEach(n => {
    // Lit together: the mark, its ancestors and everything beneath it.
    const keep = new Set();
    for (let p = n.parent; p && p !== rootNode; p = p.parent) keep.add(p.m);
    (function down(x) { (x.children || []).forEach(c => { if (c.m) { keep.add(c.m); down(c); } }); })(n);
    n.m.keep = keep;
    n.m.moves = { ArrowUp: () => (n.parent !== rootNode ? n.parent.m : null), ArrowDown: () => (n.children && n.children.length && n.children[0].m) || null };
  });
  const tops = rootNode.children || [];
  f.legend(tops.map((t, i) => ({ label: t.label, note: fmt(t.value), swatch: f.textureSwatch(i) })));
  const big = tops.length ? maxBy(tops) : null;
  const bigKid = big && big.children && big.children.length ? maxBy(big.children) : null;
  f.summary(big ? `This sunburst breaks ${withUnit(total, unit)} into ${tops.length} groups${depth > 1 ? `, then into ${depth - 1} more ${depth - 1 === 1 ? "level" : "levels"}` : ""}. ${big.label} is the largest group with ${fmt(big.value)} (${pct(big.value, total)} of all)${bigKid ? `; within it, ${bigKid.label} is the largest part with ${fmt(bigKid.value)}` : ""}. Subgroups keep their parent's texture.` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} around a ring, {↑} in to the parent, {↓} out to subgroups.`);
  f.table(["Group", unit || "Value", "Share of parent", "Share of all"], all.map(n => [
    { html: `<span style="padding-left:${(n.depth - 1) * 18}px">${n.depth > 1 ? `<span class="ac-sr">${esc(n.path.slice(0, -1).join(", "))}, </span><span aria-hidden="true">└ </span>` : ""}${esc(n.label)}</span>` },
    fmt(n.value), n.depth > 1 ? pct(n.value, n.parent.value) : "–", pct(n.value, total)]));
  return f.done();
}

/* ----------------------------------------------------------- spiral graph */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function renderSpiral(target, o) {
  const unit = o.unit || "", cycle = o.cycle || 12, cycleLabel = o.cycleLabel || "Cycle";
  const data = (o.data || []).map(d => ({ period: String(d.period ?? d.label ?? ""), value: num(d.value) }));
  const dated = cycle === 12 && data.every(d => /^\d{4}-\d{2}/.test(d.period));
  const offset = dated && data.length ? +data[0].period.slice(5, 7) - 1 : 0;
  const slotName = (s, long) => (dated ? (long ? MONTHS_LONG : MONTHS)[s % 12] : ((o.labels || o.cycleLabels || [])[s]) || `${s + 1}`);
  const turns = Math.max(1, Math.ceil((data.length + offset) / cycle));
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 600, h = 600, cx = 300, cy = 300, r0 = 44, R = 250, pitch = (R - r0) / (turns + 0.9), step = (2 * Math.PI) / cycle;
  const f = frame(target, o, "spiral", w, h);
  for (let s = 0; s < cycle; s++) {
    const [lx, ly] = polar(cx, cy, R + 22, (s + 0.5) * step);
    if (cycle <= 16 || s % Math.ceil(cycle / 12) === 0) svg("text", { x: lx, y: ly + 4, "text-anchor": "middle", class: "ac-tick" }, f.back, slotName(s));
    const [gx, gy] = polar(cx, cy, R + 6, s * step), [hx, hy] = polar(cx, cy, r0 - 8, s * step);
    svg("line", { x1: hx, y1: hy, x2: gx, y2: gy, class: "ac-grid" }, f.back);
  }
  const avg = sum(data) / (data.length || 1), pts = [];
  data.forEach((d, i) => {
    const k = i + offset, turn = Math.floor(k / cycle), slot = k % cycle;
    const base = r0 + (k / cycle) * pitch, thick = 3 + (d.value / max) * (pitch - 9);
    const node = svg("path", { d: band(cx, cy, base, base + thick, slot * step + 0.03, (slot + 1) * step - 0.03), class: "ac-shape is-solid" }, f.marks);
    const where = dated ? `${slotName(slot, true)}, ${cycleLabel} ${turn + 1}` : `${d.period}, ${cycleLabel} ${turn + 1}`;
    const vs = d.value === max ? "The highest value." : d.value > avg ? "Above average." : d.value < avg ? "Below average." : "At the average.";
    pts.push(f.mark(node, { group: slot, label: `${where}: ${withUnit(d.value, unit)}. ${vs} Point ${i + 1} of ${data.length}.`, tip: [where, withUnit(d.value, unit), vs] }));
  });
  for (let t = 0; t < turns; t++) svg("text", { x: cx, y: cy - (r0 + (t + 0.5) * pitch) + 4, "text-anchor": "middle", class: "ac-on-shape" }, f.front, `${cycleLabel} ${t + 1}`);
  const peak = data.length ? maxBy(data) : null, low = data.length ? minBy(data) : null;
  const name = d => { const k = data.indexOf(d) + offset; return dated ? `${slotName(k % cycle, true)} of ${cycleLabel.toLowerCase()} ${Math.floor(k / cycle) + 1}` : d.period; };
  const turnAvg = Array.from({ length: turns }, (_, t) => { const part = data.filter((_, i) => Math.floor((i + offset) / cycle) === t); return sum(part) / (part.length || 1); });
  f.summary(peak ? `This spiral graph shows ${data.length} points over ${turns} ${turns === 1 ? "turn" : "turns"}; each turn is one ${cycleLabel.toLowerCase()}, and thicker blocks mean higher values. Values range from ${fmt(low.value)} (${name(low)}) to ${fmt(peak.value)} (${name(peak)})${unit ? ` ${unit}` : ""}.${turns > 1 ? ` The average moves from ${fmt(turnAvg[0])} in ${cycleLabel.toLowerCase()} 1 to ${fmt(turnAvg[turns - 1])} in ${cycleLabel.toLowerCase()} ${turns}.` : ""}` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} point by point, {↑} {↓} by ${cycleLabel.toLowerCase()}.`);
  // The table matches how the spiral is read: positions in rows, turns in columns, a total per turn.
  const cell = (s, t) => { const d = data[t * cycle + s - offset]; return d ? fmt(d.value) : "–"; };
  const turnNames = Array.from({ length: turns }, (_, t) => `${cycleLabel} ${t + 1}`);
  f.table([dated ? "Month" : "Position", ...turnNames], [
    ...Array.from({ length: cycle }, (_, s) => [slotName(s, true), ...turnNames.map((_, t) => cell(s, t))]),
    ["Total", ...turnNames.map((_, t) => fmt(sum(data.filter((_, i) => Math.floor((i + offset) / cycle) === t))))],
  ]);
  // The spiral reads in time order: Left/Right follow the data, Up/Down jump one whole cycle.
  pts.forEach((m, i) => { m.moves = { ArrowUp: () => pts[i - cycle] || null, ArrowDown: () => pts[i + cycle] || null }; });
  return f.done();
}

/* ------------------------------------------------------------ arc diagram */
function renderArc(target, o) {
  const unit = o.unit || "connections";
  let nodes = (o.nodes || []).map(n => ({ ...n, id: String(n.id), label: String(n.label ?? n.id), group: String(n.group ?? "") }));
  const groups = [...new Set(nodes.map(n => n.group))];
  const grouped = !["none", "input", "connections"].includes(o.order);
  if (grouped) nodes = groups.flatMap(g => nodes.filter(n => n.group === g));
  if (o.order === "connections") {
    const count = id => (o.links || []).filter(l => String(l.source) === id || String(l.target) === id).length;
    nodes = [...nodes].sort((p, q) => count(q.id) - count(p.id));
  }
  const byId = new Map(nodes.map(n => [n.id, n]));
  const links = (o.links || []).map(l => ({ a: byId.get(String(l.source)), b: byId.get(String(l.target)), value: num(l.value ?? 1) })).filter(l => l.a && l.b);
  const w = 720, h = 440, base = 350, m = 44, maxV = Math.max(...links.map(l => l.value), 1);
  const f = frame(target, o, "arc", w, h);
  nodes.forEach((n, i) => { n.x = nodes.length > 1 ? m + (i / (nodes.length - 1)) * (w - 2 * m) : w / 2; n.st = styleFor(o, groups.indexOf(n.group)); n.links = []; });
  links.forEach(l => {
    const x1 = Math.min(l.a.x, l.b.x), x2 = Math.max(l.a.x, l.b.x), r = (x2 - x1) / 2;
    l.el = svg("path", { d: `M${x1} ${base}A${r} ${Math.min(r, base - 24)} 0 0 1 ${x2} ${base}`, class: "ac-arc", "stroke-width": 1.2 + (l.value / maxV) * 4.6, "stroke-dasharray": l.a.group === l.b.group ? null : "6 5" }, f.back);
    l.a.links.push({ to: l.b, l }); l.b.links.push({ to: l.a, l });
  });
  svg("line", { x1: m - 16, x2: w - m + 16, y1: base, y2: base, class: "ac-axis" }, f.back);
  nodes.forEach(n => {
    const g = svg("g", {}, f.marks);
    svg("circle", { cx: n.x, cy: base, r: 14, class: "ac-hit" }, g);
    marker(g, n.st, n.x, base, 7);
    const list = [...n.links].sort((p, q) => q.l.value - p.l.value);
    const totalV = sum(list, x => x.l.value);
    const said = list.slice(0, 4).map(x => `${x.to.label} (${fmt(x.l.value)})`);
    const mk = f.mark(g, { group: n.id, label: `${n.label}${n.group ? `, ${n.group}` : ""}: ${list.length} ${list.length === 1 ? "connection" : "connections"}, ${fmt(totalV)} ${unit} in total.${list.length ? ` Strongest: ${joinNames(said)}.` : ""}`, tip: [n.label, `${list.length} connections · ${fmt(totalV)} ${unit}`, list.length ? `Strongest: ${list[0].to.label} (${fmt(list[0].l.value)})` : "No connections"] });
    n.m = mk;
    g.addEventListener("focus", () => links.forEach(l => l.el.classList.toggle("is-dimmed", l.a !== n && l.b !== n)));
    g.addEventListener("mouseenter", () => links.forEach(l => l.el.classList.toggle("is-dimmed", l.a !== n && l.b !== n)));
    ["blur", "mouseleave"].forEach(ev => g.addEventListener(ev, () => links.forEach(l => l.el.classList.remove("is-dimmed"))));
    svg("text", { x: n.x, y: base + 30, "text-anchor": "middle", class: "ac-label" }, f.back, short(n.short || n.label, Math.max(6, Math.floor((w - 2 * m) / nodes.length / 7.5))));
  });
  nodes.forEach(n => { n.m.keep = new Set(n.links.map(x => x.to.m)); });
  if (grouped) groups.forEach(g => {
    const xs = nodes.filter(n => n.group === g).map(n => n.x);
    if (!g) return;
    svg("line", { x1: Math.min(...xs) - 14, x2: Math.max(...xs) + 14, y1: base + 46, y2: base + 46, class: "ac-axis" }, f.back);
    svg("text", { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: base + 66, "text-anchor": "middle", class: "ac-tick" }, f.back, g);
  });
  f.legend([
    ...groups.filter(Boolean).map(g => ({ label: g, swatch: markerSwatch(nodes.find(n => n.group === g).st, false) })),
    { label: "Same group", swatch: `<svg viewBox="0 0 34 16" width="34" height="16" class="ac-swatch-line" aria-hidden="true"><path d="M2 14A15 12 0 0 1 32 14" class="ac-arc" stroke-width="2"/></svg>` },
    { label: "Across groups", swatch: `<svg viewBox="0 0 34 16" width="34" height="16" class="ac-swatch-line" aria-hidden="true"><path d="M2 14A15 12 0 0 1 32 14" class="ac-arc" stroke-width="2" stroke-dasharray="5 4"/></svg>` },
  ]);
  const hub = nodes.length ? maxBy(nodes, n => n.links.length) : null, strong = links.length ? maxBy(links) : null;
  const cross = links.filter(l => l.a.group !== l.b.group).length;
  f.summary(hub ? `This arc diagram shows ${links.length} connections between ${nodes.length} nodes${groups.filter(Boolean).length > 1 ? ` in ${groups.length} groups` : ""}. ${hub.label} is the most connected, with ${hub.links.length} connections.${strong ? ` The strongest link is between ${strong.a.label} and ${strong.b.label} (${fmt(strong.value)} ${unit}).` : ""} ${cross} of ${links.length} connections cross between groups; thicker arcs mean stronger links.` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} along the nodes, {Home} {End} to the first and last.`);
  f.table(["From", "To", unit, "Groups"], [...links].sort((p, q) => q.value - p.value).map(l => [l.a.label, l.b.label, fmt(l.value), l.a.group === l.b.group ? `Within ${l.a.group || "group"}` : "Across groups"]));
  return f.done();
}

/* ----------------------------------------------------------- scatter plot */
function renderScatter(target, o) {
  const X = { label: "x", unit: "", ...(o.x || {}) }, Y = { label: "y", unit: "", ...(o.y || {}) };
  const data = (o.data || []).map(d => ({ label: String(d.label ?? ""), group: String(d.group ?? ""), x: num(d.x), y: num(d.y) }));
  const groups = [...new Set(data.map(d => d.group))];
  const sx = X.max ? { max: X.max, step: niceScale(X.max, 6).step } : niceScale(Math.max(...data.map(d => d.x), 0), 5);
  const sy = Y.max ? { max: Y.max, step: Y.max / 4 } : niceScale(Math.max(...data.map(d => d.y), 0));
  const w = 720, h = 440, m = { l: 68, r: 28, t: 20, b: 62 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
  const f = frame(target, o, "scatter", w, h);
  const px = v => m.l + (v / sx.max) * pw, py = v => m.t + ph - (v / sy.max) * ph;
  const u = (v, a) => `${fmt(v)}${a.unit ? (a.unit === "%" ? "%" : ` ${a.unit}`) : ""}`;
  ticks(sy.max, sy.step).forEach(t => { svg("line", { x1: m.l, x2: w - m.r, y1: py(t), y2: py(t), class: t ? "ac-grid" : "ac-axis" }, f.back); svg("text", { x: m.l - 12, y: py(t) + 4, "text-anchor": "end", class: "ac-tick" }, f.back, u(t, Y.unit === "%" ? Y : { unit: "" })); });
  ticks(sx.max, sx.step).forEach(t => { svg("line", { x1: px(t), x2: px(t), y1: m.t, y2: m.t + ph, class: t ? "ac-grid" : "ac-axis" }, f.back); svg("text", { x: px(t), y: m.t + ph + 20, "text-anchor": "middle", class: "ac-tick" }, f.back, fmt(t)); });
  svg("text", { x: m.l + pw / 2, y: h - 12, "text-anchor": "middle", class: "ac-label" }, f.back, `${X.label} →`);
  svg("text", { x: 18, y: m.t + ph / 2, "text-anchor": "middle", transform: `rotate(-90 18 ${m.t + ph / 2})`, class: "ac-label" }, f.back, `${Y.label} →`);
  // Least-squares line of best fit and correlation.
  const n = data.length, mx = sum(data, d => d.x) / (n || 1), my = sum(data, d => d.y) / (n || 1);
  const sxx = sum(data, d => (d.x - mx) ** 2), syy = sum(data, d => (d.y - my) ** 2), sxy = sum(data, d => (d.x - mx) * (d.y - my));
  const slope = sxx ? sxy / sxx : 0, icpt = my - slope * mx, r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  const spread = Math.sqrt(sum(data, d => (d.y - (icpt + slope * d.x)) ** 2) / (n || 1));
  const trend = o.trendLine && n > 2;
  if (trend) {
    const xa = Math.min(...data.map(d => d.x)), xb = Math.max(...data.map(d => d.x));
    svg("line", { x1: px(xa), y1: py(icpt + slope * xa), x2: px(xb), y2: py(icpt + slope * xb), class: "ac-trend" }, f.back);
    svg("text", { x: px(xb) + 6, y: py(icpt + slope * xb) + 4, class: "ac-tick" }, f.back, "Trend");
  }
  groups.forEach((g, gi) => {
    const st = styleFor(o, gi);
    data.filter(d => d.group === g).sort((a, b) => a.x - b.x).forEach(d => {
      const res = d.y - (icpt + slope * d.x);
      const rel = !trend ? "" : Math.abs(res) < spread * 0.35 ? " On trend." : res > 0 ? " Above trend." : " Below trend.";
      const node = svg("g", {}, f.marks);
      svg("circle", { cx: px(d.x), cy: py(d.y), r: 12, class: "ac-hit" }, node);
      marker(node, st, px(d.x), py(d.y), 6);
      f.mark(node, { row: gi, group: gi, label: `${d.label}${g ? `, ${g}` : ""}: ${X.label} ${u(d.x, X)}, ${Y.label} ${u(d.y, Y)}.${rel}`, tip: [d.label || g, `${X.label}: ${u(d.x, X)}`, `${Y.label}: ${u(d.y, Y)}${rel}`] });
    });
  });
  f.legend(groups.filter(Boolean).map((g, gi) => ({ label: g, note: data.filter(d => d.group === g).length, swatch: markerSwatch(styleFor(o, gi), false) })));
  const strength = Math.abs(r) > 0.7 ? "strong" : Math.abs(r) > 0.4 ? "moderate" : Math.abs(r) > 0.2 ? "weak" : "no clear";
  const hi = n ? maxBy(data, d => d.y) : null;
  f.summary(n ? `This scatter plot places ${n} ${o.unit || "points"}${groups.filter(Boolean).length > 1 ? ` in ${groups.length} groups` : ""} by ${X.label} and ${Y.label}. There is ${strength === "no clear" ? "no clear relationship" : `a ${strength} ${r > 0 ? "positive" : "negative"} relationship`} between them${strength === "no clear" ? "" : `: as ${X.label} rises, ${Y.label} tends to ${r > 0 ? "rise" : "fall"}`}. ${hi.label || "The top point"} has the highest ${Y.label} at ${u(hi.y, Y)}.` : "This chart has no data.",
    `{Tab} into the chart, then {←} {→} through a group in order of ${X.label}, {↑} {↓} to switch groups.`);
  f.table(["Point", "Group", `${X.label}${X.unit ? ` (${X.unit})` : ""}`, `${Y.label}${Y.unit ? ` (${Y.unit})` : ""}`, ...(trend ? [`Distance from trend${Y.unit ? ` (${Y.unit})` : ""}`] : [])], data.map(d => { const res = d.y - (icpt + slope * d.x); return [d.label, d.group || "–", fmt(d.x), fmt(d.y), ...(trend ? [`${res > 0 ? "+" : res < 0 ? "−" : ""}${fmt(Math.abs(+res.toFixed(1)))}`] : [])]; }));
  return f.done();
}

/* ------------------------------------------------------------------ exports */
export const barChart = chart(renderBar);
export const stackedBarChart = chart(renderStacked);
export const donutChart = chart(renderDonut);
export const lineChart = chart(renderLine);
export const radarChart = chart(renderRadar);
export const radialBarChart = chart(renderRadial);
export const sunburstChart = chart(renderSunburst);
export const spiralGraph = chart(renderSpiral);
export const arcDiagram = chart(renderArc);
export const scatterPlot = chart(renderScatter);
export const version = "0.2.0";
