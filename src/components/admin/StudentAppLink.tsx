"use client";

import { useEffect, useState } from "react";

interface StudentAppLinkProps {
  slug: string;
  /**
   * "sidebar": small card at the bottom of the desktop sidebar.
   * "row": one-line row (the mobile "Más" sheet).
   * "card": the full "Comparte tu app" card with copy + WhatsApp.
   */
  variant?: "sidebar" | "row" | "card";
}

function useStudentAppUrl(slug: string) {
  // Resolved after mount so server and first client render match.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return `${origin}/s/${slug}`;
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return { copied, copy, label: copied ? "¡Copiado!" : "Copiar link" };
}

export function StudentAppLink({ slug, variant = "card" }: StudentAppLinkProps) {
  const url = useStudentAppUrl(slug);
  const { copy, label } = useCopy(url);

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-2.5 rounded-2xl bg-brand-50 p-3.5">
        <p className="text-xs font-semibold text-brand-800">App de alumnos</p>
        <code className="truncate font-mono text-xs font-medium text-brand-700">/s/{slug}</code>
        <div className="flex gap-1.5">
          <button
            onClick={copy}
            className="h-[34px] flex-1 rounded-[10px] bg-brand-700 text-xs font-semibold text-white hover:bg-brand-800"
          >
            {label}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[34px] items-center rounded-[10px] bg-white px-3 text-xs font-semibold text-brand-800 hover:text-brand-700"
          >
            Abrir
          </a>
        </div>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-brand-50 p-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-brand-800">App de alumnos</p>
          <code className="block truncate font-mono text-xs font-medium text-brand-700">/s/{slug}</code>
        </div>
        <button
          onClick={copy}
          className="h-10 shrink-0 rounded-xl bg-brand-700 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-800"
        >
          {label}
        </button>
      </div>
    );
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Reserva tus clases aquí: ${url}`)}`;

  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-ink/[0.08] bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">Comparte tu app</h2>
        <p className="text-[13px] leading-normal text-ink-soft">
          Tus alumnos reservan, compran paquetes y firman la responsiva desde este link.
        </p>
      </div>
      <code className="flex h-11 items-center truncate rounded-xl bg-[#F3F2EE] px-3.5 font-mono text-[13px] font-medium text-ink">
        {url.replace(/^https?:\/\//, "")}
      </code>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="h-11 rounded-xl bg-ink text-sm font-semibold text-white hover:bg-black">
          {label}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-xl border border-ink/[0.14] bg-white text-center text-sm font-semibold text-ink hover:bg-[#F7F6F3]"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </section>
  );
}
