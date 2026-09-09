import type { Timestamp } from "firebase/firestore";

export type UserRole =
  | "superadmin"
  | "tenant_owner"
  | "staff"
  | "instructor"
  | "student";

export type SubscriptionStatus = "active" | "past_due" | "canceled";
export type ScheduleStatus = "scheduled" | "in_progress" | "completed" | "canceled";
export type BookingStatus = "confirmed" | "attended" | "no_show" | "canceled" | "canceled_late";
export type PassStatus = "active" | "depleted" | "expired";
export type ClassLevel = "basico" | "intermedio" | "avanzado" | "embarazo_postparto";

/** Custom claims injected into the Firebase Auth JWT. Kept in sync by onUserCreate/setUserRole. */
export interface AuthClaims {
  tenantId: string | null;
  role: UserRole;
  branchIds: string[];
}

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

export interface BranchDoc {
  name: string;
  address: string;
  createdAt: Timestamp;
}

export interface RoomSpot {
  spotNumber: number;
  label: string;
}

export interface RoomDoc {
  name: string;
  capacity: number;
  spots: RoomSpot[];
  /** Spot numbers blocked for maintenance; excluded from available capacity without touching `capacity`. */
  blockedSpots: number[];
}

export interface InstructorDoc {
  name: string;
  bio: string;
  photoUrl: string | null;
  active: boolean;
}

export interface ClassTypeDoc {
  name: string;
  durationMinutes: number;
  requiredCredits: number;
  description: string;
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
  passUsedId: string;
  createdAt: Timestamp;
  canceledAt: Timestamp | null;
}

export interface WaitlistEntryDoc {
  scheduleId: string;
  studentId: string;
  passId: string;
  position: number;
  createdAt: Timestamp;
}

export interface PackageDoc {
  name: string;
  creditAmount: number;
  price: number;
  validityDays: number;
  active: boolean;
}

export interface StudentPassDoc {
  studentId: string;
  packageId: string;
  initialCredits: number;
  remainingCredits: number;
  expiresAt: Timestamp;
  status: PassStatus;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  medicalNotes: string;
}

export interface UserDoc {
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  tenantId: string | null;
  emergencyContact: EmergencyContact | null;
  /** Count of attended basic-level classes, used by the advanced-class gating rule. */
  validatedBasicClasses: number;
}
