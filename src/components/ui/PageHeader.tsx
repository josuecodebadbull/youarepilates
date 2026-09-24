import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export const pageTitleClass = "text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink lg:text-[40px]";

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className={pageTitleClass}>{title}</h1>
        {description && <p className="max-w-xl text-sm leading-normal text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
