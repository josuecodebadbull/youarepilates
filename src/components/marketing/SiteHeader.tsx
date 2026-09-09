import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold tracking-tight text-ink">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs text-white"
          >
            YP
          </span>
          <span className="hidden sm:inline">YouArePilates</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <Link href="/#funciones" className="hover:text-ink">
            Funciones
          </Link>
          <Link href="/#como-funciona" className="hover:text-ink">
            Cómo funciona
          </Link>
        </nav>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/login" className="hidden font-medium text-ink-soft hover:text-ink sm:inline">
            Iniciar sesión
          </Link>
          <Link
            href="/onboarding"
            className="whitespace-nowrap rounded-lg bg-brand-700 px-3 py-2 font-semibold text-white shadow-sm hover:bg-brand-800 sm:px-4"
          >
            Crear mi estudio
          </Link>
        </div>
      </div>
    </header>
  );
}
