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

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Software para estudios de Pilates
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Gestiona tu estudio de Pilates sin hojas de cálculo ni WhatsApp
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Agendas, aforos de Reformer, paquetes de créditos y una app de reservas
          para tus alumnos. Todo en una sola plataforma pensada para Pilates, no
          para un gimnasio genérico.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Crear mi estudio gratis
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Ya tengo una cuenta
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Sin tarjeta de crédito para empezar. Configura tu estudio en minutos.
        </p>
      </section>

      <section id="funciones" className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-24">
        <h2 className="text-center text-2xl font-bold">Hecho para Pilates, no adaptado de un gimnasio</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold">Cómo funciona</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center sm:text-left">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-2xl font-bold">¿Listo para dejar el WhatsApp y las hojas de cálculo?</h2>
        <p className="mt-4 text-gray-600">
          Crea tu estudio gratis y prueba el panel completo hoy mismo.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Crear mi estudio gratis
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm text-gray-500 sm:flex-row">
          <span>© {new Date().getFullYear()} YouArePilates</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/onboarding" className="hover:text-gray-900">
              Crear estudio
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
