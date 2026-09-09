"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { auth, functions } from "@/lib/firebase/client";

interface OnboardTenantResult {
  tenantId: string;
  slug: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      const onboardTenant = httpsCallable<
        { studioName: string },
        OnboardTenantResult
      >(functions, "onboardTenant");
      const result = await onboardTenant({ studioName });

      // Custom claims (tenantId, role) were just set server-side; force a
      // refresh so the next navigation carries them.
      await credential.user.getIdToken(true);

      router.push(`/admin?welcome=${result.data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el estudio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-2xl font-bold">Crea tu estudio</h1>
      <p className="mt-2 text-sm text-gray-600">
        En menos de un minuto tendrás tu panel de administración listo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="studioName" className="block text-sm font-medium">
            Nombre del estudio
          </label>
          <input
            id="studioName"
            required
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Pilates Flow Roma"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Creando..." : "Crear mi estudio"}
        </button>
      </form>
    </main>
  );
}
