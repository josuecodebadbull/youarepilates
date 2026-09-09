"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { StudentPassDoc, UserDoc, WaiverSignatureDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Pass extends StudentPassDoc {
  id: string;
}

export default function PerfilPage() {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [signature, setSignature] = useState<WaiverSignatureDoc | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    const passesQuery = query(
      collection(db, "tenants", tenantId, "studentPasses"),
      where("studentId", "==", user.uid),
      where("status", "==", "active"),
    );
    const unsubPasses = onSnapshot(passesQuery, (snapshot) => {
      setPasses(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as StudentPassDoc) })));
    });

    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
    });

    return () => {
      unsubPasses();
      unsubProfile();
    };
  }, [tenantId, user]);

  useEffect(() => {
    if (!user) return;
    if (tenant.waiver.version === 0) {
      setSignature(null);
      return;
    }
    const signatureQuery = query(
      collection(db, "tenants", tenantId, "waiverSignatures"),
      where("studentId", "==", user.uid),
      where("version", "==", tenant.waiver.version),
    );
    return onSnapshot(signatureQuery, (snap) => {
      setSignature(snap.empty ? null : (snap.docs[0]!.data() as WaiverSignatureDoc));
    });
  }, [tenantId, user, tenant.waiver.version]);

  if (!user) {
    return <p className="text-sm text-gray-500">Inicia sesión para ver tu perfil.</p>;
  }

  const totalCredits = passes.reduce((sum, pass) => sum + pass.remainingCredits, 0);
  const nextExpiring = passes
    .slice()
    .sort((a, b) => a.expiresAt.toMillis() - b.expiresAt.toMillis())[0];

  return (
    <div className="space-y-6 pb-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">Mis créditos</p>
        <p className="mt-1 text-4xl font-bold text-gray-900">{totalCredits}</p>
        {nextExpiring && (
          <p className="mt-1 text-xs text-gray-500">
            El paquete más próximo vence el {nextExpiring.expiresAt.toDate().toLocaleDateString("es-MX")}
          </p>
        )}
        <ul className="mt-3 space-y-1.5">
          {passes.map((pass) => (
            <li key={pass.id} className="rounded-md bg-gray-50 p-2.5 text-sm text-gray-700">
              {pass.remainingCredits}/{pass.initialCredits} créditos · vence{" "}
              {pass.expiresAt.toDate().toLocaleDateString("es-MX")}
            </li>
          ))}
          {passes.length === 0 && (
            <li className="text-sm text-gray-500">No tienes paquetes activos.</li>
          )}
        </ul>
      </section>

      {tenant.waiver.version > 0 && (
        <WaiverSection
          tenantId={tenantId}
          studentId={user.uid}
          waiverText={tenant.waiver.text}
          waiverVersion={tenant.waiver.version}
          signature={signature}
          defaultName={profile?.displayName ?? ""}
        />
      )}

      {profile && <PersonalInfoForm userId={user.uid} profile={profile} />}
    </div>
  );
}

function WaiverSection({
  tenantId,
  studentId,
  waiverText,
  waiverVersion,
  signature,
  defaultName,
}: {
  tenantId: string;
  studentId: string;
  waiverText: string;
  waiverVersion: number;
  signature: WaiverSignatureDoc | null | undefined;
  defaultName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fullName, setFullName] = useState(defaultName);
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (signature === undefined) {
    return null; // loading
  }

  if (signature) {
    return (
      <section className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <p className="flex items-center gap-1.5 font-semibold text-brand-900">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> Carta responsiva firmada
        </p>
        <p className="mt-1 text-sm text-brand-800">
          Firmada por {signature.fullNameTyped} el{" "}
          {signature.signedAt.toDate().toLocaleDateString("es-MX")} (versión {signature.version}).
        </p>
      </section>
    );
  }

  async function handleSign(event: FormEvent) {
    event.preventDefault();
    if (!accepted || !fullName.trim()) return;

    setError(null);
    setSigning(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "waiverSignatures"), {
        studentId,
        version: waiverVersion,
        fullNameTyped: fullName.trim(),
        signedAt: Timestamp.now(),
      } satisfies WaiverSignatureDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar tu firma.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-semibold text-amber-900">Carta responsiva pendiente de firmar</p>
      <p className="mt-1 text-sm text-amber-800">
        Debes leerla y firmarla antes de poder reservar una clase.
      </p>

      {!expanded ? (
        <Button onClick={() => setExpanded(true)} className="mt-3">
          Leer y firmar
        </Button>
      ) : (
        <form onSubmit={handleSign} className="mt-3 space-y-3">
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-amber-200 bg-white p-3 font-sans text-xs text-ink">
            {waiverText}
          </pre>

          <FormField label="Nombre completo (como firma)" htmlFor="waiver-name" required>
            <input
              id="waiver-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            He leído y acepto los términos de la carta responsiva.
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={signing || !accepted || !fullName.trim()}>
            {signing ? "Firmando..." : "Firmar"}
          </Button>
        </form>
      )}
    </section>
  );
}

function PersonalInfoForm({ userId, profile }: { userId: string; profile: UserDoc }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContact?.name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContact?.phone ?? "");
  const [medicalNotes, setMedicalNotes] = useState(profile.emergencyContact?.medicalNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, "users", userId), {
        displayName,
        phone,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          medicalNotes,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="font-semibold text-gray-900">Mi información</h2>

      <FormField label="Nombre completo" htmlFor="profile-name">
        <input
          id="profile-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Teléfono" htmlFor="profile-phone">
        <input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="55 1234 5678"
          className={inputClass}
        />
      </FormField>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-900">Contacto de emergencia</p>
        <p className="text-xs text-gray-500">
          Y cualquier lesión, condición o restricción física que tu instructor deba conocer antes de tu clase.
        </p>

        <div className="mt-3 space-y-3">
          <FormField label="Nombre del contacto" htmlFor="emergency-name">
            <input
              id="emergency-name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Teléfono del contacto" htmlFor="emergency-phone">
            <input
              id="emergency-phone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Notas médicas / lesiones"
            htmlFor="medical-notes"
            hint="Ej. hernia lumbar, embarazo, lesión de rodilla — tu instructor lo verá antes de la clase"
          >
            <textarea
              id="medical-notes"
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        {saved && <span className="text-sm text-green-600">¡Guardado!</span>}
      </div>
    </form>
  );
}
