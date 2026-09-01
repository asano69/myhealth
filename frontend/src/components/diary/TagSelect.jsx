import { createResource, For } from "solid-js";
import { Combobox } from "@kobalte/core/combobox";
import X from "lucide-solid/icons/x";
import ChevronDown from "lucide-solid/icons/chevron-down";

import pb from "../../lib/pb";

// Loads every diary_tags record. Tags rarely change, so a plain
// createResource per mount is enough -- no separate caching layer.
async function fetchTags() {
  return await pb.collection("diary_tags").getFullList({ sort: "label" });
}

// Multi-select combobox for diary_entries.tags, backed by the
// diary_tags collection. Selected tags render as removable chips
// inside the control, Kobalte's standard pattern for multiple
// selection (see @kobalte/core/combobox docs).
//
// Props: value (array of selected tag records), onChange (array of
// tag records) => void.
export default function TagSelect(props) {
  const [tags] = createResource(fetchTags);

  return (
    <Combobox
      multiple
      options={tags() ?? []}
      optionValue="id"
      optionLabel="label"
      optionTextValue="label"
      value={props.value}
      onChange={props.onChange}
      placeholder="Add tags…"
      itemComponent={(itemProps) => (
        <Combobox.Item
          item={itemProps.item}
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm text-text outline-none data-[highlighted]:bg-hover-bg"
        >
          <Combobox.ItemLabel>
            {itemProps.item.rawValue.label}
          </Combobox.ItemLabel>
        </Combobox.Item>
      )}
    >
      <Combobox.Control class="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-field px-2 py-1.5">
        {(state) => (
          <>
            <For each={state.selectedOptions()}>
              {(tag) => (
                <span class="flex items-center gap-1 rounded-sm bg-hover-bg px-2 py-0.5 text-sm text-text">
                  {tag.label}
                  {/* stopPropagation keeps the click from also opening/
                      toggling the combobox trigger underneath it. */}
                  <button
                    type="button"
                    aria-label={`Remove ${tag.label}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => state.remove(tag)}
                    class="text-border hover:text-text"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </For>
            <Combobox.Input class="min-w-[8ch] flex-1 bg-transparent text-sm text-text outline-none" />
            <Combobox.Trigger class="text-border">
              <Combobox.Icon>
                <ChevronDown size={16} />
              </Combobox.Icon>
            </Combobox.Trigger>
          </>
        )}
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Content class="z-50 rounded-md border border-border bg-card p-1 shadow-popover">
          <Combobox.Listbox class="max-h-60 overflow-y-auto" />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}
