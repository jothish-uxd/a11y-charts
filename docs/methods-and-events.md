# Methods and events

Every chart function returns a handle:

```js
const chart = barChart("#tickets", { title: "Tickets by channel", unit: "tickets", data });
```

| Member | What it does |
| --- | --- |
| `chart.element` | The `<figure>` the chart rendered. |
| `chart.update(options)` | Re-renders with these options merged over the current ones. Returns the handle. |
| `chart.destroy()` | Removes the chart and everything it added to the target. |

## Updating data

Pass only what changed. The summary, labels and table are regenerated.

```js
const chart = lineChart("#activity", {
  title: "Weekly sign-ups",
  unit: "sign-ups",
  categories: ["Mon", "Tue", "Wed"],
  series: [{ label: "Web", values: [120, 140, 135] }],
});

// Later, when new data arrives:
chart.update({
  categories: ["Mon", "Tue", "Wed", "Thu"],
  series: [{ label: "Web", values: [120, 140, 135, 160] }],
});
```

An update redraws the chart, so keyboard focus inside it is lost. Avoid updating on a timer while someone may be reading the chart; update when they ask for it, or when focus is elsewhere.

## Removing a chart

```js
chart.destroy();
```

In a framework, create the chart when the component mounts and destroy it when it unmounts:

```jsx
import { useEffect, useRef } from "react";
import { donutChart } from "accessible-charts";
import "accessible-charts/styles.css";

function Donut({ title, data }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = donutChart(ref.current, { title, data });
    return () => chart.destroy();
  }, [title, data]);
  return <div ref={ref} />;
}
```

## The `ac:announce` event

When a mark is focused or hovered, the chart's `<figure>` fires `ac:announce`. `event.detail.label` is the text a screen reader speaks for that mark. The event bubbles, so you can listen on the chart or on any ancestor.

Show the announcement on screen, as the docs site's "Screen reader hears" strip does:

```js
const chart = scatterPlot("#pilots", options);
const strip = document.querySelector("#hears");

chart.element.addEventListener("ac:announce", event => {
  strip.textContent = event.detail.label;
});
```

Or log which marks people explore:

```js
document.addEventListener("ac:announce", event => {
  console.log(event.target.querySelector(".ac-title").textContent, "→", event.detail.label);
});
```

Do not copy the label into an `aria-live` region. The screen reader already speaks it when focus lands on the mark, and a live region would make it speak twice.

## Options that shape the output

These work on every chart. Each chart's own options are on its page of the docs site.

| Option | Default | What it does |
| --- | --- | --- |
| `title` | (required) | Names the chart for everyone, including assistive technology. |
| `unit` | none | What the numbers count. Read out with every value; a count of one drops a plain plural "s". |
| `summary` | `"auto"` | `"auto"` writes a summary from the data. A string replaces it. `false` hides the visible copy; screen readers still get one. |
| `table` | `true` | `false` hides the data table. Only do this if the same data is elsewhere on the page. |
| `legend` | `true` | `false` hides the legend. |
| `headingLevel` | `3` | Level of the "Summary" and "Data table" headings, 2 to 6, to fit your page outline. |
| `patterns` | built-in order | Texture per category, by name, so a category keeps its texture across charts. Names are in the exported `textures` array. |
| `shapes` | built-in order | Marker per series or group, for example `"hollow circle"` or `"filled square"`. |

## Writing your own summary

The generated summary states the size of the data and its extremes. You usually know the point of the chart better than the generator does:

```js
barChart("#tickets", {
  title: "Support tickets by channel",
  unit: "tickets",
  data,
  summary: "Email is still the busiest channel, but chat grew by a third this quarter and phone is now under a tenth of all tickets.",
});
```
