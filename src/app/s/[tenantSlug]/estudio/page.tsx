"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  ChevronDown,
  Copy,
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
import { PhotoLightbox } from "@/components/student/PhotoGallery";

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

function branchPhotos(branch: Branch): string[] {
  return branch.photoUrls?.length ? branch.photoUrls : branch.photoUrl ? [branch.photoUrl] : [];
}

const pillClass =
  "inline-flex h-10 items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 text-[13px] font-semibold text-ink shadow-[0_1px_2px_rgba(22,24,29,0.04)] hover:text-brand-700";

/**
 * Public studio page. One layout for every screen: a single column on phones, and on
 * wide screens the branches move to a sticky right column next to the hero.
 */
export default function EstudioPage() {
  const { tenantId, tenant } = useTenant();
  const pathname = usePathname();
  const base = pathname.split("/").slice(0, 3).join("/");
  const profile = tenant.profile ?? DEFAULT_TENANT_PROFILE;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  useEffect(() => {
    const branchesQuery = query(collection(db, "tenants", tenantId, "branches"), orderBy("name"));
    return onSnapshot(branchesQuery, (snapshot) => {
      setBranches(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BranchDoc) })));
    });
  }, [tenantId]);

  // Hero image first, then every branch photo (deduped) — what "Ver fotos" opens.
  const photos = useMemo(() => {
    const all = [profile.heroImageUrl, ...branches.flatMap(branchPhotos)].filter(
      (url): url is string => !!url,
    );
    return Array.from(new Set(all));
  }, [profile.heroImageUrl, branches]);

  const heroPhoto = photos[0] ?? null;
  const heroCaption = branches[0]?.name;
  const hasContact = profile.whatsapp || profile.email || profile.instagramUrl;
  const sedesLabel = `${branches.length} ${branches.length === 1 ? "sede" : "sedes"}`;

  return (
    <div className="grid min-w-0 gap-7 min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:gap-x-12">
      <section className="flex min-w-0 flex-col gap-5 min-[900px]:col-start-1 min-[900px]:row-start-1">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--tenant-primary)" }}
            />
            {profile.tagline || `Estudio de Pilates${branches.length > 0 ? ` · ${sedesLabel}` : ""}`}
          </div>
          <h1 className="text-balance font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.025em] text-ink min-[900px]:text-[60px]">
            {tenant.name}
          </h1>
          {profile.description && (
            <p className="max-w-[560px] whitespace-pre-line text-pretty text-base leading-relaxed text-ink-soft">
              {profile.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href={base}
            className="flex h-[52px] flex-[1_1_180px] items-center justify-center gap-2.5 rounded-[14px] bg-ink text-[15px] font-semibold text-white"
          >
            Reservar clase <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
          <Link
            href={`${base}/precios`}
            className="flex h-[52px] flex-[1_1_140px] items-center justify-center rounded-[14px] border border-ink/[0.14] bg-white text-[15px] font-semibold text-ink"
          >
            Ver precios
          </Link>
        </div>

        {hasContact && (
          <div className="flex flex-wrap gap-2">
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${digitsOnly(profile.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={pillClass}
              >
                <MessageCircle className="h-4 w-4 text-brand-600" strokeWidth={1.9} /> WhatsApp
              </a>
            )}
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={pillClass}
              >
                <AtSign className="h-4 w-4 text-brand-600" strokeWidth={1.9} /> Instagram
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className={pillClass}>
                <Mail className="h-4 w-4 text-brand-600" strokeWidth={1.9} /> Email
              </a>
            )}
          </div>
        )}

        {heroPhoto && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#EDEBE6] shadow-[0_1px_2px_rgba(22,24,29,0.04),0_12px_32px_-12px_rgba(22,24,29,0.22)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhoto} alt={tenant.name} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/55 to-transparent" />
            <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3 text-white">
              <p className="text-[13px] font-semibold leading-snug">{heroCaption}</p>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="h-9 shrink-0 rounded-full bg-white/95 px-3.5 text-[13px] font-semibold text-ink"
                >
                  Ver fotos{photos.length > 1 ? ` (${photos.length})` : ""}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <aside className="flex min-w-0 flex-col gap-3.5 self-start min-[900px]:sticky min-[900px]:top-[88px] min-[900px]:col-start-2 min-[900px]:row-span-2 min-[900px]:row-start-1">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">Sedes</h2>
          <span className="text-[13px] text-ink-faint">{sedesLabel}</span>
        </div>
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
        {branches.length === 0 && (
          <p className="text-sm text-ink-soft">Este estudio todavía no tiene sedes registradas.</p>
        )}
      </aside>

      {(profile.amenities.length > 0 || profile.policies) && (
        <section className="flex min-w-0 flex-col gap-3.5 min-[900px]:col-start-1 min-[900px]:row-start-2">
          {profile.amenities.length > 0 && (
            <div className="flex flex-col gap-3.5 rounded-[22px] border border-ink/[0.08] bg-white p-5">
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Amenidades
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-2.5">
                {profile.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm text-ink">
                    <CheckCircle2
                      className="h-[18px] w-[18px] shrink-0 text-brand-600"
                      strokeWidth={1.75}
                    />
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.policies && (
            <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white">
              <button
                type="button"
                onClick={() => setPoliciesOpen((open) => !open)}
                aria-expanded={policiesOpen}
                className="flex min-h-[60px] w-full items-center justify-between gap-3 px-5 text-left"
              >
                <span className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                  <ShieldCheck className="h-[18px] w-[18px] text-brand-600" strokeWidth={1.75} />
                  Políticas
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-ink-soft transition-transform ${
                    policiesOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {policiesOpen && (
                <ul className="flex list-disc flex-col gap-2 pb-5 pl-12 pr-5 text-sm leading-relaxed text-ink-soft marker:text-ink-faint">
                  {profile.policies
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <PhotoLightbox
        photos={photos}
        alt={tenant.name}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard?.writeText(branch.address).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const secondaryButton =
    "flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#F3F2EE] text-sm font-semibold text-ink";

  return (
    <article className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-8px_rgba(22,24,29,0.10)]">
      <div className="relative h-[190px] bg-[#EDEBE6]">
        <iframe
          title={`Mapa de ${branch.name}`}
          src={mapEmbedSrc(branch.address)}
          loading="lazy"
          className="block h-full w-full border-0 grayscale-[0.35]"
        />
        <a
          href={mapDirectionsUrl(branch.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex h-[34px] items-center rounded-full bg-white px-3 text-xs font-semibold text-ink shadow-[0_2px_10px_rgba(22,24,29,0.18)]"
        >
          Abrir mapa
        </a>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[17px] font-bold leading-snug tracking-tight text-ink">{branch.name}</h3>
          <p className="flex gap-2 text-sm leading-relaxed text-ink-soft">
            <MapPin className="mt-[3px] h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
            <span className="text-pretty">{branch.address}</span>
          </p>
        </div>

        {branch.arrivalNote && (
          <p className="rounded-xl bg-[#F3F2EE] p-3 text-xs leading-relaxed text-ink-soft">
            {branch.arrivalNote}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a
            href={mapDirectionsUrl(branch.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--tenant-primary)" }}
          >
            <Navigation className="h-4 w-4" strokeWidth={2} /> Cómo llegar
          </a>
          {branch.phone && (
            <a href={`tel:${branch.phone}`} className={secondaryButton}>
              <Phone className="h-4 w-4" strokeWidth={1.8} /> Llamar
            </a>
          )}
          <button
            type="button"
            onClick={copyAddress}
            className={`${secondaryButton} ${branch.phone ? "" : "col-span-2"}`}
          >
            <Copy className="h-4 w-4" strokeWidth={1.8} />
            {copied ? "¡Copiada!" : "Copiar dirección"}
          </button>
        </div>

        {branch.phone && (
          <div className="flex items-center justify-between border-t border-ink/[0.07] pt-3.5 text-[13px] text-ink-soft">
            <span>Teléfono</span>
            <a href={`tel:${branch.phone}`} className="font-semibold tabular-nums text-ink">
              {branch.phone}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
