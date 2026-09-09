"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getMonthGridDays, isSameDay, startOfDay } from "@/lib/calendarDate";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

interface MonthCalendarProps {
  /** Any date within the month to display. */
  monthDate: Date;
  selected: Date;
  onSelect: (day: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  /** Days (in this grid) that have at least one class, for the dot indicator. */
  daysWithClasses: Set<string>;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function MonthCalendar({
  monthDate,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
  onToday,
  daysWithClasses,
}: MonthCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => getMonthGridDays(monthDate), [monthDate]);
  const rawMonthLabel = monthDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-sm font-semibold text-ink">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="rounded-md px-2 py-1 text-xs font-medium text-ink-soft hover:bg-gray-100"
          >
            Hoy
          </button>
          <button
            onClick={onPrevMonth}
            aria-label="Mes anterior"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            onClick={onNextMonth}
            aria-label="Mes siguiente"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-[11px] font-medium text-gray-400">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = day.getMonth() === monthDate.getMonth();
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const hasClasses = daysWithClasses.has(dateKey(day));

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={`mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-sm transition-colors ${
                !inMonth ? "text-gray-300" : isSelected ? "text-white" : "text-ink hover:bg-gray-100"
              } ${!isSelected && isToday ? "font-semibold" : ""}`}
              style={isSelected ? { backgroundColor: "var(--tenant-primary)" } : undefined}
            >
              {day.getDate()}
              <span
                className="mt-[-2px] h-1 w-1 rounded-full"
                style={{
                  backgroundColor: hasClasses ? (isSelected ? "#fff" : "var(--tenant-primary)") : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
