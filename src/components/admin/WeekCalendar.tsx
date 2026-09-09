"use client";

import { useMemo } from "react";

import type { ClassTypeDoc, InstructorDoc, ScheduleDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";

interface Schedule extends ScheduleDoc {
  id: string;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOUR_HEIGHT = 56;
const MIN_START_HOUR = 6;
const MIN_END_HOUR = 21;

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface WeekCalendarProps {
  weekStart: Date;
  schedules: Schedule[];
  classTypes: Record<string, ClassTypeDoc>;
  instructors: Record<string, InstructorDoc>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekCalendar({
  weekStart,
  schedules,
  classTypes,
  instructors,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekCalendarProps) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { startHour, endHour } = useMemo(() => {
    if (schedules.length === 0) return { startHour: MIN_START_HOUR, endHour: MIN_END_HOUR };
    let minHour = MIN_START_HOUR;
    let maxHour = MIN_END_HOUR;
    for (const schedule of schedules) {
      const start = schedule.startAt.toDate();
      const end = schedule.endAt.toDate();
      minHour = Math.min(minHour, start.getHours());
      maxHour = Math.max(maxHour, end.getMinutes() > 0 ? end.getHours() + 1 : end.getHours());
    }
    return { startHour: minHour, endHour: maxHour };
  }, [schedules]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );
  const gridHeight = hours.length * HOUR_HEIGHT;
  const today = new Date();

  const rangeLabel = `${weekStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${addDays(
    weekStart,
    6,
  ).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="px-2 py-1" onClick={onPrevWeek} aria-label="Semana anterior">
            ‹
          </Button>
          <Button variant="secondary" className="px-2 py-1" onClick={onNextWeek} aria-label="Semana siguiente">
            ›
          </Button>
          <Button variant="ghost" className="px-2 py-1" onClick={onToday}>
            Hoy
          </Button>
        </div>
        <p className="text-sm font-medium capitalize text-gray-700">{rangeLabel}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[48px_repeat(7,1fr)]">
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`border-b border-l border-gray-200 py-2 text-center text-xs font-medium ${
                isSameDay(day, today) ? "bg-indigo-50 text-indigo-700" : "text-gray-500"
              }`}
            >
              <div className="uppercase">{DAY_LABELS[(day.getDay() + 6) % 7]}</div>
              <div className="text-sm text-gray-900">{day.getDate()}</div>
            </div>
          ))}

          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-[11px] text-gray-400"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const daySchedules = schedules.filter((s) => isSameDay(s.startAt.toDate(), day));
            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-gray-200"
                style={{
                  height: gridHeight,
                  backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${HOUR_HEIGHT}px)`,
                }}
              >
                {daySchedules.map((schedule) => {
                  const start = schedule.startAt.toDate();
                  const end = schedule.endAt.toDate();
                  const top = ((start.getHours() - startHour) * 60 + start.getMinutes()) * (HOUR_HEIGHT / 60);
                  const height = Math.max(
                    ((end.getTime() - start.getTime()) / 60_000) * (HOUR_HEIGHT / 60),
                    18,
                  );
                  const isFull = schedule.bookedCount >= schedule.capacity;
                  const classType = classTypes[schedule.classTypeId];
                  const instructor = instructors[schedule.instructorId];
                  const timeLabel = start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={schedule.id}
                      title={`${classType?.name ?? "Clase"} · ${timeLabel} · ${instructor?.name ?? ""} · ${schedule.bookedCount}/${schedule.capacity}`}
                      className={`absolute inset-x-0.5 overflow-hidden rounded border px-1.5 py-0.5 text-[11px] leading-tight ${
                        isFull
                          ? "border-red-200 bg-red-100 text-red-800"
                          : "border-green-200 bg-green-100 text-green-800"
                      }`}
                      style={{ top, height }}
                    >
                      <p className="truncate font-semibold">{classType?.name ?? "Clase"}</p>
                      <p className="truncate">{timeLabel}</p>
                      <p className="truncate">
                        {schedule.bookedCount}/{schedule.capacity}
                        {schedule.waitlistCount > 0 ? ` · ${schedule.waitlistCount} espera` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 border-t border-gray-200 p-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Con lugares
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Llena
        </span>
      </div>
    </div>
  );
}
