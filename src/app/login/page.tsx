"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
        ← Volver al inicio
      </Link>

      <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
      <p className="mt-1 text-sm text-gray-500">Ingresa a tu panel de administración.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿No tienes un estudio todavía?{" "}
        <Link href="/onboarding" className="font-semibold text-gray-900 hover:underline">
          Créalo gratis
        </Link>
      </p>
    </main>
  );
}
