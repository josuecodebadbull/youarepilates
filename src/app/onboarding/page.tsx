"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { auth, functions } from "@/lib/firebase/client";

interface OnboardTenantResult {
  tenantId: string;
  slug: string;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Intenta iniciar sesión.",
  "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.",
  "auth/invalid-email": "Ese correo no parece válido.",
};

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[err.code] ?? "No se pudo crear el estudio. Intenta de nuevo.";
  }
  return "No se pudo crear el estudio. Intenta de nuevo.";
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
      setError(friendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
        ← Volver al inicio
      </Link>

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

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="font-semibold text-gray-900 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
