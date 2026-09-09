import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800",
  secondary: "border border-gray-300 bg-white text-ink hover:bg-gray-50",
  ghost: "text-ink-soft hover:bg-gray-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
