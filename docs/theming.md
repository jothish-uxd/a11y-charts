# Theming

The charts are black and white on purpose: categories are told apart by texture, dash and shape, so a theme only needs two colors that contrast strongly. Everything is set through CSS custom properties on `.ac-chart`.

## Properties

| Property | Used for | Light default | Dark default |
| --- | --- | --- | --- |
| `--ac-ink` | Marks, text, textures, tooltips | `#171717` | `#ededed` |
| `--ac-ink-soft` | Axis ticks, legend notes, summary text | `#666666` | `#a1a1a1` |
| `--ac-bg` | The background behind and inside textures | `#ffffff` | `#0a0a0a` |
| `--ac-rule` | Gridlines, table rules | `#ebebeb` | `#242424` |
| `--ac-rule-strong` | Axis lines | `#d4d4d4` | `#3a3a3a` |
| `--ac-track` | The empty part of a bar's track | `#f2f2f2` | `#1a1a1a` |
| `--ac-focus` | The focus ring | `#0068d6` | `#52a8ff` |
| `--ac-font` | Font family | `inherit` | `inherit` |

## Match your product

Set the properties anywhere above the charts:

```css
.ac-chart {
  --ac-ink: #1b1f3b;
  --ac-ink-soft: #5a5f7a;
  --ac-bg: #fbfaf7;
  --ac-focus: #b3261e;
  --ac-font: "Inter", system-ui, sans-serif;
}
```

`--ac-bg` must match the surface the chart sits on. Textures are drawn in `--ac-ink` over `--ac-bg`, so a mismatch shows as boxes behind the patterns.

## Light and dark

With no setup, charts follow the system setting (`prefers-color-scheme`). To control it yourself, put one of these on any ancestor of the chart:

```html
<html data-theme="dark">   <!-- or data-theme="light" -->
<body class="dark">
```

If your product has its own tokens, map them once and the charts follow your theme switch:

```css
.ac-chart {
  --ac-ink: var(--text);
  --ac-ink-soft: var(--text-muted);
  --ac-bg: var(--surface);
  --ac-rule: var(--border);
  --ac-rule-strong: var(--border-strong);
  --ac-track: var(--surface-sunken);
  --ac-focus: var(--focus-ring);
}
```

## Contrast to keep

A theme can break accessibility that the defaults provide. When you change colors, keep:

- `--ac-ink` on `--ac-bg` at **4.5:1** or more. It carries all text and all marks.
- `--ac-ink-soft` on `--ac-bg` at **4.5:1** or more. It carries axis labels.
- `--ac-focus` on `--ac-bg` at **3:1** or more, and clearly different from `--ac-ink`, because the focus ring replaces the mark's outline.

## Windows High Contrast

In forced-colors mode the charts switch to system colors (`CanvasText`, `Canvas`, `Highlight`) and ignore the properties above. Textures are kept, so categories stay distinguishable.

## Sizing

A chart fills the width of its container up to a maximum set per chart type, and keeps its proportions. To make one smaller, constrain the container:

```css
#revenue { max-width: 480px; }
```
