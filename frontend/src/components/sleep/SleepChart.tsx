import { createEffect, onCleanup } from "solid-js";
import * as d3 from "d3";

import type { SleepLogRecord } from "./SleepLogForm";

const WIDTH = 320;
const HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 48 };

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

export interface SleepChartProps {
  logs: SleepLogRecord[];
}

// Scatter plot of bedtime over recent nights. Point size encodes
// satisfaction, with lower satisfaction drawn larger so bad nights
// stand out -- this mirrors the encoding used by the previous
// Vega-based chart (see frontend-old/src/sleep/SleepChart.jsx).
export default function SleepChart(props: SleepChartProps) {
  let svgRef: SVGSVGElement | undefined;

  createEffect(() => {
    if (!svgRef) return;
    const svg = d3.select(svgRef);
    svg.selectAll("*").remove();

    // props.logs arrives newest-first (see index.tsx's -date sort);
    // reverse it so the x-axis reads chronologically, oldest to newest.
    const data = [...props.logs].reverse().map((log, i) => ({
      index: i + 1,
      minutes: timeToMinutes(log.time),
      satisfaction: log.satisfaction,
    }));

    if (data.length === 0) return;

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const minutesExtent = d3.extent(data, (d) => d.minutes) as [number, number];

    const x = d3.scaleLinear().domain([1, data.length]).range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([minutesExtent[0] - 30, minutesExtent[1] + 30])
      .range([0, innerHeight]);

    // Satisfaction only ever takes the integer values 1-4, so each one
    // maps to a fixed stop on a diverging red/blue scale (deep red ->
    // light red -> light blue -> deep blue), the same style used for
    // diverging data in scientific plots. Dark mode darkens each stop
    // (rather than brightening) so the points don't glare against a
    // dark background; the two palettes are combined via CSS
    // light-dark(), same pattern as theme.css.
    const REDBLUE_LIGHT = ["#ca0020", "#f4a582", "#92c5de", "#0571b0"];
    const REDBLUE_DARK = REDBLUE_LIGHT.map((c) =>
      d3.color(c).darker(1).formatHex(),
    );
    const colorLight = d3
      .scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4])
      .range(REDBLUE_LIGHT);
    const colorDark = d3
      .scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4])
      .range(REDBLUE_DARK);

    const g = svg
      .attr("width", WIDTH)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(Math.min(data.length, 10))
          .tickFormat(d3.format("d")),
      );

    g.append("g").call(
      d3.axisLeft(y).tickFormat((d) => formatMinutes(d as number)),
    );

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.index))
      .attr("cy", (d) => y(d.minutes))
      .attr("r", 6)
      .style(
        "fill",
        (d) =>
          `light-dark(${colorLight(d.satisfaction)}, ${colorDark(d.satisfaction)})`,
      )
      .attr("fill-opacity", 0.85);
  });

  onCleanup(() => {
    if (svgRef) d3.select(svgRef).selectAll("*").remove();
  });

  return (
    <div class="flex justify-center">
      <svg ref={svgRef} />
    </div>
  );
}
