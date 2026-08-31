import { createSignal, onMount, For, Show } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { ToggleButton } from "@kobalte/core/toggle-button";
import Check from "lucide-solid/icons/check";
import Plus from "lucide-solid/icons/plus";
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

  // Id of the task currently being edited inline (double-click to
  // start), or null when no task is being edited. Only one task can be
  // edited at a time.
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [editValue, setEditValue] = createSignal("");

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

  const startEdit = (task: FocusTask) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const cancelEdit = () => setEditingId(null);

  // Saves the edited title, or just closes the editor if the value is
  // empty or unchanged (no round-trip needed in that case).
  const commitEdit = async (task: FocusTask) => {
    const newTitle = editValue().trim();
    setEditingId(null);
    if (!newTitle || newTitle === task.title) return;
    try {
      const record = await pb
        .collection("focus_tasks")
        .update<FocusTask>(task.id, { title: newTitle });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? record : t)));
    } catch {
      setError("Failed to update the task.");
    }
  };

  return (
    <div class="flex w-full flex-col gap-4 xl:mx-auto xl:max-w-3xl">
      <h1 class="mb-4 font-sans text-4xl">Focus</h1>

      <div class="flex flex-col [&>*]:border-b [&>*]:border-border [&>*:last-child]:border-b-0">
        <For each={tasks()}>
          {(task) => (
            <div class="flex items-center gap-3 py-3">
              {/* Kobalte ToggleButton instead of a native checkbox, so
                  the done/not-done control matches the rest of the
                  app's Kobalte-based inputs. */}
              <ToggleButton
                pressed={task.done}
                onChange={() => toggleDone(task)}
                aria-label={
                  task.done ? "Mark task as not done" : "Mark task as done"
                }
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border text-text transition-colors data-[pressed]:border-text data-[pressed]:bg-active-bg"
              >
                <Show when={task.done}>
                  <Check size={14} />
                </Show>
              </ToggleButton>

              {/* Double-click a task's title to rename it inline,
                  instead of a separate edit button/dialog. */}
              <Show
                when={editingId() === task.id}
                fallback={
                  <span
                    class="flex-1 cursor-text"
                    classList={{ "line-through text-border": task.done }}
                    onDblClick={() => startEdit(task)}
                  >
                    {task.title}
                  </span>
                }
              >
                <TextField
                  value={editValue()}
                  onChange={setEditValue}
                  class="flex-1"
                >
                  <TextField.Input
                    autofocus
                    onBlur={() => commitEdit(task)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitEdit(task);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                    class="w-full rounded-md border border-border bg-field px-2 py-1 text-text"
                  />
                </TextField>
              </Show>

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
        {/* Once at least one task already exists, the add-task input is
            toned down (lower opacity, no border/background) so it reads
            as an optional affordance rather than a prompt nagging the
            user to fill the list. focus-within restores the normal
            look while actually typing. */}
        <form
          onSubmit={handleAdd}
          class="flex items-center gap-2 transition-opacity focus-within:opacity-100"
          classList={{ "opacity-50": tasks().length > 0 }}
        >
          <TextField value={title()} onChange={setTitle} class="flex-1">
            <TextField.Input
              placeholder="What do you want to get done today?"
              class="w-full rounded-md border border-border bg-field px-3 py-2 text-text"
              classList={{
                "border-transparent bg-transparent px-0": tasks().length > 0,
              }}
            />
          </TextField>
          {/* Plus icon instead of an "Add" label, symmetric with the
              Trash2 delete button on each task row. */}
          <button
            type="submit"
            aria-label={submitting() ? "Adding…" : "Add task"}
            class="icon-btn shrink-0"
            disabled={submitting()}
          >
            <Plus size={20} />
          </button>
        </form>
      </Show>
      <Show when={error()}>
        <p class="text-sm text-[#dc3545]">{error()}</p>
      </Show>
    </div>
  );
}
