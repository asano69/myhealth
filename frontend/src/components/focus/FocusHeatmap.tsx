import { createResource, createSignal, For, Show } from "solid-js";

import pb from "../../lib/pb";
import {
  dayOfWeek,
  formatDisplayDate,
  shiftDate,
  todayDate,
} from "../../lib/date";
import type { FocusTaskRecord } from "./FocusTaskForm";

// Number of full weeks (Sun-Sat) shown, roughly 3 months of history.
const WEEKS_TO_SHOW = 13;

type RateCategory = "none" | "0" | "33" | "50" | "66" | "100";

interface DayCell {
  date: string;
  done: number;
  total: number;
  category: RateCategory;
}

// The achievement rate is derived from (done, total) directly instead
// of a rounded done/total ratio: FocusTaskForm caps total at MAX_TASKS
// (3), so every reachable rate (0, 1/3, 1/2, 2/3, 1) already has an
// exact match below -- what matters is the rate, not the raw count, so
// e.g. 1/1 (100%) ranks above 2/3 (66%).
function rateCategory(done: number, total: number): RateCategory {
  if (total === 0) return "none";
  if (done === 0) return "0";
  if (done === total) return "100";
  if (total === 2) return "50"; // done === 1
  if (done === 1) return "33"; // total === 3, done === 1
  return "66"; // total === 3, done === 2
}

// First Sunday on or before `date`.
function startOfWeek(date: string): string {
  return shiftDate(date, -dayOfWeek(date));
}

async function fetchRecentTasks(rangeStart: string) {
  return await pb.collection("focus_tasks").getFullList<FocusTaskRecord>({
    filter: pb.filter("date >= {:start}", { start: rangeStart }),
  });
}

// GitHub-style contribution calendar for the Focus page: each cell is
// one day, colored by that day's task achievement rate rather than
// task count. Fetches its own data (like TagSelect fetches
// diary_tags), since it covers a much wider date range than the
// day-by-day task list above it.
export default function FocusHeatmap() {
  const rangeStart = startOfWeek(
    shiftDate(todayDate(), -(WEEKS_TO_SHOW - 1) * 7),
  );
  const [tasks] = createResource(() => fetchRecentTasks(rangeStart));
  const [selected, setSelected] = createSignal<DayCell | null>(null);

  const weeks = () => {
    const byDate = new Map<string, { done: number; total: number }>();
    for (const task of tasks() ?? []) {
      const entry = byDate.get(task.date) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (task.done) entry.done += 1;
      byDate.set(task.date, entry);
    }

    const days: DayCell[] = [];
    for (let i = 0; i < WEEKS_TO_SHOW * 7; i++) {
      const date = shiftDate(rangeStart, i);
      const { done = 0, total = 0 } = byDate.get(date) ?? {};
      days.push({ date, done, total, category: rateCategory(done, total) });
    }

    // Reshaped into columns of 7 (Sun-Sat) so the grid below can lay
    // out weeks left-to-right via grid-auto-flow: column.
    const result: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  };

  return (
    <div class="flex flex-col gap-2">
      <div
        class="grid gap-1"
        style={{
          "grid-template-rows": "repeat(7, 1fr)",
          "grid-auto-flow": "column",
        }}
      >
        <For each={weeks()}>
          {(week) => (
            <For each={week}>
              {(day) => (
                <div
                  class={`heat-cell heat-${day.category}`}
                  title={`${day.date}: ${
                    day.total === 0
                      ? "no tasks"
                      : `${day.done}/${day.total} done`
                  }`}
                  onMouseEnter={() => setSelected(day)}
                  onClick={() => setSelected(day)}
                />
              )}
            </For>
          )}
        </For>
      </div>

      <p class="h-5 text-sm text-text">
        <Show when={selected()} fallback="Hover or tap a day to see details.">
          {(day) => (
            <>
              {formatDisplayDate(day().date)}:{" "}
              {day().total === 0
                ? "no tasks created"
                : `${day().done}/${day().total} tasks done (${Math.round(
                    (day().done / day().total) * 100,
                  )}%)`}
            </>
          )}
        </Show>
      </p>
    </div>
  );
}
