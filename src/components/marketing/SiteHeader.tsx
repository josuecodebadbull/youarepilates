import Link from "next/link";

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-700 font-sans font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.375 }}
    >
      YP
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.06] bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[19px] font-semibold tracking-[-0.01em] text-ink"
        >
          <BrandMark />
          <span className="hidden min-[400px]:inline">YouArePilates</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["#funciones", "Funciones"],
            ["#como-funciona", "Cómo funciona"],
            ["#app-alumnos", "App de alumnos"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex h-10 items-center rounded-full px-3.5 text-sm font-semibold text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/login" className="flex h-[42px] items-center px-3.5 text-sm font-semibold text-ink hover:text-brand-700">
            Entrar
          </Link>
          <Link
            href="/onboarding"
            className="flex h-[42px] items-center whitespace-nowrap rounded-full bg-ink px-[18px] text-sm font-semibold text-white hover:bg-black"
          >
            Crear mi estudio
          </Link>
        </div>
      </div>
    </header>
  );
}
