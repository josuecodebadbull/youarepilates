import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "dark" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  dark: "bg-ink text-white hover:bg-black",
  secondary: "border border-ink/[0.14] bg-white text-ink hover:bg-[#F7F6F3]",
  ghost: "text-ink-soft hover:bg-[#F3F2EE]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
