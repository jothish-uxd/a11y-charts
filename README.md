# Accessible Charts

Chart components that work beyond sight. Every chart ships with a plain-language summary, keyboard access, its own texture for every category, and a real data table.

The docs site is a single page, `index.html`. Open it in a browser; no build step.

## What's inside

- **Comparison:** horizontal bars, vertical bars
- **Part to whole:** donut, segmented horizontal, segmented vertical
- **Change over time:** multi-line
- **Relationship:** arc diagram, scatter plot

Every chart page has a live example with a "Screen reader hears" strip, a summary and data table, usage code, options, and notes on its built-in accessibility.

## Design rules

- Black and white: categories are told apart by pattern, line series by dash style and marker shape, scatter and arc groups by marker shape and fill, and arcs by thickness and dash style. Geist and Geist Mono.
- Light, dark, and Windows High Contrast; reduced motion respected.
- Shares its navigation and page layout with [Enterprise Library](https://github.com/jothish-uxd/enterprise-library).

## Status

v0.2 preview. The package (`accessible-charts`) isn't published yet, and the usage code on each page shows the proposed API. Next up: one Tab stop per chart with arrow keys between marks, and the summary placed before each chart.
