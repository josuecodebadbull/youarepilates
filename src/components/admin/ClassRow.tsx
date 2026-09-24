"use client";

import { LEVEL_COLORS, LEVEL_LABELS } from "@/lib/classLevel";
import { formatTime } from "@/lib/admin/data";
import type { ClassTypeDoc, InstructorDoc, ScheduleDoc } from "@/lib/types/firestore";

export function capacityLabel(schedule: ScheduleDoc): string {
  if (schedule.bookedCount >= schedule.capacity) {
    return schedule.waitlistCount > 0 ? `Llena · ${schedule.waitlistCount} en espera` : "Llena";
  }
  return `${schedule.bookedCount}/${schedule.capacity}`;
}

export function LevelBadge({ classType }: { classType?: ClassTypeDoc }) {
  if (!classType) return null;
  const colors = LEVEL_COLORS[classType.level];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: colors.badgeBg, color: colors.badgeFg }}
    >
      {LEVEL_LABELS[classType.level]}
    </span>
  );
}

export function CapacityBar({ schedule }: { schedule: ScheduleDoc }) {
  const full = schedule.bookedCount >= schedule.capacity;
  const pct = schedule.capacity > 0 ? Math.min(100, Math.round((schedule.bookedCount / schedule.capacity) * 100)) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0EEE9]">
        <div className={`h-full rounded-full ${full ? "bg-ink" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`whitespace-nowrap text-xs font-semibold tabular-nums ${full ? "text-ink" : "text-ink-soft"}`}>
        {capacityLabel(schedule)}
      </span>
    </div>
  );
}

interface ClassRowProps {
  schedule: ScheduleDoc;
  classType?: ClassTypeDoc;
  instructor?: InstructorDoc;
  onClick: () => void;
  /** "row": divider-separated inside a list card. "card": standalone card. */
  variant?: "row" | "card";
}

export function ClassRow({ schedule, classType, instructor, onClick, variant = "row" }: ClassRowProps) {
  const start = schedule.startAt.toDate();
  const end = schedule.endAt.toDate();
  const now = Date.now();
  const live = start.getTime() <= now && now < end.getTime();
  const past = end.getTime() <= now;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);

  const base = "flex w-full gap-3.5 text-left text-ink transition-colors";
  const variantClass =
    variant === "row"
      ? `border-b border-ink/[0.06] px-[18px] py-4 last:border-b-0 ${live ? "bg-[#F6FAF9]" : "hover:bg-[#FAFAF8]"}`
      : "rounded-[20px] border border-ink/[0.08] bg-white p-4 hover:border-ink/[0.16]";

  return (
    <button onClick={onClick} className={`${base} ${variantClass} ${past && !live ? "opacity-[0.55]" : ""}`}>
      <div className="flex w-[52px] shrink-0 flex-col gap-0.5">
        <span className="text-[15px] font-bold tabular-nums">{formatTime(start)}</span>
        <span className="text-xs text-ink-faint">{variant === "row" ? `${minutes} min` : formatTime(end)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold">{classType?.name ?? "Clase"}</span>
          <LevelBadge classType={classType} />
          {live && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">En curso</span>
          )}
        </div>
        {instructor && <p className="text-[13px] text-ink-soft">{instructor.name}</p>}
        <CapacityBar schedule={schedule} />
      </div>
    </button>
  );
}
