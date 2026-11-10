# Accessible Charts

Chart components that work beyond sight. Every chart ships with a plain-language summary, keyboard access, its own texture for every category, and a real data table.

**Docs and live examples: [jothish-uxd.github.io/a11y-charts](https://jothish-uxd.github.io/a11y-charts/)**

The docs site is a single page, `index.html`. Open it in a browser; no build step.

## What's inside

- **Comparison:** horizontal bars, radar chart, radial bar chart, vertical bars
- **Part to whole:** donut, segmented horizontal, segmented vertical, sunburst chart
- **Change over time:** multi-line, spiral graph
- **Relationship:** arc diagram, scatter plot

Every chart page has a live example rendered by the package, with a "Screen reader hears" strip, a summary and data table, usage code, options, and notes on its built-in accessibility.

## Design rules

- Black and white: categories are told apart by pattern (sunburst subgroups inherit their parent's), line and radar series by dash style and marker shape, scatter and arc groups by marker shape and fill, and arcs by thickness and dash style. Geist and Geist Mono.
- Light, dark, and Windows High Contrast; reduced motion respected.
- Shares its navigation and page layout with [Enterprise Library](https://github.com/jothish-uxd/enterprise-library).

## Install

```sh
npm install github:jothish-uxd/a11y-charts
```

```js
import { barChart } from "accessible-charts";
import "accessible-charts/styles.css";

barChart(document.querySelector("#chart"), {
  title: "Support tickets by channel",
  unit: "tickets",
  data: [
    { label: "Email", value: 412 },
    { label: "Chat", value: 286 },
    { label: "Phone", value: 97 },
  ],
});
```

No dependencies. The package is one ES module (`lib/index.js`), one stylesheet (`lib/styles.css`), and TypeScript types.

Without a bundler, use the plain script build. It works from a file on disk, with no server:

```html
<link rel="stylesheet" href="node_modules/accessible-charts/lib/styles.css" />
<script src="node_modules/accessible-charts/lib/accessible-charts.global.js"></script>
<script>
  AccessibleCharts.donutChart("#chart", { title: "Tickets by channel", data: [{ label: "Email", value: 412 }, { label: "Chat", value: 286 }] });
</script>
```

## API

Ten functions cover the twelve charts: `barChart` and `stackedBarChart` (each horizontal or vertical), `donutChart`, `lineChart`, `radarChart`, `radialBarChart`, `sunburstChart`, `spiralGraph`, `arcDiagram`, `scatterPlot`.

Each takes a target (an element or a selector) and an options object, and returns `{ element, update(options), destroy() }`. Options are documented per chart on the docs site and typed in `lib/index.d.ts`. These work on every chart:

| Option | What it does |
| --- | --- |
| `title` | Names the chart for everyone, including assistive technology. |
| `unit` | What the numbers count; read out with every value. |
| `summary` | `"auto"` (default) writes one from the data. Pass your own text, or `false` to hide the visible copy. |
| `table` | `false` hides the data table. |
| `patterns` / `shapes` | Pin a texture or marker to a category so it stays the same across charts. |

Every chart is one Tab stop with arrow keys between marks. As focus moves, the chart fires an `ac:announce` event whose `detail.label` is what a screen reader says for that mark.

Colors follow light and dark automatically; override the `--ac-*` custom properties in `lib/styles.css` to match your product.

## Documentation

- [Docs site](https://jothish-uxd.github.io/a11y-charts/): a page per chart with a live example, usage, options and accessibility notes.
- [Accessibility statement](ACCESSIBILITY.md): what every chart does, what has been tested, and what has not.
- [Theming](docs/theming.md): the color and font properties, light and dark, and the contrast to keep.
- [Methods and events](docs/methods-and-events.md): `update()`, `destroy()`, the `ac:announce` event, and the shared options.
- [Changelog](CHANGELOG.md) and [contributing guide](CONTRIBUTING.md).

## In this repo

- `index.html`: the docs site. Its live examples are rendered by the package.
- `lib/`: the package. `accessible-charts.global.js` is generated from `index.js` by `node scripts/build-global.mjs`.
- `examples/index.html`: every chart on one page, imported as an ES module (needs a local server, e.g. `npx serve`).
- `docs/`: the guides linked above.

## Status

v0.2.0. Not on the npm registry yet, so install from GitHub as shown above; add `#v0.2.0` to pin this version. Automated accessibility checks pass, but the charts have not been tested with screen readers yet. See the [accessibility statement](ACCESSIBILITY.md); reports are welcome.
