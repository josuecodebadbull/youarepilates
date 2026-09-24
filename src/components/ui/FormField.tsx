import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Every input in the admin panel gets a label, an optional one-line hint explaining
 * what to type (the exact complaint: "no se entiende qué va en cada campo"), and a
 * reserved slot for a validation error — so the three states share one layout.
 */
export function FormField({ label, htmlFor, hint, error, required, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Taller, touch-friendly input used inside admin sheets. */
export const sheetInputClass =
  "h-12 w-full rounded-xl border border-ink/[0.14] bg-white px-3.5 text-[15px] font-medium text-ink placeholder:text-ink-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-[#F7F6F3]";

/** Pill used for single-choice pickers (class type, instructor, filters). */
export function chipClass(selected: boolean) {
  return `flex h-[42px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors ${
    selected ? "border-ink bg-ink text-white" : "border-ink/[0.12] bg-white text-ink hover:border-ink/30"
  }`;
}
