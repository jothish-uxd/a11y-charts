# Accessibility statement

Accessible Charts aims to meet **WCAG 2.2 Level AA**. This page says what each chart does, what has been tested, and what has not. It is meant to be honest, not flattering: please read the "Not yet tested" section before relying on this in production.

Last updated: 10 November 2026, for v0.2.1.

## What every chart does

| Need | How the chart meets it |
| --- | --- |
| Understand the chart without seeing it | A plain-language summary is attached to the chart and read when a screen reader reaches it. A real data table with a caption, column headers and row headers follows. |
| Tell categories apart without color | Charts are black and white. Categories differ by texture, lines by dash style, points by marker shape and fill. Nothing depends on hue. |
| Read text and marks at low vision | Ink on background is 17.9:1 in the light theme and 16.9:1 in the dark theme. Secondary text is 5.7:1 (light) and 7.7:1 (dark). |
| Use a keyboard | Each chart is one Tab stop. Arrow keys move between marks; Home and End jump to the ends; Escape closes the tooltip. The keys are printed above every chart. |
| See where focus is | The focused mark gets a ring in a second color (5.3:1 against the light background, 7.9:1 against the dark) and the other marks dim. |
| Hear what a mark is | Every mark has a spoken label with its name, value, unit and context, for example its share, rank, or change from the previous point. |
| Avoid motion | Charts do not animate. |
| Use system color settings | Light and dark follow the system or the page. Windows High Contrast (forced colors) uses system colors and keeps the textures. |

## What has been tested

- **Automated checks.** axe-core 4.14 run against the overview and all twelve chart pages of the docs site, in light and dark themes (26 page states), with the WCAG 2.0, 2.1 and 2.2 A and AA rules plus best practices. The same checks run in three browser engines, Chromium, Firefox and WebKit (the engine behind Safari), on every push to GitHub. Result on 10 November 2026: **0 violations in all three**. Three issues found on the first run were fixed: an invalid role on the chart's `<figure>`, a skipped heading level, and low-contrast comments in code samples. The full results, page by page, are in the [audit report](docs/accessibility-audit.md).
- **Scripted keyboard checks.** In all three engines, eleven checks on each of the twelve charts, driven with real key presses: one Tab stop, a label on every mark, arrow keys and Home and End moving focus, a visible focus ring, Escape closing the tooltip, and a captioned table and a summary. All pass.
- **Layout.** Checked at 1440 px and 390 px wide, in light and dark.

Automated tools find only a portion of accessibility problems. They cannot tell whether a summary is useful, whether a label makes sense when heard, or whether the arrow-key model works with a given screen reader. Passing them is a floor, not a result.

## Not yet tested

- **Screen readers.** No testing with VoiceOver, NVDA, JAWS, TalkBack or Narrator has been done. The spoken labels and summaries are written to be heard, but nobody has listened to them through assistive technology yet.
- **People.** No testing with disabled users.
- **Browsers by hand.** The automated checks run in Firefox and WebKit, but nobody has used the charts by hand in Firefox or Safari yet.
- **Windows High Contrast.** The styles are written but have not been checked on Windows.
- **Touch and voice control.** Unchecked.
- **Zoom.** 200% and 400% zoom and text-spacing overrides are unchecked beyond the 390 px layout.

## Known gaps

- While one mark is focused, the other marks dim to 28% opacity and fall below 3:1 contrast. They return to full strength when focus leaves, and all values stay in the table.
- Tooltips repeat what the mark's label says. They close with Escape, but a mouse pointer cannot move onto them.
- Axis lines and gridlines are deliberately faint. Every value is printed on or beside its mark, or is in the table, so no reading depends on them.
- Arrow-key navigation needs a screen reader's focus (forms) mode. In browse mode, marks should be reachable one by one as graphics, but this is unverified.
- Summaries and labels are generated in English only.

## Reporting a problem

If something does not work with your assistive technology, please [open an issue](https://github.com/jothish-uxd/a11y-charts/issues/new/choose) and say which chart, browser and assistive technology you used. Reports like this are the most useful contribution the project can get.
