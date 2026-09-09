"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { auth, functions } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";

export default function StudentLoginPage() {
  const router = useRouter();
  const { tenantId } = useTenant();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Heals an account whose signup never finished (e.g. a dropped network call
        // to registerStudent left it with tenantId: null) — safe to retry any number
        // of times, and only touches accounts that never joined a tenant at all.
        const tokenResult = await credential.user.getIdTokenResult();
        if (tokenResult.claims.tenantId == null) {
          const registerStudent = httpsCallable(functions, "registerStudent");
          await registerStudent({ tenantId });
          await credential.user.getIdToken(true);
        }
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const registerStudent = httpsCallable(functions, "registerStudent");
        await registerStudent({ tenantId, displayName });
        await credential.user.getIdToken(true);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4 flex gap-4 text-sm">
        <button
          onClick={() => setMode("login")}
          className={mode === "login" ? "font-semibold" : "text-gray-500"}
        >
          Ingresar
        </button>
        <button
          onClick={() => setMode("signup")}
          className={mode === "signup" ? "font-semibold" : "text-gray-500"}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            required
            placeholder="Nombre completo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--tenant-primary)" }}
        >
          {submitting ? "Un momento..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
