"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { ArrowLeft } from "lucide-react";

import { auth, functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

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
    <main className="flex min-h-screen flex-col justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Volver al inicio
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-ink">Crea tu estudio</h1>
          <p className="mt-1 text-sm text-ink-soft">
            En menos de un minuto tendrás tu panel de administración listo.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <FormField
              label="Nombre del estudio"
              htmlFor="studioName"
              hint="Puedes ajustarlo después"
              required
            >
              <input
                id="studioName"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className={inputClass}
                placeholder="Pilates Flow Roma"
              />
            </FormField>

            <FormField label="Email" htmlFor="email" required>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres" required>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creando..." : "Crear mi estudio"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
