"use client";

import type { ReactNode } from "react";

/** White rounded panel used by every admin section. */
export const cardClass = "rounded-[22px] border border-ink/[0.08] bg-white";

export const fieldLabelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink";

export const textareaClass =
  "w-full resize-y rounded-xl border border-ink/[0.14] bg-white px-3.5 py-3 text-sm font-medium leading-normal text-ink placeholder:text-ink-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

/** Neutral pill for small facts ("8 camas", "30 días"). */
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        tone === "brand" ? "bg-brand-50 text-brand-800" : "bg-[#F3F2EE] text-ink"
      }`}
    >
      {children}
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-50 ${
        checked ? "justify-end bg-brand-700" : "justify-start bg-[#D6D4CE]"
      }`}
    >
      <span className="h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
    </button>
  );
}

/** − value + control on a sand background. */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  label,
  valueClassName = "min-w-7",
  size = "md",
}: {
  value: ReactNode;
  onDecrement: () => void;
  onIncrement: () => void;
  label: string;
  valueClassName?: string;
  size?: "sm" | "md";
}) {
  const button = size === "sm" ? "h-9 w-9 text-base" : "h-10 w-10 text-lg";
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-[14px] bg-[#F3F2EE] p-1">
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Menos ${label}`}
        className={`${button} rounded-[10px] bg-white font-semibold text-ink`}
      >
        −
      </button>
      <span className={`${valueClassName} text-center text-sm font-bold tabular-nums text-ink`}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Más ${label}`}
        className={`${button} rounded-[10px] bg-white font-semibold text-ink`}
      >
        +
      </button>
    </div>
  );
}

/** "Cancelar" + primary action for a sheet footer; submits the form with `formId`. */
export function SheetFooter({
  formId,
  onCancel,
  submitting,
  label,
  disabled,
}: {
  formId: string;
  onCancel: () => void;
  submitting: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="h-[50px] rounded-[14px] border border-ink/[0.14] bg-white px-[18px] text-[15px] font-semibold text-ink"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        disabled={submitting || disabled}
        className="h-[50px] flex-1 rounded-[14px] bg-ink text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Guardando..." : label}
      </button>
    </>
  );
}

/** Dashed tile for "add another" at the end of a card grid. */
export function AddTile({ label, onClick, className = "" }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-ink/[0.18] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink ${className}`}
    >
      <span className="text-2xl leading-none">+</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

export function PrimaryAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black"
    >
      {children}
    </button>
  );
}
