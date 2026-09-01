import { For, Show } from "solid-js";
import Save from "lucide-solid/icons/save";
import Check from "lucide-solid/icons/check";
import Undo2 from "lucide-solid/icons/undo-2";
import Redo2 from "lucide-solid/icons/redo-2";
import Bold from "lucide-solid/icons/bold";
import Italic from "lucide-solid/icons/italic";
import UnderlineIcon from "lucide-solid/icons/underline";
import Strikethrough from "lucide-solid/icons/strikethrough";
import { useEditorDerivedValue } from "prosekit/solid";

// Toolbar buttons, grouped by function (history / marks), each backed by
// a ProseKit command. Kept as plain data so adding, removing, or
// reordering a formatting option is a one-line change instead of
// touching the render logic below.
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
  };
}

// Must render inside <ProseKit editor={...}>, since useEditorDerivedValue
// reads the current editor from that context. saving/justSaved are
// passed down from whichever <form> owns the save button, so the save
// button can live in the toolbar (to the left of undo/redo) instead of
// a separate footer.
export default function EditorToolbar(props) {
  const items = useEditorDerivedValue(getToolbarItems);

  return (
    <div class="notes-toolbar">
      <div class="notes-toolbar-group">
        {/* Submits the enclosing <form> (see TextEditor.jsx). Swaps to
            a checkmark for a moment after a successful save (see
            justSaved, driven by the parent form), then reverts to the
            save icon. */}
        <button
          type="submit"
          aria-label={props.saving ? "Saving…" : "Save"}
          disabled={props.saving}
        >
          <Show when={props.justSaved} fallback={<Save size={17} />}>
            <Check size={17} />
          </Show>
        </button>
      </div>
      <div class="notes-toolbar-divider" />
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
