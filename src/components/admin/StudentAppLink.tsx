"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";

interface StudentAppLinkProps {
  slug: string;
  /** Compact renders as a small sidebar widget; the default is the bigger dashboard card. */
  compact?: boolean;
}

export function StudentAppLink({ slug, compact = false }: StudentAppLinkProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/s/${slug}` : `/s/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compact) {
    return (
      <div className="mt-4 rounded-md border border-gray-200 bg-white p-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          App de alumnos
        </p>
        <div className="mt-1 flex items-center gap-1">
          <code className="flex-1 truncate text-xs text-gray-600">/s/{slug}</code>
          <button
            onClick={handleCopy}
            title="Copiar link"
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : "Copiar"}
          </button>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          Abrir en pestaña nueva <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="flex-1 truncate rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-900">
        {url}
      </code>
      <button
        onClick={handleCopy}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
