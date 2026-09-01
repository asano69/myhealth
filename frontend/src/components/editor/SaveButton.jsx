import { createEffect, createSignal } from "solid-js";
import { useEditorDerivedValue } from "prosekit/solid";

// Save button shown below the editor content (see TextEditor.jsx).
// Must render inside <ProseKit editor={...}>, since useEditorDerivedValue
// reads the current editor from that context.
//
// Tracks its own "dirty" state by comparing the document's current JSON
// against a snapshot taken on mount, so the button only lights up green
// once there's something to save, and grays out again right after a
// successful save (see the justSaved effect below).
//
// Props: saving, justSaved (both driven by the parent form, e.g.
// routes/diary/index.jsx).
export default function SaveButton(props) {
  const docJSON = useEditorDerivedValue((editor) => editor.getDocJSON());
  const [dirty, setDirty] = createSignal(false);
  let baseline;

  createEffect(() => {
    const current = JSON.stringify(docJSON());
    // First run just records the starting point; nothing to compare
    // against yet.
    if (baseline === undefined) {
      baseline = current;
      return;
    }
    setDirty(current !== baseline);
  });

  // Once a save completes, the just-saved content becomes the new
  // baseline, so the button grays out again until the next edit.
  createEffect(() => {
    if (props.justSaved) {
      baseline = JSON.stringify(docJSON());
      setDirty(false);
    }
  });

  return (
    <div class="flex justify-end">
      {/* No .btn here: that class's border/bg-field styling doesn't
          fit a solid green call-to-action button, so this is styled
          directly instead. disabled:opacity-40 is what grays the
          button out while there's nothing to save. */}
      <button
        type="submit"
        class="my-1.5 cursor-pointer appearance-none rounded-md bg-[#28a745] px-4 py-2 font-sans text-base font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[#23923d]"
        disabled={props.saving || !dirty()}
      >
        {props.saving ? "Saving…" : props.justSaved ? "Saved" : "Save note"}
      </button>
    </div>
  );
}
