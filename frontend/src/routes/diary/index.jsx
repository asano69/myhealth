import { createSignal, onCleanup, Show, createResource } from "solid-js";

import pb from "../../lib/pb";
import { todayDate } from "../../lib/date";
import Loading from "../../components/Loading";
import DateNav from "../../components/common/DateNav";
import TextEditor from "../../components/editor/TextEditor";

// Diary is a single rich-text entry per day, keyed by date only. The
// actual editor UI (toolbar + ProseKit setup) lives in
// components/editor/TextEditor.jsx; this page only owns the
// date-selection and save-to-PocketBase logic.
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

// Split out from Diary so a fresh editor is created every time the form
// is (re)inserted, e.g. once the selected day's entry has finished
// loading, right after a delete triggers a refetch, or after DateNav
// switches to a different day (see onDeleted, and Diary's
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

  // Set by TextEditor's onReady once its ProseKit editor is created, so
  // handleSave can read the current content via editor.getDocJSON().
  let editor;

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
      class="flex min-h-0 flex-1 w-full flex-col gap-4 mb-4"
    >
      <TextEditor
        initialContent={props.initialContent}
        saving={saving()}
        justSaved={justSaved()}
        onReady={(readyEditor) => (editor = readyEditor)}
      />
      {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
    </form>
  );
}
