import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { pb } from "../shared/api/pb.js";

export default function App() {
  const [todos, setTodos] = createSignal([]);
  const [newText, setNewText] = createSignal("");
  const [editingId, setEditingId] = createSignal(null);
  const [editText, setEditText] = createSignal("");
  const [error, setError] = createSignal(null);

  // --- Real-time subscription ---

  onMount(async () => {
    try {
      // Load existing records, then open the subscription in parallel.
      const [records] = await Promise.all([
        pb.collection("todos").getFullList({ sort: "created" }),
        pb.collection("todos").subscribe("*", ({ action, record }) => {
          if (action === "create") {
            setTodos((prev) => [...prev, record]);
          } else if (action === "update") {
            setTodos((prev) =>
              prev.map((t) => (t.id === record.id ? record : t)),
            );
          } else if (action === "delete") {
            setTodos((prev) => prev.filter((t) => t.id !== record.id));
          }
        }),
      ]);
      setTodos(records);
    } catch (e) {
      setError("Could not connect to PocketBase. Is it running?");
      console.error(e);
    }
  });

  // Unsubscribe when the component is removed.
  onCleanup(() => pb.collection("todos").unsubscribe("*"));

  // --- CRUD helpers ---

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newText().trim()) return;
    await pb
      .collection("todos")
      .create({ text: newText().trim(), done: false });
    setNewText("");
  };

  const toggleDone = (todo) =>
    pb.collection("todos").update(todo.id, { done: !todo.done });

  const deleteTodo = (id) => pb.collection("todos").delete(id);

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    const text = editText().trim();
    if (text) await pb.collection("todos").update(id, { text });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // --- View ---

  return (
    <div>
      <h1>Todo (Solid.js + PocketBase)</h1>

      <Show when={error()}>
        <p style={{ color: "red" }}>{error()}</p>
      </Show>

      {/* Add form */}
      <form onSubmit={addTodo}>
        <input
          value={newText()}
          onInput={(e) => setNewText(e.target.value)}
          placeholder="New task…"
        />
        <button type="submit">Add</button>
      </form>

      {/* Todo list */}
      <ul>
        <For each={todos()}>
          {(todo) => (
            <li>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleDone(todo)}
              />

              <Show
                when={editingId() === todo.id}
                fallback={
                  <>
                    <span
                      style={{
                        "text-decoration": todo.done ? "line-through" : "none",
                      }}
                    >
                      {todo.text}
                    </span>
                    <button onClick={() => startEdit(todo)}>Edit</button>
                    <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                  </>
                }
              >
                <input
                  value={editText()}
                  onInput={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <button onClick={() => saveEdit(todo.id)}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}


