"use client";

import { useMemo } from "react";

import { addDays, isSameDay, startOfDay } from "@/lib/calendarDate";

const WEEKDAY_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

interface DayPickerProps {
  /** Monday of the week to display. */
  weekStart: Date;
  selected: Date;
  onSelect: (day: Date) => void;
}

/**
 * Horizontal strip of the 7 days in `weekStart`'s week — the pattern real
 * class-booking apps use on mobile (ClassPass, Mindbody), instead of a desktop
 * week grid that only works by scrolling sideways on a phone.
 */
export function DayPicker({ weekStart, selected, onSelect }: DayPickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

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
            <span className="text-[11px] uppercase">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</span>
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
