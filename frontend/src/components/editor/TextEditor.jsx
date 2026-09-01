import { onCleanup } from "solid-js";
import "prosekit/basic/style.css";
import "prosekit/basic/typography.css";
import { defineBasicExtension } from "prosekit/basic";
import { createEditor } from "prosekit/core";
import { ProseKit } from "prosekit/solid";

import EditorToolbar from "./EditorToolbar";
import SaveButton from "./SaveButton";

// Reusable rich-text editor: a ProseKit editor with a formatting toolbar
// (undo/redo, bold/italic/underline/strike), an editable content area,
// and a save button below the content.
// Owns editor creation and mounting; the caller gets the raw ProseKit
// `editor` instance via onReady so it can read the content (e.g.
// editor.getDocJSON()) and wire up its own save logic -- this component
// has no idea what "save" means for the caller. See
// routes/diary/index.jsx for an example of a <form> wrapping this and
// driving `saving`/`justSaved`.
//
// Props: initialContent, saving, justSaved, onReady (editor) => void.
export default function TextEditor(props) {
  const editor = createEditor({
    extension: defineBasicExtension(),
    defaultContent: props.initialContent,
  });

  props.onReady?.(editor);

  // Solid doesn't auto-unmount ref callbacks the way React's new
  // ref-cleanup convention does, so the returned unmount function is
  // wired to onCleanup explicitly here.
  const mountEditor = (el) => {
    const unmount = editor.mount(el);
    onCleanup(() => unmount?.());
  };

  return (
    <ProseKit editor={editor}>
      {/* Outer flex-1 min-h-0 wrapper bounds the bordered editor box
          and the save button below it to the caller's available
          height, so nothing overflows past the bottom of the screen.
          The editor box itself keeps its border/background (notes-editor);
          the save button sits outside it as a separate element. */}
      <div class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="notes-editor flex min-h-0 flex-1 flex-col">
          <EditorToolbar />
          <div
            ref={mountEditor}
            class="ProseMirror notes-editor-content min-h-0 flex-1 overflow-y-auto"
          />
        </div>
        <SaveButton saving={props.saving} justSaved={props.justSaved} />
      </div>
    </ProseKit>
  );
}
