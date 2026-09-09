"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";

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

  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<number | null>(null);

  useEffect(() => {
    async function loadCounts() {
      const branchesSnapshot = await getCountFromServer(
        collection(db, "tenants", tenantId, "branches"),
      );
      setBranchCount(branchesSnapshot.data().count);

      const schedulesSnapshot = await getCountFromServer(
        query(
          collection(db, "tenants", tenantId, "schedules"),
          where("status", "==", "scheduled"),
        ),
      );
      setUpcomingClasses(schedulesSnapshot.data().count);
    }

    loadCounts();
  }, [tenantId]);

  return (
    <div>
      {justCreatedSlug && <WelcomeBanner slug={justCreatedSlug} />}

      <h1 className="text-2xl font-bold">Hola, {tenant.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Plan: {tenant.subscriptionStatus === "active" ? "Activo" : tenant.subscriptionStatus}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Sedes" value={branchCount} />
        <StatCard label="Clases programadas" value={upcomingClasses} />
      </div>
    </div>
  );
}

function WelcomeBanner({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const studentAppUrl =
    typeof window !== "undefined" ? `${window.location.origin}/s/${slug}` : `/s/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(studentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-8 rounded-lg border border-indigo-200 bg-indigo-50 p-6">
      <h2 className="font-semibold text-indigo-900">¡Tu estudio está listo! 🎉</h2>
      <p className="mt-1 text-sm text-indigo-800">
        Siguiente paso: agrega una sede y un paquete de créditos en el menú de la
        izquierda. Cuando estés list@, comparte este link con tus alumnos para que
        reserven sus clases:
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 truncate rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-900">
          {studentAppUrl}
        </code>
        <button
          onClick={handleCopy}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "—"}</p>
    </div>
  );
}
