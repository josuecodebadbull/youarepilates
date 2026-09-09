import Link from "next/link";

import { SiteHeader } from "@/components/marketing/SiteHeader";

const features = [
  {
    title: "Cero sobreventa",
    description:
      "Transacciones atómicas en Firestore garantizan que una cama de reformer nunca se asigne a dos alumnos a la vez.",
  },
  {
    title: "Multi-sede, multi-marca",
    description:
      "Cada estudio aísla su información y su marca. Administra varias sucursales desde un solo panel.",
  },
  {
    title: "App instalable para tus alumnos",
    description:
      "PWA instalable en iOS y Android sin pasar por las tiendas de apps, con check-in por código y funcionamiento offline.",
  },
  {
    title: "Créditos y paquetes",
    description:
      "Vende paquetes de clases con vigencia configurable. El sistema descuenta y reembolsa créditos automáticamente.",
  },
  {
    title: "Lista de espera automática",
    description:
      "Si una clase se llena, el siguiente alumno en la fila entra solo en cuanto alguien cancela a tiempo.",
  },
  {
    title: "Tu marca, no la nuestra",
    description:
      "Logo y colores de tu estudio en el panel y en la app de tus alumnos desde el primer día.",
  },
];

const steps = [
  {
    number: "1",
    title: "Crea tu estudio",
    description: "Regístrate y en menos de un minuto tienes tu panel de administración listo.",
  },
  {
    number: "2",
    title: "Configura sedes y horarios",
    description: "Agrega tus sucursales, tipos de clase, instructores y paquetes de créditos.",
  },
  {
    number: "3",
    title: "Comparte el link con tus alumnos",
    description:
      "Cada estudio tiene su propia app de reservas — instalable, con su marca, lista para compartir por WhatsApp.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Software para estudios de Pilates
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Gestiona tu estudio de Pilates sin hojas de cálculo ni WhatsApp
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          Agendas, aforos de Reformer, paquetes de créditos y una app de reservas
          para tus alumnos. Todo en una sola plataforma pensada para Pilates, no
          para un gimnasio genérico.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Crear mi estudio gratis
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-gray-50"
          >
            Ya tengo una cuenta
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Sin tarjeta de crédito para empezar. Configura tu estudio en minutos.
        </p>
      </section>

      <section id="funciones" className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-24">
        <h2 className="text-center text-2xl font-semibold text-ink">
          Hecho para Pilates, no adaptado de un gimnasio
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold text-ink">Cómo funciona</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center sm:text-left">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold text-ink">
          ¿Listo para dejar el WhatsApp y las hojas de cálculo?
        </h2>
        <p className="mt-4 text-ink-soft">
          Crea tu estudio gratis y prueba el panel completo hoy mismo.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-block rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Crear mi estudio gratis
        </Link>
      </section>

      <footer className="border-t border-gray-200 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm text-ink-soft sm:flex-row">
          <span>© {new Date().getFullYear()} YouArePilates</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-ink">
              Iniciar sesión
            </Link>
            <Link href="/onboarding" className="hover:text-ink">
              Crear estudio
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
