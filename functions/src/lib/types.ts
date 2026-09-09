import type { Timestamp } from "firebase-admin/firestore";

export type UserRole = "superadmin" | "tenant_owner" | "staff" | "instructor" | "student";
export type ScheduleStatus = "scheduled" | "in_progress" | "completed" | "canceled";
export type BookingStatus = "confirmed" | "attended" | "no_show" | "canceled" | "canceled_late";
export type PassStatus = "active" | "depleted" | "expired";
export type ClassLevel = "basico" | "intermedio" | "avanzado" | "embarazo_postparto";

export interface AuthClaims {
  tenantId: string | null;
  role: UserRole;
  branchIds: string[];
}

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export interface TenantDoc {
  name: string;
  slug: string;
  branding: {
    logoUrl: string | null;
    primaryHex: string;
    secondaryHex: string;
  };
  settings: {
    cancelWindowHours: number;
    lateCancelPenaltyCredits: number;
    minBasicClassesForAdvanced: number;
  };
  subscriptionStatus: SubscriptionStatus;
  createdAt: Timestamp;
}

export interface ClassTypeDoc {
  name: string;
  requiredCredits: number;
  level: ClassLevel;
}

export interface ScheduleDoc {
  branchId: string;
  roomId: string;
  classTypeId: string;
  instructorId: string;
  startAt: Timestamp;
  endAt: Timestamp;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ScheduleStatus;
}

export interface BookingDoc {
  scheduleId: string;
  studentId: string;
  spotNumber: number | null;
  status: BookingStatus;
  passUsedId: string | null;
  createdAt: Timestamp;
  canceledAt: Timestamp | null;
}

export interface WaitlistEntryDoc {
  scheduleId: string;
  studentId: string;
  position: number;
  createdAt: Timestamp;
}

export interface StudentPassDoc {
  studentId: string;
  packageId: string;
  initialCredits: number;
  remainingCredits: number;
  expiresAt: Timestamp;
  status: PassStatus;
}

export interface UserDoc {
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string | null;
  validatedBasicClasses: number;
}
