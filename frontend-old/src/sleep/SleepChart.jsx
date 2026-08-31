import { createEffect, onCleanup } from "solid-js";
import embed from "vega-embed";

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function SleepChart(props) {
  let el;

  createEffect(() => {
    const logs = props.logs;
    if (!logs?.length) return;

    // logs arrive newest-first (-date sort); reverse so index 1 = oldest, 7 = newest.
    const data = [...logs].reverse().map((log, i) => ({
      index: i + 1,
      minutes: timeToMinutes(log.time),
      quality: log.quality,
    }));

    const mins = data.map((d) => d.minutes);
    const lo = Math.min(...mins) - 30;
    const hi = Math.max(...mins) + 30;

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      // Inner plot area is square; axes/labels are added outside this.
      width: 260,
      height: 260,
      background: "#808080",
      padding: 16,
      config: {
        // Remove the border drawn around the plot area.
        view: { stroke: "transparent" },
        axis: {
          grid: false,
          domainColor: "#111",
          domainWidth: 1.5,
          tickColor: "#111",
          tickSize: 6,
          labelColor: "#111",
          // 0.8rem at 18px base ≈ 14px
          labelFontSize: 14,
        },
      },
      data: { values: data },
      mark: { type: "point", filled: true, color: "#f4f3f1" },
      encoding: {
        x: {
          field: "index",
          type: "ordinal",
          title: null,
          axis: { labelAngle: 0 },
        },
        y: {
          field: "minutes",
          type: "quantitative",
          title: null,
          scale: { domain: [lo, hi] },
          axis: {
            tickCount: 5,
            labelExpr:
              "floor(datum.value/60) + ':' + (datum.value%60<10 ? '0'+datum.value%60 : ''+datum.value%60)",
          },
        },
        size: {
          field: "quality",
          type: "quantitative",
          scale: { domain: [1, 4], range: [500, 50] },
          legend: null,
        },
      },
    };

    const p = embed(el, spec, { actions: false });
    onCleanup(() => p.then(({ finalize }) => finalize()));
  });

  // Center the chart regardless of the surrounding layout.
  return (
    <div style={{ display: "flex", "justify-content": "center" }}>
      <div ref={el} />
    </div>
  );
}
