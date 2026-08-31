import { createSignal, onMount, For, Show } from "solid-js";
import Trash2 from "lucide-solid/icons/trash-2";

import pb from "../../lib/pb";

const MAX_TASKS = 3;

// Matches the PocketBase "focus_tasks" collection schema.
interface FocusTask {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  done: boolean;
  created: string;
  updated: string;
}

// Today's date as "YYYY-MM-DD".
function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Focus is a minimal daily todo list: up to MAX_TASKS items for today,
// each with only a done/not-done state. No priorities, due dates, or
// editing -- the whole point is to keep the list short and simple.
export default function Focus() {
  const [tasks, setTasks] = createSignal<FocusTask[]>([]);
  const [title, setTitle] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const loadTasks = async () => {
    try {
      const result = await pb
        .collection("focus_tasks")
        .getFullList<FocusTask>({
          filter: pb.filter("date = {:date}", { date: todayDate() }),
          sort: "created",
        });
      setTasks(result);
    } catch (err) {
      console.error("[focus] failed to load tasks:", err);
    }
  };

  onMount(loadTasks);

  const handleAdd = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!title().trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const record = await pb.collection("focus_tasks").create<FocusTask>({
        date: todayDate(),
        title: title().trim(),
        done: false,
      });
      setTasks((prev) => [...prev, record]);
      setTitle("");
    } catch {
      setError("Failed to add the task.");
    } finally {
      setSubmitting(false);
    }
  };

  // Optimistic-ish update: writes the new state to the server, then
  // patches the local list with the record PocketBase returns.
  const toggleDone = async (task: FocusTask) => {
    try {
      const record = await pb
        .collection("focus_tasks")
        .update<FocusTask>(task.id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? record : t)));
    } catch {
      setError("Failed to update the task.");
    }
  };

  const handleDelete = async (task: FocusTask) => {
    try {
      await pb.collection("focus_tasks").delete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      setError("Failed to delete the task.");
    }
  };

  return (
    <div class="flex w-full flex-col gap-4 xl:mx-auto xl:max-w-3xl">
      <h1 class="mb-4 font-sans text-4xl">Focus</h1>

      <div class="flex flex-col [&>*]:border-b [&>*]:border-border [&>*:last-child]:border-b-0">
        <For each={tasks()}>
          {(task) => (
            <div class="flex items-center gap-3 py-3">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task)}
                class="h-5 w-5 cursor-pointer"
              />
              <span
                class="flex-1"
                classList={{ "line-through text-border": task.done }}
              >
                {task.title}
              </span>
              <button
                type="button"
                aria-label="Delete task"
                class="icon-btn"
                onClick={() => handleDelete(task)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </For>
      </div>

      <Show when={tasks().length === 0}>
        <p class="text-sm text-border">No tasks yet.</p>
      </Show>

      {/* Hidden once today's 3 tasks are already registered, since
          this list is deliberately capped -- see MAX_TASKS above. */}
      <Show when={tasks().length < MAX_TASKS}>
        <form onSubmit={handleAdd} class="flex items-center gap-2">
          <input
            type="text"
            placeholder="What do you want to get done today?"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            class="flex-1 rounded-md border border-border bg-field px-3 py-2 text-text"
          />
          <button type="submit" class="btn" disabled={submitting()}>
            {submitting() ? "Adding…" : "Add"}
          </button>
        </form>
      </Show>

      <Show when={error()}>
        <p class="text-sm text-[#dc3545]">{error()}</p>
      </Show>
    </div>
  );
}
