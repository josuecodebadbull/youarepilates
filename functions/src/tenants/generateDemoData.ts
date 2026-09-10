import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminDb, Timestamp } from "../lib/admin";
import { requireRole } from "../lib/authz";
import type {
  BranchDoc,
  ClassTypeDoc,
  InstructorDoc,
  PackageDoc,
  RoomDoc,
  ScheduleDoc,
} from "../lib/types";

/** Rows of `perRow` beds each, so the demo layout looks like a real room floor plan. */
function makeSpots(count: number, perRow = 4) {
  return Array.from({ length: count }, (_, i) => ({
    spotNumber: i + 1,
    label: `Lugar ${i + 1}`,
    row: Math.floor(i / perRow),
  }));
}

/**
 * Fills the tenant with a realistic set of sedes, salas, tipos de clase, instructores,
 * paquetes y horarios de las próximas dos semanas — so a new studio owner can explore
 * the whole platform (student booking flow included) without typing in test data by
 * hand first. Additive: calling it more than once creates more demo docs rather than
 * replacing anything — use resetTenantData first to start clean.
 */
export const generateDemoData = onCall(async (request) => {
  const claims = requireRole(request, "tenant_owner", "staff");
  if (!claims.tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está asignada a ningún estudio.");
  }
  const tenantRef = adminDb.collection("tenants").doc(claims.tenantId);
  const batch = adminDb.batch();

  const branch1Ref = tenantRef.collection("branches").doc();
  const branch2Ref = tenantRef.collection("branches").doc();
  batch.set(branch1Ref, {
    name: "Sucursal Centro",
    address: "Av. Reforma 123, Col. Juárez, CDMX",
    createdAt: Timestamp.now(),
  } satisfies BranchDoc);
  batch.set(branch2Ref, {
    name: "Sucursal Norte",
    address: "Av. Vallejo 456, Col. Industrial Vallejo, CDMX",
    createdAt: Timestamp.now(),
  } satisfies BranchDoc);

  const roomARef = branch1Ref.collection("rooms").doc();
  const roomBRef = branch1Ref.collection("rooms").doc();
  const roomCRef = branch2Ref.collection("rooms").doc();
  batch.set(roomARef, { name: "Sala Reformer A", capacity: 8, spots: makeSpots(8), blockedSpots: [] } satisfies RoomDoc);
  batch.set(roomBRef, { name: "Sala Mat", capacity: 12, spots: makeSpots(12), blockedSpots: [] } satisfies RoomDoc);
  batch.set(roomCRef, { name: "Sala Reformer B", capacity: 10, spots: makeSpots(10), blockedSpots: [] } satisfies RoomDoc);

  const classTypeMatRef = tenantRef.collection("classTypes").doc();
  const classTypeFlowRef = tenantRef.collection("classTypes").doc();
  const classTypeAdvRef = tenantRef.collection("classTypes").doc();
  const classTypePrenatalRef = tenantRef.collection("classTypes").doc();
  batch.set(classTypeMatRef, {
    name: "Mat Fundamentals",
    durationMinutes: 50,
    requiredCredits: 1,
    description: "Fundamentos de Pilates en colchoneta, ideal para empezar.",
    level: "basico",
  } satisfies ClassTypeDoc);
  batch.set(classTypeFlowRef, {
    name: "Reformer Flow",
    durationMinutes: 50,
    requiredCredits: 1,
    description: "Clase dinámica en reformer para todos los niveles.",
    level: "basico",
  } satisfies ClassTypeDoc);
  batch.set(classTypeAdvRef, {
    name: "Reformer Avanzado",
    durationMinutes: 55,
    requiredCredits: 1,
    description: "Secuencias avanzadas de fuerza y control usando el carro del reformer.",
    level: "avanzado",
  } satisfies ClassTypeDoc);
  batch.set(classTypePrenatalRef, {
    name: "Embarazo y Postparto",
    durationMinutes: 45,
    requiredCredits: 1,
    description: "Clase adaptada para embarazo y recuperación postparto.",
    level: "embarazo_postparto",
  } satisfies ClassTypeDoc);

  const instructor1Ref = tenantRef.collection("instructors").doc();
  const instructor2Ref = tenantRef.collection("instructors").doc();
  const instructor3Ref = tenantRef.collection("instructors").doc();
  batch.set(instructor1Ref, {
    name: "Ana Torres",
    bio: "Instructora certificada en Reformer con 6 años de experiencia.",
    photoUrl: null,
    active: true,
  } satisfies InstructorDoc);
  batch.set(instructor2Ref, {
    name: "Marco Díaz",
    bio: "Especialista en rehabilitación y Pilates terapéutico.",
    photoUrl: null,
    active: true,
  } satisfies InstructorDoc);
  batch.set(instructor3Ref, {
    name: "Sofía Hernández",
    bio: "Instructora de Mat y clases para embarazo y postparto.",
    photoUrl: null,
    active: true,
  } satisfies InstructorDoc);

  batch.set(tenantRef.collection("packages").doc(), {
    name: "Clase individual",
    creditAmount: 1,
    price: 280,
    validityDays: 15,
    active: true,
  } satisfies PackageDoc);
  batch.set(tenantRef.collection("packages").doc(), {
    name: "Pack 10 clases",
    creditAmount: 10,
    price: 2200,
    validityDays: 45,
    active: true,
  } satisfies PackageDoc);
  batch.set(tenantRef.collection("packages").doc(), {
    name: "Pack 20 clases",
    creditAmount: 20,
    price: 4000,
    validityDays: 90,
    active: true,
  } satisfies PackageDoc);

  // Fixed daily slots — one room only ever appears once at a given hour, so the demo
  // data itself never has a room double-booked.
  const dayPlan = [
    { roomRef: roomARef, branchRef: branch1Ref, classTypeRef: classTypeFlowRef, instructorRef: instructor1Ref, hour: 7, durationMinutes: 50, capacity: 8 },
    { roomRef: roomBRef, branchRef: branch1Ref, classTypeRef: classTypeMatRef, instructorRef: instructor3Ref, hour: 9, durationMinutes: 50, capacity: 12 },
    { roomRef: roomCRef, branchRef: branch2Ref, classTypeRef: classTypePrenatalRef, instructorRef: instructor2Ref, hour: 10, durationMinutes: 45, capacity: 10 },
    { roomRef: roomARef, branchRef: branch1Ref, classTypeRef: classTypeAdvRef, instructorRef: instructor1Ref, hour: 18, durationMinutes: 55, capacity: 8 },
  ];

  const schedulesCollection = tenantRef.collection("schedules");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysAdded = 0;
  let dayOffset = 1; // start tomorrow — avoids any chance of landing on an already-past hour today
  while (daysAdded < 12) {
    const day = new Date(today);
    day.setDate(day.getDate() + dayOffset);
    dayOffset++;
    if (day.getDay() === 0) continue; // no clases on Sunday
    daysAdded++;

    for (const slot of dayPlan) {
      const startAt = new Date(day);
      startAt.setHours(slot.hour, 0, 0, 0);
      const endAt = new Date(startAt.getTime() + slot.durationMinutes * 60_000);

      batch.set(schedulesCollection.doc(), {
        branchId: slot.branchRef.id,
        roomId: slot.roomRef.id,
        classTypeId: slot.classTypeRef.id,
        instructorId: slot.instructorRef.id,
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        capacity: slot.capacity,
        bookedCount: 0,
        waitlistCount: 0,
        status: "scheduled",
        takenSpots: [],
      } satisfies ScheduleDoc);
    }
  }

  await batch.commit();

  return { created: true };
});
