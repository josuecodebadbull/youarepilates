import type { ClassLevel } from "@/lib/types/firestore";

export const LEVEL_LABELS: Record<ClassLevel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  embarazo_postparto: "Embarazo / Postparto",
};

export const LEVEL_BADGE_CLASSES: Record<ClassLevel, string> = {
  basico: "bg-gray-100 text-gray-700",
  intermedio: "bg-blue-100 text-blue-700",
  avanzado: "bg-purple-100 text-purple-700",
  embarazo_postparto: "bg-pink-100 text-pink-700",
};

/** Admin panel palette per level: a solid badge, and a softer tint for calendar blocks. */
export const LEVEL_COLORS: Record<ClassLevel, { badgeBg: string; badgeFg: string; blockBg: string; blockFg: string }> = {
  basico: { badgeBg: "#F3F4F6", badgeFg: "#374151", blockBg: "#EEF6F4", blockFg: "#16473F" },
  intermedio: { badgeBg: "#DBEAFE", badgeFg: "#1D4ED8", blockBg: "#E6EEFC", blockFg: "#1E3A8A" },
  avanzado: { badgeBg: "#F3E8FF", badgeFg: "#7E22CE", blockBg: "#F1EAFB", blockFg: "#5B21B6" },
  embarazo_postparto: { badgeBg: "#FCE7F3", badgeFg: "#BE185D", blockBg: "#FBEAF2", blockFg: "#9D174D" },
};
