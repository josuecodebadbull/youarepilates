import { Avatar } from "@/components/ui/Avatar";
import { LEVEL_BADGE_CLASSES, LEVEL_LABELS } from "@/lib/classLevel";
import type { ClassTypeDoc, InstructorDoc, ScheduleDoc } from "@/lib/types/firestore";

interface ClassCardProps {
  schedule: ScheduleDoc;
  classType?: ClassTypeDoc;
  instructor?: InstructorDoc;
  action?: React.ReactNode;
}

export function ClassCard({ schedule, classType, instructor, action }: ClassCardProps) {
  const spotsLeft = Math.max(0, schedule.capacity - schedule.bookedCount);
  const isFull = spotsLeft === 0;
  const startTime = schedule.startAt.toDate().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = schedule.endAt.toDate().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Avatar name={instructor?.name ?? "?"} photoUrl={instructor?.photoUrl} size={44} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-gray-900">{classType?.name ?? "Clase"}</p>
          {classType && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE_CLASSES[classType.level]}`}
            >
              {LEVEL_LABELS[classType.level]}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-500">
          {startTime}–{endTime} · {instructor?.name ?? "Sin instructor"}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`text-xs font-medium ${isFull ? "text-red-600" : "text-gray-500"}`}
          >
            {isFull ? "Sin lugares" : `${spotsLeft} ${spotsLeft === 1 ? "lugar" : "lugares"}`}
            {schedule.waitlistCount > 0 ? ` · ${schedule.waitlistCount} en espera` : ""}
          </span>
          {action}
        </div>
      </div>
    </div>
  );
}
