import { createSignal, Show } from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { ToggleButton } from "@kobalte/core/toggle-button";
import Check from "lucide-solid/icons/check";
import Trash2 from "lucide-solid/icons/trash-2";
import GripVertical from "lucide-solid/icons/grip-vertical";

import pb from "../../lib/pb";
import type { FocusTaskRecord } from "./FocusTaskForm";

export interface FocusTaskItemProps {
  task: FocusTaskRecord;
  // Called with the updated record after a successful toggle or rename.
  onChanged: (record: FocusTaskRecord) => void;
  // Called with the (now-deleted) task after a successful delete.
  onDeleted: (task: FocusTaskRecord) => void;
  // Registers this row's DOM element with the parent, so it can measure
  // row positions during drag-to-reorder (see routes/focus/index.tsx).
  rowRef: (el: HTMLDivElement) => void;
  // Whether this task is the one currently being dragged.
  dragging: boolean;
  // Starts a drag-to-reorder gesture on pointerdown on the handle. The
  // parent owns the actual reordering logic, since it needs to compare
  // this row's position against every other row's.
  onDragStart: (event: PointerEvent) => void;
}

// A single row in the Focus task list: a done/not-done toggle, an
// inline-editable title (double-click to rename), and a delete button.
// Owns its own PocketBase calls and reports the result back to the
// page (see onChanged/onDeleted), so the page only has to keep its
// task list in sync rather than know about individual mutations.
export default function FocusTaskItem(props: FocusTaskItemProps) {
  const [editing, setEditing] = createSignal(false);
  const [editValue, setEditValue] = createSignal("");
  const [error, setError] = createSignal("");

  const toggleDone = async () => {
    try {
      const record = await pb
        .collection("focus_tasks")
        .update<FocusTaskRecord>(props.task.id, { done: !props.task.done });
      props.onChanged(record);
    } catch {
      setError("Failed to update the task.");
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection("focus_tasks").delete(props.task.id);
      props.onDeleted(props.task);
    } catch {
      setError("Failed to delete the task.");
    }
  };

  const startEdit = () => {
    setEditValue(props.task.title);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  // Commits the edited title, or just closes the editor if the value is
  // empty or unchanged (no round-trip needed in that case).
  const commitEdit = async () => {
    const newTitle = editValue().trim();
    setEditing(false);
    if (!newTitle || newTitle === props.task.title) return;
    try {
      const record = await pb
        .collection("focus_tasks")
        .update<FocusTaskRecord>(props.task.id, { title: newTitle });
      props.onChanged(record);
    } catch {
      setError("Failed to update the task.");
    }
  };

  return (
    <div
      ref={props.rowRef}
      class="flex flex-col gap-1 py-3 transition-opacity"
      classList={{ "opacity-40": props.dragging }}
    >
      <div class="flex items-center gap-3">
        {/* Drag handle: pointer events instead of native HTML5
            drag-and-drop, so reordering works the same way with touch
            (mobile) and mouse (desktop). Actual reordering happens in
            the parent, which tracks every row's position (see
            rowRef/onDragStart above). touch-none stops the browser
            from scrolling the page while dragging on mobile. */}
        <button
          type="button"
          aria-label="Drag to reorder"
          class="icon-btn shrink-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={props.onDragStart}
        >
          <GripVertical size={18} />
        </button>
        {/* Kobalte ToggleButton instead of a native checkbox, so the
            done/not-done control matches the rest of the app's
            Kobalte-based inputs. */}
        <ToggleButton
          pressed={props.task.done}
          onChange={toggleDone}
          aria-label={
            props.task.done ? "Mark task as not done" : "Mark task as done"
          }
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border text-text transition-colors data-[pressed]:border-text data-[pressed]:bg-active-bg"
        >
          <Show when={props.task.done}>
            <Check size={14} />
          </Show>
        </ToggleButton>

        {/* Click a task's title to rename it inline, instead of a
            separate edit button/dialog. */}
        <Show
          when={editing()}
          fallback={
            // Matches TextField.Input's border/padding below (border
            // border-transparent py-2) so the row's height doesn't
            // shift when swapping between display and edit mode.
            <span
              class="flex-1 cursor-text border border-transparent py-2"
              classList={{ "line-through text-border": props.task.done }}
              onClick={startEdit}
            >
              {props.task.title}
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
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              class="w-full rounded-md border border-transparent bg-transparent px-0 py-2 text-text"
            />
          </TextField>
        </Show>

        <button
          type="button"
          aria-label="Delete task"
          class="icon-btn"
          onClick={handleDelete}
        >
          <Trash2 size={18} />
        </button>
      </div>
      {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
    </div>
  );
}
