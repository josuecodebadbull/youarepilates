"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  AtSign,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { DEFAULT_TENANT_PROFILE } from "@/lib/tenantProfile";
import type { BranchDoc } from "@/lib/types/firestore";

interface Branch extends BranchDoc {
  id: string;
}

function mapEmbedSrc(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function mapDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function EstudioPage() {
  const { tenantId, tenant } = useTenant();
  const profile = tenant.profile ?? DEFAULT_TENANT_PROFILE;
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const branchesQuery = query(collection(db, "tenants", tenantId, "branches"), orderBy("name"));
    return onSnapshot(branchesQuery, (snapshot) => {
      setBranches(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BranchDoc) })));
    });
  }, [tenantId]);

  const hasContact = profile.whatsapp || profile.email || profile.instagramUrl;

  return (
    <div className="-mx-4 -mt-5 pb-4">
      {profile.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.heroImageUrl}
          alt={tenant.name}
          className="h-44 w-full object-cover sm:h-56"
        />
      )}

      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>

        {profile.description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{profile.description}</p>
        )}

        {hasContact && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${digitsOnly(profile.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-card"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} /> WhatsApp
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-card"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} /> Email
              </a>
            )}
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-card"
              >
                <AtSign className="h-3.5 w-3.5" strokeWidth={1.75} /> Instagram
              </a>
            )}
          </div>
        )}

        {profile.amenities.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-ink">Amenidades</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
              {profile.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={1.75} />
                  {amenity}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-ink">Sedes</h2>
          <div className="mt-2 space-y-4">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
            {branches.length === 0 && (
              <p className="text-sm text-ink-soft">Este estudio todavía no tiene sedes registradas.</p>
            )}
          </div>
        </section>

        {profile.policies && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-brand-600" strokeWidth={1.75} /> Políticas
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{profile.policies}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      {branch.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.photoUrl} alt={branch.name} className="h-32 w-full object-cover" />
      )}

      <div className="p-4">
        <p className="font-semibold text-ink">{branch.name}</p>

        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-soft">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
          {branch.address}
        </p>

        {branch.phone && (
          <a
            href={`tel:${branch.phone}`}
            className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft"
          >
            <Phone className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
            {branch.phone}
          </a>
        )}

        {branch.arrivalNote && (
          <p className="mt-2 rounded-lg bg-gray-50 p-2.5 text-xs text-ink-soft">
            {branch.arrivalNote}
          </p>
        )}

        <a
          href={mapDirectionsUrl(branch.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Navigation className="h-3.5 w-3.5" strokeWidth={2} /> Cómo llegar
        </a>

        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
          <iframe
            title={`Mapa de ${branch.name}`}
            src={mapEmbedSrc(branch.address)}
            loading="lazy"
            className="h-40 w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
