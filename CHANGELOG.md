# Changelog

Notable changes to Accessible Charts. Versions follow [semantic versioning](https://semver.org/); while the version is below 1.0, minor releases may change the API.

## 0.2.0 (2026-11-09)

First installable release.

### Added

- The `accessible-charts` package in `lib/`: ten functions covering twelve charts (`barChart`, `stackedBarChart`, `donutChart`, `lineChart`, `radarChart`, `radialBarChart`, `sunburstChart`, `spiralGraph`, `arcDiagram`, `scatterPlot`), a stylesheet, and TypeScript types. Install with `npm install github:jothish-uxd/a11y-charts`.
- A plain `<script>` build, `lib/accessible-charts.global.js`, that works without a bundler or a server.
- Every chart is one Tab stop with arrow-key navigation, a spoken label on every mark, a generated summary and a data table.
- `update()` and `destroy()` on every chart, and an `ac:announce` event carrying the focused mark's spoken label.
- Options shared by all charts: `summary`, `table`, `patterns`, `shapes`, `legend`, `headingLevel`.
- `examples/index.html`, with every chart rendered from the package.
- Accessibility statement, contributing guide, theming guide, and a guide to methods and events.
- `npm run audit`: a repeatable accessibility audit (axe-core plus scripted keyboard checks) that writes `docs/accessibility-audit.md`.

### Changed

- The docs site's live examples are rendered by the package instead of separate hand-built code.
- Counts of one drop the plural: "1 character", not "1 characters".

### Fixed

- Issues found by an axe-core audit: an invalid role on the chart's `<figure>`, a skipped heading level, and low-contrast comments in code samples.

## 0.1.0

Prototype. A single-page docs site with hand-built charts; nothing to install.
