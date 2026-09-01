import ChevronLeft from "lucide-solid/icons/chevrons-left";
import ChevronRight from "lucide-solid/icons/chevrons-right";

import { formatDisplayDate, shiftDate } from "../../lib/date";

export interface DateNavProps {
  date: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
}

// Shared day-by-day navigator: chevron buttons on either side of the
// currently selected date, formatted for display. Used by Focus, Sleep,
// and Diary so all three pages navigate dates the same way.
export default function DateNav(props: DateNavProps) {
  const changeDate = (days: number) => {
    props.onChange(shiftDate(props.date, days));
  };

  return (
    // Sticky "second bar" right under TopBar: sticks to the top of
    // <main>'s own scroll area (see MainLayout) once the page scrolls
    // past it, so date navigation stays visible without every page
    // needing its own header row.
    <div class="sticky flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Previous day"
        class="icon-btn"
        onClick={() => changeDate(-1)}
      >
        <ChevronLeft size={20} />
      </button>
      <span class="font-serif text-lg">{formatDisplayDate(props.date)}</span>
      <button
        type="button"
        aria-label="Next day"
        class="icon-btn"
        onClick={() => changeDate(1)}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
