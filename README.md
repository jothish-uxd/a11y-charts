# Accessible Charts

Chart components that work beyond sight. Every chart ships with a plain-language summary, keyboard access, its own texture for every category, and a real data table.

The docs site is a single page, `index.html`. Open it in a browser; no build step. The package lives in `lib/`.

## What's inside

- **Comparison:** horizontal bars, radar chart, radial bar chart, vertical bars
- **Part to whole:** donut, segmented horizontal, segmented vertical, sunburst chart
- **Change over time:** multi-line, spiral graph
- **Relationship:** arc diagram, scatter plot

Every chart page has a live example with a "Screen reader hears" strip, a summary and data table, usage code, options, and notes on its built-in accessibility.

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

No dependencies and no build step: the package is one ES module (`lib/index.js`), one stylesheet (`lib/styles.css`), and TypeScript types. Without a bundler, import the two files directly:

```html
<link rel="stylesheet" href="node_modules/accessible-charts/lib/styles.css" />
<script type="module">
  import { donutChart } from "./node_modules/accessible-charts/lib/index.js";
</script>
```

Ten functions cover the twelve charts: `barChart` and `stackedBarChart` (each horizontal or vertical), `donutChart`, `lineChart`, `radarChart`, `radialBarChart`, `sunburstChart`, `spiralGraph`, `arcDiagram`, `scatterPlot`. Every call returns `{ element, update(options), destroy() }`. `examples/index.html` renders all of them from the package.

Every chart is one Tab stop with arrow keys between marks, and fires an `ac:announce` event with the focused mark's spoken label.

## Status

v0.2.0. The docs site's own live examples are still hand-built in `index.html`; the package in `lib/` implements the same designs and the API shown on each page. Next up: rendering the docs from the package, and placing the summary before each chart.
