"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Timestamp,
  collection,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type {
  BranchDoc,
  ClassTypeDoc,
  InstructorDoc,
  PackageDoc,
  ScheduleDoc,
  UserDoc,
} from "@/lib/types/firestore";
import { StudentAppLink } from "@/components/admin/StudentAppLink";
import { ClassCard } from "@/components/student/ClassCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Schedule extends ScheduleDoc {
  id: string;
}

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const { tenantId, tenant } = useTenant();
  const searchParams = useSearchParams();
  const justCreatedSlug = searchParams.get("welcome");

  const [branches, setBranches] = useState<BranchDoc[]>([]);
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
  const [instructors, setInstructors] = useState<Record<string, InstructorDoc>>({});
  const [packages, setPackages] = useState<PackageDoc[]>([]);
  const [students, setStudents] = useState<UserDoc[]>([]);
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "branches"), (snap) =>
      setBranches(snap.docs.map((d) => d.data() as BranchDoc)),
    );
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "classTypes"), (snap) => {
      const next: Record<string, ClassTypeDoc> = {};
      snap.docs.forEach((d) => (next[d.id] = d.data() as ClassTypeDoc));
      setClassTypes(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "instructors"), (snap) => {
      const next: Record<string, InstructorDoc> = {};
      snap.docs.forEach((d) => (next[d.id] = d.data() as InstructorDoc));
      setInstructors(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "packages"), (snap) =>
      setPackages(snap.docs.map((d) => d.data() as PackageDoc)),
    );
  }, [tenantId]);

  useEffect(() => {
    const studentsQuery = query(
      collection(db, "users"),
      where("tenantId", "==", tenantId),
      where("role", "==", "student"),
      orderBy("displayName"),
    );
    return onSnapshot(studentsQuery, (snap) => setStudents(snap.docs.map((d) => d.data() as UserDoc)));
  }, [tenantId]);

  useEffect(() => {
    async function loadUpcomingCount() {
      const snap = await getCountFromServer(
        query(
          collection(db, "tenants", tenantId, "schedules"),
          where("status", "==", "scheduled"),
          where("startAt", ">=", Timestamp.now()),
        ),
      );
      setUpcomingCount(snap.data().count);
    }
    loadUpcomingCount();
  }, [tenantId]);

  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("status", "==", "scheduled"),
      where("startAt", ">=", Timestamp.fromDate(startOfDay)),
      where("startAt", "<", Timestamp.fromDate(endOfDay)),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(todayQuery, (snap) =>
      setTodaySchedules(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ScheduleDoc) }))),
    );
  }, [tenantId]);

  const setupSteps = [
    { label: "Agrega una sede con al menos una sala", done: branches.length > 0, href: "/admin/sedes" },
    { label: "Crea un tipo de clase", done: Object.keys(classTypes).length > 0, href: "/admin/tipos-de-clase" },
    { label: "Agrega un instructor", done: Object.keys(instructors).length > 0, href: "/admin/instructores" },
    { label: "Crea un paquete de créditos", done: packages.length > 0, href: "/admin/paquetes" },
  ];
  const setupIncomplete = setupSteps.some((step) => !step.done);

  return (
    <div>
      {justCreatedSlug && <WelcomeBanner slug={justCreatedSlug} />}

      <h1 className="text-2xl font-semibold text-ink">Hola, {tenant.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Plan: {tenant.subscriptionStatus === "active" ? "Activo" : tenant.subscriptionStatus}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Sedes" value={branches.length} href="/admin/sedes" />
        <StatCard label="Tipos de clase" value={Object.keys(classTypes).length} href="/admin/tipos-de-clase" />
        <StatCard label="Instructores" value={Object.keys(instructors).length} href="/admin/instructores" />
        <StatCard label="Paquetes" value={packages.length} href="/admin/paquetes" />
        <StatCard label="Alumnos" value={students.length} href="/admin/alumnos" />
        <StatCard label="Clases próximas" value={upcomingCount} href="/admin/horarios" />
      </div>

      {setupIncomplete && (
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Termina de configurar tu estudio</h2>
          <ul className="mt-3 space-y-2">
            {setupSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    step.done ? "bg-brand-700 text-white" : "border border-amber-300 bg-white"
                  }`}
                  aria-hidden
                >
                  {step.done ? "✓" : ""}
                </span>
                {step.done ? (
                  <span className="text-amber-800 line-through decoration-amber-400">{step.label}</span>
                ) : (
                  <Link href={step.href} className="font-medium text-amber-900 underline">
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Hoy</h2>
        <div className="mt-3 space-y-3">
          {todaySchedules.map((schedule) => (
            <ClassCard
              key={schedule.id}
              schedule={schedule}
              classType={classTypes[schedule.classTypeId]}
              instructor={instructors[schedule.instructorId]}
            />
          ))}
          {todaySchedules.length === 0 && (
            <EmptyState icon="☕" title="No hay clases hoy" description="Disfruta tu día libre." />
          )}
        </div>
      </section>
    </div>
  );
}

function WelcomeBanner({ slug }: { slug: string }) {
  return (
    <div className="mb-8 rounded-xl border border-brand-200 bg-brand-50 p-6">
      <h2 className="font-semibold text-brand-900">¡Tu estudio está listo! 🎉</h2>
      <p className="mt-1 text-sm text-brand-800">
        Siguiente paso: agrega una sede y un paquete de créditos en el menú de la
        izquierda. Cuando estés list@, comparte este link con tus alumnos para que
        reserven sus clases (también lo tienes siempre a la mano en la barra
        lateral):
      </p>
      <div className="mt-3">
        <StudentAppLink slug={slug} />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number | null; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-soft"
    >
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold text-ink">{value ?? "—"}</p>
    </Link>
  );
}
