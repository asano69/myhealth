import { onCleanup } from "solid-js";
import "prosekit/basic/style.css";
import "prosekit/basic/typography.css";
import { defineBasicExtension } from "prosekit/basic";
import { createEditor } from "prosekit/core";
import { ProseKit } from "prosekit/solid";

import EditorToolbar from "./EditorToolbar";

// Reusable rich-text editor: a ProseKit editor with a toolbar (save,
// undo/redo, bold/italic/underline/strike) and an editable content area.
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
      {/* flex-1 min-h-0 makes this fill the remaining space in the
          caller's layout instead of growing with content. Toolbar keeps
          its natural height; the content div takes the rest and scrolls
          on its own. */}
      <div class="notes-editor flex min-h-0 flex-1 flex-col">
        <EditorToolbar saving={props.saving} justSaved={props.justSaved} />
        <div
          ref={mountEditor}
          class="ProseMirror notes-editor-content min-h-0 flex-1 overflow-y-auto"
        />
      </div>
    </ProseKit>
  );
}
