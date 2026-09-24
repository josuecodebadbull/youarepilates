"use client";

import { useEffect, useMemo, useState } from "react";

import { addDays, isSameDay } from "@/lib/calendarDate";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/lib/classLevel";
import { formatTime } from "@/lib/admin/data";
import type { ClassLevel, ClassTypeDoc, InstructorDoc, ScheduleDoc } from "@/lib/types/firestore";
import { capacityLabel } from "@/components/admin/ClassRow";

interface Schedule extends ScheduleDoc {
  id: string;
}

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOUR_HEIGHT = 56;
const MIN_START_HOUR = 7;
const MIN_END_HOUR = 21;
const GUTTER = 56;

interface WeekCalendarProps {
  weekStart: Date;
  schedules: Schedule[];
  classTypes: Record<string, ClassTypeDoc>;
  instructors: Record<string, InstructorDoc>;
  /** Called with the day + hour of an empty cell the user clicked, to open the "programar clase" sheet prefilled. */
  onSlotClick?: (day: Date, hour: number) => void;
  /** Called when an existing class block is clicked, to manage its roster. */
  onScheduleClick?: (schedule: Schedule) => void;
}

export function WeekCalendar({
  weekStart,
  schedules,
  classTypes,
  instructors,
  onSlotClick,
  onScheduleClick,
}: WeekCalendarProps) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { startHour, endHour } = useMemo(() => {
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

  // Re-render every minute so the "now" line moves.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const todayIndex = days.findIndex((d) => isSameDay(d, now));
  const nowOffset = ((now.getHours() - startHour) * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60);
  const showNowLine = todayIndex >= 0 && nowOffset >= 0 && nowOffset <= gridHeight;

  const usedLevels = useMemo(() => {
    const levels = new Set<ClassLevel>(Object.values(classTypes).map((c) => c.level));
    return (Object.keys(LEVEL_LABELS) as ClassLevel[]).filter((l) => levels.has(l));
  }, [classTypes]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-[22px] border border-ink/[0.08] bg-white">
        <div className="min-w-[760px]">
          <div
            className="grid border-b border-ink/[0.08]"
            style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
          >
            <span />
            {days.map((day, i) => {
              const isToday = i === todayIndex;
              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-1 border-l border-ink/[0.06] py-3">
                  <span className="text-xs font-semibold text-ink-faint">{DAY_LABELS[i]}</span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold ${
                      isToday ? "bg-ink text-white" : "text-ink"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="relative grid"
            style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
          >
            <div className="flex flex-col">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="box-border pr-2.5 pt-1 text-right text-[11px] tabular-nums text-ink-faint"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day, i) => {
              const daySchedules = schedules.filter((s) => isSameDay(s.startAt.toDate(), day));
              const isToday = i === todayIndex;
              return (
                <div
                  key={day.toISOString()}
                  onClick={
                    onSlotClick
                      ? (e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const hour = startHour + Math.floor((e.clientY - rect.top) / HOUR_HEIGHT);
                          onSlotClick(day, hour);
                        }
                      : undefined
                  }
                  className={`relative border-l border-ink/[0.06] ${onSlotClick ? "cursor-pointer hover:bg-brand-50/40" : ""}`}
                  style={{
                    height: gridHeight,
                    background: isToday
                      ? "rgba(50,138,120,0.04)"
                      : `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_HEIGHT - 1}px, rgba(22,24,29,0.05) ${HOUR_HEIGHT - 1}px ${HOUR_HEIGHT}px)`,
                  }}
                >
                  {daySchedules.map((schedule) => {
                    const start = schedule.startAt.toDate();
                    const end = schedule.endAt.toDate();
                    const top = ((start.getHours() - startHour) * 60 + start.getMinutes()) * (HOUR_HEIGHT / 60) + 2;
                    const height = Math.max(((end.getTime() - start.getTime()) / 60_000) * (HOUR_HEIGHT / 60) - 4, 30);
                    const full = schedule.bookedCount >= schedule.capacity;
                    const past = end.getTime() < now.getTime();
                    const classType = classTypes[schedule.classTypeId];
                    const colors = LEVEL_COLORS[classType?.level ?? "basico"];
                    const instructor = instructors[schedule.instructorId];

                    return (
                      <button
                        key={schedule.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick?.(schedule);
                        }}
                        title={`${classType?.name ?? "Clase"} · ${formatTime(start)} · ${instructor?.name ?? ""} · ${schedule.bookedCount}/${schedule.capacity}`}
                        className="absolute inset-x-1 box-border flex flex-col items-start gap-px overflow-hidden rounded-[10px] px-2 py-[5px] text-left hover:brightness-[0.97]"
                        style={{
                          top,
                          height,
                          background: colors.blockBg,
                          color: colors.blockFg,
                          border: full ? "1.5px solid rgba(22,24,29,0.55)" : 0,
                          opacity: past ? 0.55 : 1,
                        }}
                      >
                        <span className="max-w-full truncate text-xs font-semibold leading-[15px]">
                          {(classType?.name ?? "Clase").replace(/^Reformer /, "")}
                        </span>
                        <span className="max-w-full truncate text-[11px] leading-[14px] tabular-nums opacity-85">
                          {formatTime(start)} · {capacityLabel(schedule)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {showNowLine && (
              <div
                className="pointer-events-none absolute h-0 border-t-2 border-brand-700"
                style={{
                  top: nowOffset,
                  left: `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${todayIndex} / 7)`,
                  width: `calc((100% - ${GUTTER}px) / 7)`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        {usedLevels.map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{ background: LEVEL_COLORS[level].blockBg, border: `1px solid ${LEVEL_COLORS[level].blockFg}33` }}
            />
            {LEVEL_LABELS[level]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border-[1.5px] border-ink/55" /> Llena
        </span>
        {onSlotClick && <span className="text-ink-faint">Haz clic en un espacio vacío para programar ahí.</span>}
      </div>
    </div>
  );
}
