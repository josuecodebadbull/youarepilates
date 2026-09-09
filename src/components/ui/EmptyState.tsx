import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-10 text-center">
      <div
        aria-hidden
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"
      >
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
