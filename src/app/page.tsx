import Link from "next/link";
import {
  Armchair,
  Building2,
  CalendarDays,
  CreditCard,
  FileCheck,
  Filter,
  LayoutDashboard,
  Link2,
  MapPin,
  Palette,
  Smartphone,
  UserPlus,
} from "lucide-react";

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

const ownerSteps = [
  {
    icon: Building2,
    title: "Crea tu estudio",
    description:
      "Regístrate con tu correo y en menos de un minuto tienes tu panel de administración listo, con el link único de reservas de tu estudio.",
  },
  {
    icon: LayoutDashboard,
    title: "Arma tu catálogo",
    description:
      "Agrega tus sedes y salas (con el número exacto de camas o lugares de cada una), tus tipos de clase, tus instructores y tus paquetes de créditos.",
  },
  {
    icon: CalendarDays,
    title: "Programa tus horarios",
    description:
      "Calendario visual por semana o por lista: crea una clase con un clic desde el propio calendario, y el sistema no te deja programar dos clases encimadas en la misma sala.",
  },
  {
    icon: Palette,
    title: "Personaliza tu presencia",
    description:
      "Tu logo y colores, la descripción y foto de tu estudio, tus redes, tus políticas y tu carta responsiva — todo con tu marca, no la nuestra.",
  },
  {
    icon: Link2,
    title: "Comparte tu link",
    description:
      "Cada estudio tiene su propia app de reservas, instalable en el celular sin pasar por tiendas de apps. Cópiala desde el panel y compártela por WhatsApp.",
  },
  {
    icon: CreditCard,
    title: "Opera el día a día",
    description:
      "Alumnos y sus créditos, pagos pendientes por confirmar, y un resumen de tu estudio en vivo — todo desde el mismo panel.",
  },
];

const studentSteps = [
  {
    icon: UserPlus,
    title: "Entran a tu link",
    description:
      "Nada de tiendas de apps: crean su cuenta y pueden instalar la app directo en su celular como cualquier otra.",
  },
  {
    icon: Filter,
    title: "Exploran el horario",
    description: "Ven las clases disponibles en vista semana o mes, y filtran por nivel o por instructor.",
  },
  {
    icon: Armchair,
    title: "Reservan su lugar",
    description:
      "Eligen su cama o reformer específico, o dejan que el sistema se los asigne. Si la clase está llena, entran a una lista de espera automática.",
  },
  {
    icon: FileCheck,
    title: "Firman una vez",
    description:
      "Antes de su primera clase firman tu carta responsiva desde su perfil — queda un registro con su nombre, versión y fecha de firma.",
  },
  {
    icon: CreditCard,
    title: "Compran sus créditos",
    description:
      "Ven todos tus paquetes con precio en la sección Precios y piden comprarlo; tú confirmas el pago cuando llega y sus créditos se activan solos.",
  },
  {
    icon: MapPin,
    title: "Todo en su perfil",
    description:
      "Su próxima clase, su historial, sus créditos vigentes, y la información de tu estudio — dirección, mapa y cómo llegar incluidos.",
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
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
            Dos experiencias completas, ya armadas: tu panel de administración y la app
            que usan tus alumnos para reservar.
          </p>

          <div className="mt-14 grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Tú, como dueño del estudio
                </span>
              </div>
              <ol className="mt-6 space-y-6">
                {ownerSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                        <step.icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      {i < ownerSteps.length - 1 && <span className="mt-2 w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-2">
                      <h3 className="font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Tus alumnos, en su app
                </span>
              </div>
              <ol className="mt-6 space-y-6">
                {studentSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                        <step.icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      {i < studentSteps.length - 1 && <span className="mt-2 w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-2">
                      <h3 className="font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-14 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-ink-soft">
            <Smartphone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Ambas experiencias son instalables como app en el celular — nada que
            descargar de una tienda de apps.
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
