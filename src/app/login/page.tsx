"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(next);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
          ← Volver al inicio
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-ink">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-ink-soft">Ingresa a tu panel de administración.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

            <FormField label="Contraseña" htmlFor="password" required>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿No tienes un estudio todavía?{" "}
          <Link href="/onboarding" className="font-semibold text-ink hover:underline">
            Créalo gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
