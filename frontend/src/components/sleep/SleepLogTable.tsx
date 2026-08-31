import { For, Show } from "solid-js";

import { formatDisplayDate } from "../../lib/date";
import type { SleepLogRecord } from "./SleepLogForm";

export interface SleepLogTableProps {
  logs: SleepLogRecord[];
}

// Read-only table of recent sleep logs, styled to match the rest of
// the app's lists (see components/notes/NotesList.jsx) rather than
// frontend-old's plain HTML table.
export default function SleepLogTable(props: SleepLogTableProps) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-border text-text">
            <th class="py-2 pr-4 font-sans font-semibold">Date</th>
            <th class="py-2 pr-4 font-sans font-semibold">Time</th>
            <th class="py-2 font-sans font-semibold">Satisfaction</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.logs}>
            {(log) => (
              <tr class="border-b border-border last:border-b-0">
                <td class="py-2 pr-4 font-mono">
                  {formatDisplayDate(log.date)}
                </td>
                <td class="py-2 pr-4 font-mono">{log.time}</td>
                <td class="py-2 font-mono">{log.satisfaction}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Show when={props.logs.length === 0}>
        <p class="py-4 text-sm text-border">No sleep logs yet.</p>
      </Show>
    </div>
  );
}
