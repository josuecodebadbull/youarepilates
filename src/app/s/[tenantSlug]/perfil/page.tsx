"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowRight, CalendarDays, CheckCircle2, Ticket } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { DEFAULT_TENANT_WAIVER } from "@/lib/tenantWaiver";
import type {
  BookingDoc,
  ClassTypeDoc,
  InstructorDoc,
  ScheduleDoc,
  StudentPassDoc,
  UserDoc,
  WaiverSignatureDoc,
} from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Pass extends StudentPassDoc {
  id: string;
}

export default function PerfilPage() {
  const { tenantId, tenant } = useTenant();
  const waiver = tenant.waiver ?? DEFAULT_TENANT_WAIVER;
  const { user } = useAuth();
  const base = `/s/${tenant.slug}`;
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
    if (waiver.version === 0) {
      setSignature(null);
      return;
    }
    const signatureQuery = query(
      collection(db, "tenants", tenantId, "waiverSignatures"),
      where("studentId", "==", user.uid),
      where("version", "==", waiver.version),
    );
    return onSnapshot(signatureQuery, (snap) => {
      setSignature(snap.empty ? null : (snap.docs[0]!.data() as WaiverSignatureDoc));
    });
  }, [tenantId, user, waiver.version]);

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

        {totalCredits === 0 && (
          <Link
            href={`${base}/precios`}
            className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-800"
          >
            <span className="flex items-center gap-2">
              <Ticket className="h-4 w-4" strokeWidth={1.75} /> Comprar un paquete
            </span>
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        )}
      </section>

      <NextClassCard tenantId={tenantId} studentId={user.uid} base={base} hasCredits={totalCredits > 0} />

      {waiver.version > 0 && (
        <WaiverSection
          tenantId={tenantId}
          studentId={user.uid}
          waiverText={waiver.text}
          waiverVersion={waiver.version}
          signature={signature}
          defaultName={profile?.displayName ?? ""}
        />
      )}

      {profile && <PersonalInfoForm userId={user.uid} profile={profile} />}
    </div>
  );
}

interface UpcomingClass {
  bookingId: string;
  schedule: ScheduleDoc;
  classType?: ClassTypeDoc;
  instructor?: InstructorDoc;
}

function NextClassCard({
  tenantId,
  studentId,
  base,
  hasCredits,
}: {
  tenantId: string;
  studentId: string;
  base: string;
  hasCredits: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<UpcomingClass | null>(null);

  useEffect(() => {
    const bookingsQuery = query(
      collection(db, "tenants", tenantId, "bookings"),
      where("studentId", "==", studentId),
      where("status", "==", "confirmed"),
    );
    return onSnapshot(bookingsQuery, async (snapshot) => {
      const bookings = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) }));
      if (bookings.length === 0) {
        setNext(null);
        setLoading(false);
        return;
      }

      const withSchedules = await Promise.all(
        bookings.map(async (booking) => {
          const scheduleSnap = await getDoc(doc(db, "tenants", tenantId, "schedules", booking.scheduleId));
          return scheduleSnap.exists()
            ? { bookingId: booking.id, schedule: scheduleSnap.data() as ScheduleDoc }
            : null;
        }),
      );

      const now = Date.now();
      const soonest = withSchedules
        .filter((s): s is { bookingId: string; schedule: ScheduleDoc } => s !== null)
        .filter((s) => s.schedule.startAt.toMillis() >= now)
        .sort((a, b) => a.schedule.startAt.toMillis() - b.schedule.startAt.toMillis())[0];

      if (!soonest) {
        setNext(null);
        setLoading(false);
        return;
      }

      const [classTypeSnap, instructorSnap] = await Promise.all([
        getDoc(doc(db, "tenants", tenantId, "classTypes", soonest.schedule.classTypeId)),
        getDoc(doc(db, "tenants", tenantId, "instructors", soonest.schedule.instructorId)),
      ]);

      setNext({
        bookingId: soonest.bookingId,
        schedule: soonest.schedule,
        classType: classTypeSnap.exists() ? (classTypeSnap.data() as ClassTypeDoc) : undefined,
        instructor: instructorSnap.exists() ? (instructorSnap.data() as InstructorDoc) : undefined,
      });
      setLoading(false);
    });
  }, [tenantId, studentId]);

  if (loading) return null;

  if (!next) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">No tienes clases próximas reservadas.</p>
        {hasCredits && (
          <Link
            href={base}
            className="mt-3 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--tenant-primary)" }}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" strokeWidth={1.75} /> Reservar una clase
            </span>
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        )}
      </section>
    );
  }

  const startAt = next.schedule.startAt.toDate();

  return (
    <Link
      href={`${base}/mis-clases`}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-500">Tu próxima clase</p>
        <p className="mt-1 truncate font-semibold text-ink">{next.classType?.name ?? "Clase"}</p>
        <p className="text-sm text-ink-soft">
          {startAt.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })} ·{" "}
          {startAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          {next.instructor && ` · ${next.instructor.name}`}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={2} />
    </Link>
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
