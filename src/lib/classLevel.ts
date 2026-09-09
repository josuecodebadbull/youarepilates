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
