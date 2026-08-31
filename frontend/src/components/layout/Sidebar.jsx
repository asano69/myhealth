import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";

import BedSingle from "lucide-solid/icons/bed-single";
import Goal from "lucide-solid/icons/mouse-pointer-2";
import { contexts, contextsLoaded, loadContexts } from "../../lib/contexts";
import Loading from "../Loading";

export default function Sidebar(props) {
  const [query, setQuery] = createSignal("");

  onMount(() => {
    loadContexts();
  });

  const filteredContexts = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return contexts();
    return contexts().filter((context) =>
      context.context.toLowerCase().includes(q),
    );
  });

  return (
    <Show when={props.open}>
      <Show when={props.isMobile}>
        <div
          class="absolute inset-0 z-20 bg-black/40"
          onClick={props.onClose}
        />
      </Show>
      <aside
        classList={{
          "absolute inset-y-0 left-0 z-30 shadow-popover": props.isMobile,
        }}
        class="flex h-full min-h-0 w-64 flex-col border-r border-border bg-bg"
      >
        {/* Static top-level nav items, separate from the dynamic
            contexts list below. */}
        <nav class="p-2 text-md">
          <A
            href="/sleep"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-text transition-colors hover:bg-hover-bg"
          >
            <BedSingle size={20} />
            Sleep
          </A>
          <A
            href="/focus"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-text transition-colors hover:bg-hover-bg"
          >
            <Goal size={20} />
            Focus
          </A>
        </nav>
      </aside>
    </Show>
  );
}
