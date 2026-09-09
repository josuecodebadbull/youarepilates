"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PackageDoc, StudentPassDoc, UserDoc } from "@/lib/types/firestore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface Student extends UserDoc {
  id: string;
}
interface PackageItem extends PackageDoc {
  id: string;
}
interface Pass extends StudentPassDoc {
  id: string;
}

export default function AlumnosPage() {
  const { tenantId } = useTenant();
  const [students, setStudents] = useState<Student[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const studentsQuery = query(
      collection(db, "users"),
      where("tenantId", "==", tenantId),
      where("role", "==", "student"),
      orderBy("displayName"),
    );
    return onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "packages"), orderBy("name")),
      (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PackageDoc) }))),
    );
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Alumnos"
        description="Las personas registradas en tu app de reservas. Dales créditos aquí para ventas en efectivo, cortesías, o para hacer pruebas."
      />

      {loaded && students.length === 0 ? (
        <EmptyState
          icon="🧑‍🎓"
          title="Todavía no tienes alumnos registrados"
          description="Comparte el link de tu app (lo tienes en la barra lateral) para que empiecen a crear su cuenta."
        />
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {students.map((student) => (
            <StudentRow
              key={student.id}
              tenantId={tenantId}
              student={student}
              packages={packages}
              expanded={expandedId === student.id}
              onToggle={() => setExpandedId((current) => (current === student.id ? null : student.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentRow({
  tenantId,
  student,
  packages,
  expanded,
  onToggle,
}: {
  tenantId: string;
  student: Student;
  packages: PackageItem[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [passes, setPasses] = useState<Pass[]>([]);

  useEffect(() => {
    if (!expanded) return;
    const passesQuery = query(
      collection(db, "tenants", tenantId, "studentPasses"),
      where("studentId", "==", student.id),
      where("status", "==", "active"),
    );
    return onSnapshot(passesQuery, (snapshot) => {
      setPasses(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as StudentPassDoc) })));
    });
  }, [expanded, tenantId, student.id]);

  const totalCredits = passes.reduce((sum, pass) => sum + pass.remainingCredits, 0);

  return (
    <li>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
      >
        <Avatar name={student.displayName || student.email} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">
            {student.displayName || "(sin nombre)"}
          </p>
          <p className="truncate text-sm text-gray-500">{student.email}</p>
        </div>
        {expanded ? (
          <span className="text-sm text-gray-400">▲</span>
        ) : (
          <span className="shrink-0 text-sm font-medium text-gray-600">
            {totalCredits > 0 ? `${totalCredits} créditos` : "Sin créditos"}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            Créditos activos: {totalCredits > 0 ? totalCredits : "ninguno"}
          </p>
          {passes.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {passes.map((pass) => (
                <li key={pass.id}>
                  {pass.remainingCredits}/{pass.initialCredits} créditos · vence{" "}
                  {pass.expiresAt.toDate().toLocaleDateString("es-MX")}
                </li>
              ))}
            </ul>
          )}

          <AddCreditsForm tenantId={tenantId} studentId={student.id} packages={packages} />
        </div>
      )}
    </li>
  );
}

function AddCreditsForm({
  tenantId,
  studentId,
  packages,
}: {
  tenantId: string;
  studentId: string;
  packages: PackageItem[];
}) {
  const [packageId, setPackageId] = useState<string>(packages[0]?.id ?? "custom");
  const [customCredits, setCustomCredits] = useState(1);
  const [customValidityDays, setCustomValidityDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPackage = packages.find((p) => p.id === packageId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      const creditAmount = selectedPackage?.creditAmount ?? customCredits;
      const validityDays = selectedPackage?.validityDays ?? customValidityDays;
      const expiresAt = Timestamp.fromMillis(Date.now() + validityDays * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, "tenants", tenantId, "studentPasses"), {
        studentId,
        packageId: selectedPackage?.id ?? "manual",
        initialCredits: creditAmount,
        remainingCredits: creditAmount,
        expiresAt,
        status: "active",
      } satisfies StudentPassDoc);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-900">Dar créditos</h3>

      <FormField
        label="Paquete"
        htmlFor={`package-${studentId}`}
        hint="Elige uno de tus paquetes, o crea un pase personalizado"
      >
        <select
          id={`package-${studentId}`}
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className={inputClass}
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} ({pkg.creditAmount} créditos)
            </option>
          ))}
          <option value="custom">Personalizado…</option>
        </select>
      </FormField>

      {packageId === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Créditos" htmlFor={`custom-credits-${studentId}`}>
            <input
              id={`custom-credits-${studentId}`}
              type="number"
              min={1}
              value={customCredits}
              onChange={(e) => setCustomCredits(Number(e.target.value))}
              className={inputClass}
            />
          </FormField>
          <FormField label="Vigencia (días)" htmlFor={`custom-validity-${studentId}`}>
            <input
              id={`custom-validity-${studentId}`}
              type="number"
              min={1}
              value={customValidityDays}
              onChange={(e) => setCustomValidityDays(Number(e.target.value))}
              className={inputClass}
            />
          </FormField>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Agregar créditos"}
        </Button>
        {success && <span className="text-sm text-green-600">¡Listo!</span>}
      </div>
    </form>
  );
}
