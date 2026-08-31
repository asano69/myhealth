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

    const minutesExtent = d3.extent(data, (d) => d.minutes) as [
      number,
      number,
    ];

    const x = d3
      .scaleLinear()
      .domain([1, data.length])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([minutesExtent[0] - 30, minutesExtent[1] + 30])
      .range([0, innerHeight]);

    // Domain is [1,4] (worst to best satisfaction) but the range is
    // reversed, so a bad night (1) draws a bigger point than a good
    // night (4).
    const radius = d3.scaleLinear().domain([1, 4]).range([10, 4]);

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
      .attr("r", (d) => radius(d.satisfaction))
      .attr("fill", "var(--color-text)")
      .attr("fill-opacity", 0.7);
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
