/** Where a chart renders: an element, or a selector for one. */
export type Target = Element | string;

export interface BaseOptions {
  /** Names the chart for everyone, including assistive technology. */
  title: string;
  /** What the numbers count, e.g. "tickets". Read out with every value. */
  unit?: string;
  /** "auto" (default) writes a plain-language summary from the data. Pass your own text, or false to hide the visible copy; screen readers always get one. */
  summary?: "auto" | string | false;
  /** Render the semantic data table. Default true. */
  table?: boolean;
  /** Texture per category, by name: see the exported `textures`. */
  patterns?: string[];
  /** Marker per series or group, e.g. "hollow circle", "filled square". */
  shapes?: string[];
  /** Show the legend. Default true. */
  legend?: boolean;
}

export interface ChartHandle<O> {
  /** The <figure> the chart rendered. Fires "ac:announce" with detail.label as focus moves. */
  element: HTMLElement;
  /** Re-render with these options merged over the current ones. */
  update(options: Partial<O>): ChartHandle<O>;
  /** Remove the chart and everything it added. */
  destroy(): void;
}

export interface Datum { label: string; value: number }

export interface BarChartOptions extends BaseOptions {
  data: Datum[];
  /** Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  /** Upper bound of the value axis. Default: a round number above the largest value. */
  axisMax?: number;
  /** Bars are ranked largest first; pass false to keep your order. */
  sort?: boolean;
}
export interface StackedBarChartOptions extends BaseOptions {
  data: { label: string; segments: Datum[] }[];
  /** Default "vertical". */
  orientation?: "horizontal" | "vertical";
  axisMax?: number;
  /** Print each bar's total beside it. Default true. */
  totals?: boolean;
}
export interface DonutChartOptions extends BaseOptions {
  data: Datum[];
  /** Caption above the total in the hole. Default "Total". */
  centerLabel?: string;
  /** Order slices largest first. Default false. */
  sort?: boolean;
}
export interface Series { label: string; values: number[] }
export interface LineChartOptions extends BaseOptions {
  /** One label per point along the x axis. */
  categories: string[];
  series: Series[];
  axisMax?: number;
}
export interface RadarChartOptions extends BaseOptions {
  /** One label per spoke. */
  axes: string[];
  series: Series[];
  /** Every spoke shares this scale. */
  max?: number;
}
export interface RadialBarChartOptions extends BaseOptions {
  data: Datum[];
  /** The value a full sweep stands for. */
  max?: number;
  /** Degrees of the full sweep. Default 270. */
  sweep?: number;
  /** "descending" (default) puts the largest value on the innermost ring. */
  sort?: "descending" | "input";
}
export interface TreeNode { label: string; value?: number; children?: TreeNode[] }
export interface SunburstChartOptions extends BaseOptions {
  data: TreeNode;
  /** How many rings to draw. Deeper levels stay in the table. */
  maxDepth?: number;
}
export interface SpiralGraphOptions extends BaseOptions {
  /** Oldest first. "YYYY-MM" periods with a cycle of 12 are read as months. */
  data: { period: string; value: number }[];
  /** Points per turn. Default 12. */
  cycle?: number;
  /** What one turn is called, e.g. "Year". */
  cycleLabel?: string;
  /** Names for the positions around a turn, when periods aren't months. */
  labels?: string[];
}
export interface ArcDiagramOptions extends BaseOptions {
  nodes: { id: string; label: string; short?: string; group?: string }[];
  links: { source: string; target: string; value?: number }[];
  /** "group" (default) keeps groups together; "connections" puts the most connected first. */
  order?: "group" | "input" | "connections";
}
export interface ScatterAxis { label: string; unit?: string; max?: number }
export interface ScatterPlotOptions extends BaseOptions {
  data: { label: string; group?: string; x: number; y: number }[];
  x: ScatterAxis;
  y: ScatterAxis;
  /** Adds a line of best fit, and "above / below trend" to every label. */
  trendLine?: boolean;
}

export function barChart(target: Target, options: BarChartOptions): ChartHandle<BarChartOptions>;
export function stackedBarChart(target: Target, options: StackedBarChartOptions): ChartHandle<StackedBarChartOptions>;
export function donutChart(target: Target, options: DonutChartOptions): ChartHandle<DonutChartOptions>;
export function lineChart(target: Target, options: LineChartOptions): ChartHandle<LineChartOptions>;
export function radarChart(target: Target, options: RadarChartOptions): ChartHandle<RadarChartOptions>;
export function radialBarChart(target: Target, options: RadialBarChartOptions): ChartHandle<RadialBarChartOptions>;
export function sunburstChart(target: Target, options: SunburstChartOptions): ChartHandle<SunburstChartOptions>;
export function spiralGraph(target: Target, options: SpiralGraphOptions): ChartHandle<SpiralGraphOptions>;
export function arcDiagram(target: Target, options: ArcDiagramOptions): ChartHandle<ArcDiagramOptions>;
export function scatterPlot(target: Target, options: ScatterPlotOptions): ChartHandle<ScatterPlotOptions>;

/** Names of the built-in textures, in the order charts hand them out. */
export const textures: string[];
export const version: string;
