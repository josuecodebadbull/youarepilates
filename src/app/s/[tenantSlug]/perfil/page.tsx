"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { StudentPassDoc, UserDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Pass extends StudentPassDoc {
  id: string;
}

export default function PerfilPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [profile, setProfile] = useState<UserDoc | null>(null);

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

      {profile && <PersonalInfoForm userId={user.uid} profile={profile} />}
    </div>
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
