import { createSignal, onMount, For, Show } from "solid-js";
import { RadioGroup } from "@kobalte/core/radio-group";
import { TextField } from "@kobalte/core/text-field";

import pb from "../../lib/pb";

// Matches the PocketBase "sleep_logs" collection schema.
export interface SleepLogRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  satisfaction: number; // 1-4
  created: string;
  updated: string;
}

const SATISFACTION_VALUES = ["1", "2", "3", "4"];

// Today's date as "YYYY-MM-DD", used as the form's default value.
function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Current time as "HH:mm", used as the form's default value.
function currentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Looks up the sleep log for a given date. "date" is a unique field on
// the "sleep_logs" collection, so there is at most one log per day.
async function findLogByDate(date: string): Promise<SleepLogRecord | null> {
  try {
    return await pb
      .collection("sleep_logs")
      .getFirstListItem<SleepLogRecord>(
        pb.filter("date = {:date}", { date }),
      );
  } catch {
    // No log for this date yet.
    return null;
  }
}

export interface SleepLogFormProps {
  // Called after a log is successfully saved, so the parent (e.g. the
  // chart in index.tsx) can refresh its data.
  onSaved?: (record: SleepLogRecord) => void;
}

// Form for logging a single night's sleep. Saves directly to
// PocketBase's "sleep_logs" collection. Since "date" is unique, saving
// a date that already has a log updates it instead of creating a
// duplicate.
export default function SleepLogForm(props: SleepLogFormProps) {
  const [date, setDate] = createSignal(todayDate());
  const [time, setTime] = createSignal(currentTime());
  const [satisfaction, setSatisfaction] = createSignal("3");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  // Loads today's log into the form if one already exists, otherwise
  // leaves today's date with the current time as fresh defaults. Used
  // both on mount and after a save, so the form always reflects
  // today's saved state rather than resetting to blank defaults.
  const loadToday = async () => {
    const existing = await findLogByDate(todayDate());
    if (existing) {
      setDate(existing.date);
      setTime(existing.time);
      setSatisfaction(String(existing.satisfaction));
    } else {
      setDate(todayDate());
      setTime(currentTime());
      setSatisfaction("3");
    }
  };

  onMount(loadToday);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = {
        date: date(),
        time: time(),
        satisfaction: Number(satisfaction()),
      };
      // A log for this date may already exist (preloaded above, or the
      // date field was changed to a day that already has an entry) --
      // update it instead of creating a duplicate.
      const existing = await findLogByDate(date());
      const record = existing
        ? await pb
            .collection("sleep_logs")
            .update<SleepLogRecord>(existing.id, data)
        : await pb.collection("sleep_logs").create<SleepLogRecord>(data);
      props.onSaved?.(record);
      // Re-sync the form with today's just-saved data instead of
      // resetting to blank defaults, so the form reflects what's
      // actually stored.
      await loadToday();
    } catch {
      setError("Failed to save the sleep log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-4">
      <TextField value={date()} onChange={setDate} class="flex flex-col gap-1">
        <TextField.Label class="text-sm text-text">Date</TextField.Label>
        <TextField.Input
          type="date"
          required
          class="rounded-md border border-border bg-field px-3 py-2 text-text"
        />
      </TextField>

      <TextField value={time()} onChange={setTime} class="flex flex-col gap-1">
        <TextField.Label class="text-sm text-text">Time</TextField.Label>
        <TextField.Input
          type="time"
          required
          class="rounded-md border border-border bg-field px-3 py-2 text-text"
        />
      </TextField>

      <RadioGroup
        value={satisfaction()}
        onChange={setSatisfaction}
        class="flex flex-col gap-1"
      >
        <RadioGroup.Label class="text-sm text-text">
          Satisfaction
        </RadioGroup.Label>
        <div class="flex gap-4">
          <For each={SATISFACTION_VALUES}>
            {(value) => (
              <RadioGroup.Item
                value={value}
                class="flex items-center gap-1.5"
              >
                <RadioGroup.ItemInput />
                <RadioGroup.ItemControl class="flex h-4 w-4 items-center justify-center rounded-full border border-border data-[checked]:border-text">
                  <RadioGroup.ItemIndicator class="h-2 w-2 rounded-full bg-text" />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel class="text-sm text-text">
                  {value}
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
            )}
          </For>
        </div>
      </RadioGroup>

      <Show when={error()}>
        <p class="text-sm text-[#dc3545]">{error()}</p>
      </Show>

      <button type="submit" class="btn" disabled={submitting()}>
        {submitting() ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
