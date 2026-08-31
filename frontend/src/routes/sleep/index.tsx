import { createSignal, onMount } from "solid-js";

import pb from "../../lib/pb";
import SleepLogForm from "../../components/sleep/SleepLogForm";
import type { SleepLogRecord } from "../../components/sleep/SleepLogForm";
import SleepChart from "../../components/sleep/SleepChart";
import SleepLogTable from "../../components/sleep/SleepLogTable";

const RECENT_LOG_COUNT = 30;

// Combines the sleep-log input form with the bedtime chart. The chart
// re-fetches the full recent list after every save (see handleSaved),
// rather than patching the list locally, to keep this page simple.
export default function Sleep() {
  const [logs, setLogs] = createSignal<SleepLogRecord[]>([]);

  const loadRecent = async () => {
    try {
      const result = await pb
        .collection("sleep_logs")
        .getList<SleepLogRecord>(1, RECENT_LOG_COUNT, { sort: "-date" });
      setLogs(result.items);
    } catch (err) {
      console.error("[sleep] failed to load recent logs:", err);
    }
  };

  onMount(loadRecent);

  return (
    <div class="flex w-full flex-col gap-6 xl:mx-auto xl:max-w-3xl">
      <h1 class="mb-4 font-sans text-4xl">Sleep</h1>
      <SleepLogForm onSaved={loadRecent} />
      <SleepChart logs={logs()} />
      <SleepLogTable logs={logs()} />
    </div>
  );
}
