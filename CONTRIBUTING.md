# Contributing

Thanks for looking. This is a small project and reports are as welcome as code.

## Report a problem

[Open an issue](https://github.com/jothish-uxd/a11y-charts/issues/new/choose). For accessibility problems, the most helpful details are:

- which chart
- your browser and operating system
- your assistive technology and its version (for example NVDA 2025.1, VoiceOver on macOS 15)
- what you expected to hear or do, and what happened instead

You do not need a fix in mind. "This label is confusing when read aloud" is a useful report.

## Run it locally

There is nothing to install and no build step for the docs.

```sh
git clone https://github.com/jothish-uxd/a11y-charts.git
cd a11y-charts
open index.html            # the docs site; works straight from disk
npx serve .                # then visit /examples/ for every chart on one page
```

`examples/index.html` imports the package as an ES module, which browsers only allow from a server. That is why it needs `npx serve` and the docs site does not.

## Where things are

| Path | What it is |
| --- | --- |
| `lib/index.js` | The package. All ten chart functions, no dependencies. |
| `lib/styles.css` | The package's stylesheet. |
| `lib/index.d.ts` | TypeScript types. Update them when an option changes. |
| `lib/accessible-charts.global.js` | Generated from `lib/index.js`. Do not edit by hand. |
| `index.html` | The docs site. Its live examples call the package. |
| `examples/index.html` | Every chart on one page. |
| `docs/` | Guides: theming, methods and events. |

## Make a change

1. Edit `lib/index.js` (and `lib/styles.css` or `lib/index.d.ts` if needed).
2. Regenerate the script build: `npm run build`. The docs site loads this file, so skipping the step means the site will not show your change.
3. Check the docs site and `examples/` in light and dark themes.
4. Check with the keyboard: one Tab stop per chart, arrow keys between marks, a visible focus ring.
5. If you changed an option, update the options table on that chart's page in `index.html` and the types. `npm run typecheck` fails if the code reads an option that `lib/index.d.ts` does not declare.
6. Run the checks: `npm install` once, then `npm run check`, which rebuilds the script file, type-checks, and runs the accessibility audit. Or run `npm run audit` on its own. It checks every page with axe-core, drives every chart with the keyboard, and rewrites `docs/accessibility-audit.md`. Both must finish with no failures.
7. Add a line to `CHANGELOG.md`.

## What a chart must do

A new chart, or a change to one, has to keep these promises:

- A plain-language summary generated from the data, with an option to replace it.
- A data table that holds every value the chart shows.
- One Tab stop; arrow keys reach every mark; each mark has a spoken label that makes sense on its own.
- Nothing told apart by color alone: use the textures, dash styles and marker shapes.
- No animation.
- Works in light, dark and forced-colors modes.

If a design cannot meet one of these, open an issue to talk it through before building.

## Pull requests

Keep them small and say what you tested and with what. If you tested with a screen reader, say which one: `ACCESSIBILITY.md` lists what has and has not been tested, and your result can be added to it.
