"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ArrowLeft } from "lucide-react";

import { auth, db, functions } from "@/lib/firebase/client";
import { DEFAULT_TENANT_PROFILE, draftFromProfile, profileFromDraft, type ProfileDraft } from "@/lib/tenantProfile";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { StudioProfileFields } from "@/components/admin/StudioProfileFields";

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
  // Set once the account + studio exist; switches the page to step 2 (studio profile).
  const [created, setCreated] = useState<OnboardTenantResult | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(DEFAULT_TENANT_PROFILE));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  function goToPanel(slug: string) {
    router.push(`/admin?welcome=${slug}`);
  }

  async function saveProfileAndContinue() {
    if (!created) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      await updateDoc(doc(db, "tenants", created.tenantId), {
        profile: profileFromDraft(draft, null),
      });
      goToPanel(created.slug);
    } catch {
      setProfileError("No se pudo guardar. Puedes omitir este paso y completarlo después en el panel.");
      setSavingProfile(false);
    }
  }

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

      setCreated(result.data);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Paso 2 de 2</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Cuéntanos de tu estudio</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Esto es lo que tus alumnos verán en la página de tu estudio. Todo es opcional y lo puedes
            cambiar cuando quieras desde el panel, en Perfil del estudio.
          </p>

          <div className="mt-6">
            <StudioProfileFields value={draft} onChange={setDraft} />
          </div>

          {profileError && <p className="mt-4 text-sm text-red-600">{profileError}</p>}

          <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-canvas/95 px-6 py-4 backdrop-blur">
            <Button onClick={saveProfileAndContinue} disabled={savingProfile}>
              {savingProfile ? "Guardando..." : "Guardar y entrar a mi panel"}
            </Button>
            <Button variant="ghost" onClick={() => goToPanel(created.slug)} disabled={savingProfile}>
              Omitir por ahora
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Volver al inicio
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Paso 1 de 2</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Crea tu estudio</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Crea tu cuenta y en menos de un minuto tendrás tu panel de administración listo.
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
