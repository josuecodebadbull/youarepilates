import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs text-white"
          >
            YP
          </span>
          YouArePilates
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-gray-600 sm:flex">
          <Link href="/#funciones" className="hover:text-gray-900">
            Funciones
          </Link>
          <Link href="/#como-funciona" className="hover:text-gray-900">
            Cómo funciona
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-gray-700 hover:text-gray-900">
            Iniciar sesión
          </Link>
          <Link
            href="/onboarding"
            className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-700"
          >
            Crear mi estudio
          </Link>
        </div>
      </div>
    </header>
  );
}
