import { createEffect, createSignal, For, Show } from "solid-js";
import { RadioGroup } from "@kobalte/core/radio-group";
import { TextField } from "@kobalte/core/text-field";

import pb from "../../lib/pb";
import SaveButton from "../common/SaveButton";

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

// Current time as "HH:mm", used as the form's default value for a
// date that has no log yet.
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
      .getFirstListItem<SleepLogRecord>(pb.filter("date = {:date}", { date }));
  } catch {
    // No log for this date yet.
    return null;
  }
}

export interface SleepLogFormProps {
  // Which date's log this form edits, driven by DateNav in the parent
  // (see routes/sleep/index.tsx).
  date: string;
  // Called after a log is successfully saved, so the parent (e.g. the
  // chart in index.tsx) can refresh its data.
  onSaved?: (record: SleepLogRecord) => void;
}

// Form for logging a single night's sleep, for whichever date is
// currently selected via DateNav in the parent. Saves directly to
// PocketBase's "sleep_logs" collection. Since "date" is unique, saving
// a date that already has a log updates it instead of creating a
// duplicate.
export default function SleepLogForm(props: SleepLogFormProps) {
  const [time, setTime] = createSignal(currentTime());
  const [satisfaction, setSatisfaction] = createSignal("3");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  // Loads props.date's log into the form if one already exists,
  // otherwise resets to fresh defaults. Re-runs whenever the selected
  // date changes (DateNav in the parent), so the form always reflects
  // whichever day is currently being viewed.
  const loadForDate = async (date: string) => {
    const existing = await findLogByDate(date);
    if (existing) {
      setTime(existing.time);
      setSatisfaction(String(existing.satisfaction));
    } else {
      setTime(currentTime());
      setSatisfaction("3");
    }
  };

  createEffect(() => {
    loadForDate(props.date);
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = {
        date: props.date,
        time: time(),
        satisfaction: Number(satisfaction()),
      };
      // A log for this date may already exist (preloaded above) --
      // update it instead of creating a duplicate.
      const existing = await findLogByDate(props.date);
      const record = existing
        ? await pb
            .collection("sleep_logs")
            .update<SleepLogRecord>(existing.id, data)
        : await pb.collection("sleep_logs").create<SleepLogRecord>(data);
      props.onSaved?.(record);
      // Re-sync the form with the just-saved data instead of resetting
      // to blank defaults, so the form reflects what's actually stored.
      await loadForDate(props.date);
    } catch {
      setError("Failed to save the sleep log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-4">
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
              <RadioGroup.Item value={value} class="flex items-center gap-1.5">
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

      <SaveButton saving={submitting()} justSaved={false} />
    </form>
  );
}
