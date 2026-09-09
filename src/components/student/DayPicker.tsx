"use client";

import { useMemo } from "react";

const WEEKDAY_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface DayPickerProps {
  selected: Date;
  onSelect: (day: Date) => void;
  /** How many days ahead to offer, starting today. */
  daysAhead?: number;
}

/**
 * Horizontal scrollable strip of day chips — the pattern real class-booking apps use
 * on mobile (ClassPass, Mindbody), instead of a desktop week grid that only works by
 * scrolling sideways on a phone.
 */
export function DayPicker({ selected, onSelect, daysAhead = 14 }: DayPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: daysAhead }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [today, daysAhead],
  );

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {days.map((day) => {
        const isSelected = isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-center transition-colors ${
              isSelected ? "text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            style={isSelected ? { backgroundColor: "var(--tenant-primary)" } : undefined}
          >
            <span className="text-[11px] uppercase">{WEEKDAY_LABELS[day.getDay()]}</span>
            <span className="text-base font-semibold">{day.getDate()}</span>
            {isToday && !isSelected && (
              <span className="mt-0.5 h-1 w-1 rounded-full" style={{ backgroundColor: "var(--tenant-primary)" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
