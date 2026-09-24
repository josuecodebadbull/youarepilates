"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { addDays, getMonday } from "@/lib/calendarDate";
import type { PurchaseIntentDoc, ScheduleDoc, StudentPassDoc } from "@/lib/types/firestore";

export interface PurchaseIntent extends PurchaseIntentDoc {
  id: string;
}

/** Live list of purchase requests still waiting for the studio to confirm payment. */
export function usePendingIntents(tenantId: string) {
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const intentsQuery = query(
      collection(db, "purchaseIntents"),
      where("tenantId", "==", tenantId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(intentsQuery, (snap) => {
      setIntents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PurchaseIntentDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  return { intents, loaded };
}

/** Creates the student's pass and marks the intent paid, atomically. */
export async function confirmPurchaseIntent(tenantId: string, intent: PurchaseIntent) {
  const batch = writeBatch(db);
  const passRef = doc(collection(db, "tenants", tenantId, "studentPasses"));
  const expiresAt = Timestamp.fromMillis(Date.now() + intent.validityDays * 24 * 60 * 60 * 1000);

  batch.set(passRef, {
    studentId: intent.studentId,
    packageId: intent.packageId,
    initialCredits: intent.creditAmount,
    remainingCredits: intent.creditAmount,
    expiresAt,
    status: "active",
  } satisfies StudentPassDoc);
  batch.update(doc(db, "purchaseIntents", intent.id), { status: "paid" });

  await batch.commit();
}

export async function rejectPurchaseIntent(intent: PurchaseIntent) {
  await writeBatch(db).update(doc(db, "purchaseIntents", intent.id), { status: "failed" }).commit();
}

export interface StudentCredits {
  credits: number;
  /** Soonest expiry among passes that still have credits left. */
  nextExpiry: Date | null;
}

/**
 * Credits per student from every active pass in the tenant — one listener for the whole
 * studio instead of one per student.
 */
export function useCreditsByStudent(tenantId: string) {
  const [byStudent, setByStudent] = useState<Record<string, StudentCredits>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "studentPasses"), where("status", "==", "active")),
      (snap) => {
        const next: Record<string, StudentCredits> = {};
        const now = Date.now();
        snap.docs.forEach((d) => {
          const pass = d.data() as StudentPassDoc;
          // Same rule as booking: an expired pass no longer counts even if not yet flipped.
          if (pass.expiresAt.toMillis() <= now) return;
          const entry = (next[pass.studentId] ??= { credits: 0, nextExpiry: null });
          entry.credits += pass.remainingCredits;
          if (pass.remainingCredits > 0) {
            const expiry = pass.expiresAt.toDate();
            if (!entry.nextExpiry || expiry < entry.nextExpiry) entry.nextExpiry = expiry;
          }
        });
        setByStudent(next);
        setLoaded(true);
      },
    );
  }, [tenantId]);

  return { byStudent, loaded };
}

/** This week's scheduled classes, counted per class type and per instructor. */
export function useWeekClassCounts(tenantId: string) {
  const [counts, setCounts] = useState<{ byType: Record<string, number>; byInstructor: Record<string, number> }>({
    byType: {},
    byInstructor: {},
  });

  useEffect(() => {
    const start = getMonday(new Date());
    const weekQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("status", "==", "scheduled"),
      where("startAt", ">=", Timestamp.fromDate(start)),
      where("startAt", "<", Timestamp.fromDate(addDays(start, 7))),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(weekQuery, (snap) => {
      const byType: Record<string, number> = {};
      const byInstructor: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const s = d.data() as ScheduleDoc;
        byType[s.classTypeId] = (byType[s.classTypeId] ?? 0) + 1;
        byInstructor[s.instructorId] = (byInstructor[s.instructorId] ?? 0) + 1;
      });
      setCounts({ byType, byInstructor });
    });
  }, [tenantId]);

  return counts;
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-MX")}`;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "hace 2 h", "ayer, 19:40", "12 sep" — for when something happened. */
export function formatAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `hace ${Math.round(minutes / 60)} h`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `ayer, ${formatTime(date)}`;
  return formatShortDate(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]!.charAt(0) + (parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "")).toUpperCase();
}
