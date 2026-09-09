"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";

export default function AdminDashboardPage() {
  const { tenantId, tenant } = useTenant();
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

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "—"}</p>
    </div>
  );
}
