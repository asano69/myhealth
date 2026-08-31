import { createSignal } from "solid-js";

export default function QuoteForm(props) {
  const [text, setText] = createSignal("");
  const [note, setNote] = createSignal("");
  const [context, setContext] = createSignal("");
  const [tags, setTags] = createSignal("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await props.onAdd({
      text: text(),
      note: note(),
      context: context(),
      tags: tags()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setText("");
    setNote("");
    setContext("");
    setTags("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        placeholder="text"
        required
      />
      <textarea
        type="text"
        value={note()}
        onInput={(e) => setNote(e.currentTarget.value)}
        placeholder="note"
      />
      <input
        type="text"
        value={context()}
        onInput={(e) => setContext(e.currentTarget.value)}
        placeholder="context"
      />
      <input
        type="text"
        value={tags()}
        onInput={(e) => setTags(e.currentTarget.value)}
        placeholder="tags (comma separated)"
      />
      <button type="submit">Add</button>
    </form>
  );
}
