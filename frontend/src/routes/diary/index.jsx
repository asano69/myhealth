import { createSignal, onCleanup, Show, createResource, For } from "solid-js";
import Save from "lucide-solid/icons/save";
import Check from "lucide-solid/icons/check";
import Undo2 from "lucide-solid/icons/undo-2";
import Redo2 from "lucide-solid/icons/redo-2";
import Bold from "lucide-solid/icons/bold";
import Italic from "lucide-solid/icons/italic";
import UnderlineIcon from "lucide-solid/icons/underline";
import Strikethrough from "lucide-solid/icons/strikethrough";
import List from "lucide-solid/icons/list";
import ListOrdered from "lucide-solid/icons/list-ordered";
import "prosekit/basic/style.css";
import "prosekit/basic/typography.css";
import { defineBasicExtension } from "prosekit/basic";
import { createEditor } from "prosekit/core";
import { ProseKit, useEditorDerivedValue } from "prosekit/solid";

import pb from "../../lib/pb";
import { todayDate } from "../../lib/date";
import Loading from "../../components/Loading";
import DateNav from "../../components/common/DateNav";

// Diary is a single rich-text entry per day, keyed by date only. The
// editor UI below (toolbar + ProseKit setup) is moved from the former
// routes/contexts/Editor.jsx: that per-context notes feature is gone,
// but the editor itself is exactly what a daily diary entry needs.
export default function Diary() {
  // The day currently being viewed/edited, navigated via DateNav below.
  const [selectedDate, setSelectedDate] = createSignal(todayDate());
  // selectedDate as the resource's source: createResource automatically
  // refetches whenever it changes, so navigating days is enough to load
  // that day's entry without any extra wiring.
  const [entry] = createResource(selectedDate, fetchEntryForDate);

  return (
    <div class="flex h-full min-h-0 w-full flex-col gap-4">
      <DateNav date={selectedDate()} onChange={setSelectedDate} />
      <h1 class="font-sans text-4xl">Diary</h1>
      <Show when={!entry.loading} fallback={<Loading />}>
        <DiaryForm
          date={selectedDate()}
          entryId={entry()?.id}
          initialContent={entry()?.note}
        />
      </Show>
    </div>
  );
}

async function fetchEntryForDate(date) {
  try {
    return await pb
      .collection("diary_entries")
      .getFirstListItem(pb.filter("date = {:date}", { date }));
  } catch {
    // No entry for this date yet; the form starts blank.
    return null;
  }
}

// Toolbar buttons, grouped by function (history / marks / block type /
// lists) and each backed by a ProseKit command. Kept as plain data so
// adding, removing, or reordering a formatting option is a one-line
// change instead of touching the render logic below.
const TOOLBAR_GROUPS = [
  [
    { key: "undo", label: "Undo", icon: Undo2 },
    { key: "redo", label: "Redo", icon: Redo2 },
  ],
  [
    { key: "bold", label: "Bold", icon: Bold },
    { key: "italic", label: "Italic", icon: Italic },
    { key: "underline", label: "Underline", icon: UnderlineIcon },
    { key: "strike", label: "Strikethrough", icon: Strikethrough },
  ],
  [
    { key: "bulletList", label: "Bullet list", icon: List },
    { key: "orderedList", label: "Numbered list", icon: ListOrdered },
  ],
];

// Derives { isActive, canExec, command } for every toolbar button from
// the current editor state. Passed to useEditorDerivedValue, which
// re-runs it on every ProseMirror transaction.
function getToolbarItems(editor) {
  return {
    undo: {
      isActive: false,
      canExec: editor.commands.undo.canExec(),
      command: () => editor.commands.undo(),
    },
    redo: {
      isActive: false,
      canExec: editor.commands.redo.canExec(),
      command: () => editor.commands.redo(),
    },
    bold: {
      isActive: editor.marks.bold.isActive(),
      canExec: editor.commands.toggleBold.canExec(),
      command: () => editor.commands.toggleBold(),
    },
    italic: {
      isActive: editor.marks.italic.isActive(),
      canExec: editor.commands.toggleItalic.canExec(),
      command: () => editor.commands.toggleItalic(),
    },
    underline: {
      isActive: editor.marks.underline.isActive(),
      canExec: editor.commands.toggleUnderline.canExec(),
      command: () => editor.commands.toggleUnderline(),
    },
    strike: {
      isActive: editor.marks.strike.isActive(),
      canExec: editor.commands.toggleStrike.canExec(),
      command: () => editor.commands.toggleStrike(),
    },
    bulletList: {
      isActive: editor.nodes.list.isActive({ kind: "bullet" }),
      canExec: editor.commands.toggleList.canExec({ kind: "bullet" }),
      command: () => editor.commands.toggleList({ kind: "bullet" }),
    },
    orderedList: {
      isActive: editor.nodes.list.isActive({ kind: "ordered" }),
      canExec: editor.commands.toggleList.canExec({ kind: "ordered" }),
      command: () => editor.commands.toggleList({ kind: "ordered" }),
    },
  };
}

// Must render inside <ProseKit editor={...}>, since useEditorDerivedValue
// reads the current editor from that context.
function Toolbar() {
  const items = useEditorDerivedValue(getToolbarItems);

  return (
    <div class="notes-toolbar">
      <For each={TOOLBAR_GROUPS}>
        {(group, groupIndex) => (
          <>
            {/* No divider before the first group. */}
            <Show when={groupIndex() > 0}>
              <div class="notes-toolbar-divider" />
            </Show>
            <div class="notes-toolbar-group">
              <For each={group}>
                {({ key, label, icon: Icon }) => (
                  <Show when={items()[key]}>
                    {(item) => (
                      <button
                        type="button"
                        title={label}
                        aria-label={label}
                        disabled={!item().canExec}
                        onClick={item().command}
                        classList={{ "is-active": item().isActive }}
                      >
                        <Icon size={17} />
                      </button>
                    )}
                  </Show>
                )}
              </For>
            </div>
          </>
        )}
      </For>
    </div>
  );
}

// Split out from Diary so a fresh ProseKit editor is created every time
// the form is (re)inserted, e.g. once the selected day's entry has
// finished loading, right after a delete triggers a refetch, or after
// DateNav switches to a different day (see onDeleted, and Diary's
// createResource above).
function DiaryForm(props) {
  // Tracks the entry's id locally: unset until the first save, at
  // which point it switches from create to update for any further
  // save today without needing a page reload.
  const [entryId, setEntryId] = createSignal(props.entryId);
  const [saving, setSaving] = createSignal(false);
  // Briefly true right after a successful save, to swap the save icon
  // for a checkmark; reverted by the timeout scheduled in handleSave.
  const [justSaved, setJustSaved] = createSignal(false);
  const [error, setError] = createSignal("");
  let savedTimeout;
  onCleanup(() => clearTimeout(savedTimeout));

  const editor = createEditor({
    extension: defineBasicExtension(),
    defaultContent: props.initialContent,
  });

  // Solid doesn't auto-unmount ref callbacks the way React's new
  // ref-cleanup convention does, so the returned unmount function is
  // wired to onCleanup explicitly here.
  const mountEditor = (el) => {
    const unmount = editor.mount(el);
    onCleanup(() => unmount?.());
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = { note: editor.getDocJSON(), date: props.date };
      if (entryId()) {
        await pb.collection("diary_entries").update(entryId(), data);
      } else {
        const record = await pb.collection("diary_entries").create(data);
        setEntryId(record.id);
      }
      // Show a checkmark in place of the save icon for a moment to
      // confirm the save succeeded, then revert back to the save icon.
      setJustSaved(true);
      clearTimeout(savedTimeout);
      savedTimeout = setTimeout(() => setJustSaved(false), 1500);
    } catch {
      setError("Failed to save today's diary entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // min-h-0 lets this shrink to the available height instead of
    // growing to fit content, so the editor pane below can flex-1 and
    // scroll internally rather than the whole page scrolling.
    <form
      onSubmit={handleSave}
      class="flex min-h-0 flex-1 w-full flex-col gap-4"
    >
      <ProseKit editor={editor}>
        {/* flex-1 min-h-0 makes this fill the remaining space in the
            form (header row + this), instead of growing with content.
            Toolbar and the footer below both keep their natural
            height; the content div takes the rest and scrolls on its
            own. */}
        <div class="notes-editor flex min-h-0 flex-1 flex-col">
          <Toolbar />
          <div
            ref={mountEditor}
            class="ProseMirror notes-editor-content min-h-0 flex-1 overflow-y-auto"
          />
          {/* Mirrors Toolbar above the content: a save button styled
              as part of the ProseKit chrome, symmetric with the
              toolbar row at the top. */}
          <div class="notes-footer">
            {/* Submits the form above (see onSubmit on <form>). Swaps to a
                checkmark for a moment after a successful save (see
                justSaved/handleSave above), then reverts to the save
                icon. */}
            <button
              type="submit"
              aria-label={saving() ? "Saving…" : "Save"}
              disabled={saving()}
            >
              <Show when={justSaved()} fallback={<Save size={24} />}>
                <Check size={24} />
              </Show>
            </button>
          </div>
        </div>
      </ProseKit>
      {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
    </form>
  );
}
