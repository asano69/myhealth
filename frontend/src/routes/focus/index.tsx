import { createSignal, onMount, For, Show } from "solid-js";

import pb from "../../lib/pb";
import FocusTaskItem from "../../components/focus/FocusTaskItem";
import FocusTaskForm from "../../components/focus/FocusTaskForm";
import type { FocusTaskRecord } from "../../components/focus/FocusTaskForm";

const MAX_TASKS = 3;

// Today's date as "YYYY-MM-DD".
function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Focus is a minimal daily todo list: up to MAX_TASKS items for today,
// each with only a done/not-done state. No priorities, due dates, or
// editing beyond an inline rename -- the whole point is to keep the
// list short and simple. Each mutation (add/toggle/rename/delete) is
// owned by the component that triggers it (FocusTaskForm/FocusTaskItem);
// this page only holds the loaded list and re-syncs it from whatever
// record each mutation reports back.
export default function Focus() {
  const [tasks, setTasks] = createSignal<FocusTaskRecord[]>([]);

  const loadTasks = async () => {
    try {
      const result = await pb
        .collection("focus_tasks")
        .getFullList<FocusTaskRecord>({
          filter: pb.filter("date = {:date}", { date: todayDate() }),
          sort: "created",
        });
      setTasks(result);
    } catch (err) {
      console.error("[focus] failed to load tasks:", err);
    }
  };

  onMount(loadTasks);

  const handleAdded = (record: FocusTaskRecord) => {
    setTasks((prev) => [...prev, record]);
  };

  const handleChanged = (record: FocusTaskRecord) => {
    setTasks((prev) => prev.map((t) => (t.id === record.id ? record : t)));
  };

  const handleDeleted = (task: FocusTaskRecord) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  return (
    <div class="flex w-full flex-col gap-4 xl:mx-auto xl:max-w-3xl">
      <h1 class="mb-4 font-sans text-4xl">Focus</h1>

      <div class="flex flex-col [&>*]:border-b [&>*]:border-border [&>*:last-child]:border-b-0">
        <For each={tasks()}>
          {(task) => (
            <FocusTaskItem
              task={task}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
            />
          )}
        </For>
      </div>

      <Show when={tasks().length === 0}>
        <p class="text-sm text-border">No tasks yet.</p>
      </Show>

      {/* Hidden once today's 3 tasks are already registered, since
          this list is deliberately capped -- see MAX_TASKS above. */}
      <Show when={tasks().length < MAX_TASKS}>
        <FocusTaskForm
          date={todayDate()}
          hasExistingTasks={tasks().length > 0}
          onAdded={handleAdded}
        />
      </Show>
    </div>
  );
}
