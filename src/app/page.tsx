import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Plus } from "lucide-react";

import { BrandMark, SiteHeader } from "@/components/marketing/SiteHeader";
import { BedPicker, HeroStage, HowItWorks } from "@/components/marketing/LandingInteractive";
import { InstallAdminButton } from "@/components/pwa/InstallAdminButton";

const promises = [
  { title: "Cero sobreventa", description: "Una cama, un alumno. Siempre." },
  { title: "Lista de espera sola", description: "Se llena el hueco en cuanto alguien cancela." },
  { title: "Sin tiendas de apps", description: "Tu app de reservas vive en un link." },
];

const studentPerks = [
  { title: "Eligen su cama", description: "Ven el mapa de la sala y apartan su lugar favorito." },
  { title: "Pagan como quieran", description: "Piden su paquete y tú confirmas el pago en mostrador." },
  { title: "Firman en línea", description: "La responsiva queda registrada con fecha y versión." },
  { title: "Llegan sin perderse", description: "Dirección, mapa y teléfono de cada sede." },
];

const eyebrow = "text-[13px] font-bold uppercase tracking-[0.08em] text-brand-700";
const h2 = "text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink [text-wrap:balance] md:text-[42px] lg:text-[52px]";
const section = "mx-auto max-w-[1200px] scroll-mt-20 px-5 pt-[72px] lg:pt-28";
const cell = "flex min-w-0 flex-col gap-2.5 rounded-[26px] bg-[#F1EFEA] p-6 min-h-[240px]";
const cellTitle = "text-[22px] font-semibold tracking-[-0.01em] text-ink";
const cellText = "text-sm leading-normal text-ink-soft";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <SiteHeader />

      <section className="mx-auto max-w-[1200px] px-5">
        <div className="flex flex-col items-center gap-5 pb-10 pt-14 text-center lg:pb-14 lg:pt-[88px]">
          <span className="flex h-[34px] items-center gap-2 rounded-full border border-ink/[0.08] bg-white pl-1.5 pr-3.5 text-[13px] font-semibold text-brand-800">
            <span className="flex h-6 items-center rounded-full bg-brand-50 px-[9px] text-xs">Nuevo</span>
            Software para estudios de Pilates
          </span>
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] text-ink [text-wrap:balance] md:text-[64px] lg:text-[84px]">
            Llena tus reformers,
            <br />
            no tu WhatsApp.
          </h1>
          <p className="mx-auto max-w-[620px] text-[17px] leading-[1.55] text-ink-soft [text-wrap:pretty] lg:text-xl">
            Agendas, aforo por cama, paquetes de créditos y una app de reservas con tu marca. Pensado para Pilates, no
            para un gimnasio genérico.
          </p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/onboarding"
              className="flex h-[54px] items-center gap-2.5 rounded-full bg-brand-700 px-[26px] text-base font-semibold text-white shadow-[0_10px_24px_-10px_rgba(26,89,78,0.6)] hover:bg-brand-800"
            >
              Crear mi estudio gratis
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>
            <a
              href="#como-funciona"
              className="flex h-[54px] items-center rounded-full border border-ink/[0.14] bg-white px-6 text-base font-semibold text-ink hover:bg-[#F7F6F3]"
            >
              Ver cómo funciona
            </a>
          </div>
          <span className="text-[13px] text-ink-faint">Sin tarjeta de crédito · Tu estudio listo en minutos</span>
        </div>

        <HeroStage />
      </section>

      <section className={section}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px overflow-hidden rounded-3xl border border-ink/[0.08] bg-ink/[0.08]">
          {promises.map((p) => (
            <div key={p.title} className="flex flex-col gap-1.5 bg-canvas p-6">
              <span className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">{p.title}</span>
              <span className="text-sm leading-normal text-ink-soft">{p.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="funciones" className={section}>
        <div className="mb-8 flex max-w-[720px] flex-col gap-3">
          <span className={eyebrow}>Funciones</span>
          <h2 className={h2}>Hecho para Pilates, no adaptado de un gimnasio.</h2>
        </div>
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
          <div className={`${cell} min-h-[420px] gap-6 !bg-ink md:col-span-2 lg:row-span-2 lg:min-h-[494px]`}>
            <div className="flex max-w-[420px] flex-col gap-2">
              <h3 className="text-[28px] font-semibold tracking-[-0.01em] text-white">Cero sobreventa</h3>
              <p className="text-[15px] leading-[1.55] text-white/75">
                Cada alumno elige su cama y nunca se asigna a dos personas, ni aunque reserven en el mismo segundo.
              </p>
            </div>
            <BedPicker />
          </div>

          <div className={`${cell} !bg-brand-50 lg:col-span-2`}>
            <div className="flex flex-col gap-2">
              <h3 className={`${cellTitle} text-2xl`}>Lista de espera automática</h3>
              <p className={cellText}>Si alguien cancela a tiempo, la siguiente persona entra sola. Tú no mueves un dedo.</p>
            </div>
            <div className="mt-auto flex flex-col gap-2" aria-hidden>
              <div className="flex items-center justify-between rounded-[14px] bg-white px-3.5 py-3 text-[13px]">
                <span className="font-bold">19:00 Reformer Intermedio</span>
                <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">8/8</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-2.5 text-[13px] text-ink-soft">
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                  1
                </span>
                Renata V. · en espera
              </div>
              <div className="flex items-center gap-2.5 rounded-[14px] bg-ink px-3.5 py-3 text-[13px] font-semibold text-white">
                <Check className="h-4 w-4 shrink-0 text-brand-300" strokeWidth={2.4} />
                Daniela canceló · Renata entró a la clase
              </div>
            </div>
          </div>

          <div className={cell}>
            <div className="flex flex-col gap-2">
              <h3 className={`${cellTitle} text-2xl`}>Créditos y paquetes</h3>
              <p className={cellText}>Vende paquetes con vigencia. Los créditos se descuentan y se devuelven solos.</p>
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 rounded-[18px] bg-brand-700 p-4 text-white" aria-hidden>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-200">Créditos</span>
                <span className="font-display text-[40px] font-semibold leading-none">6</span>
              </div>
              <span className="text-right text-xs text-white/80">
                8 clases · $1,450
                <br />
                Vencen 12 oct
              </span>
            </div>
          </div>

          <div className={cell}>
            <h3 className={cellTitle}>App sin tiendas</h3>
            <p className={cellText}>Tus alumnos la instalan en iOS o Android desde tu link, y su pase funciona sin conexión.</p>
            <span className="mt-auto flex h-[38px] items-center gap-2 self-start rounded-xl border border-ink/10 bg-white px-3.5 text-[13px] font-semibold text-ink">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Agregar a inicio
            </span>
          </div>

          <div className={cell}>
            <h3 className={cellTitle}>Multi-sede</h3>
            <p className={cellText}>Todas tus sucursales, salas y camas desde un solo panel.</p>
            <div className="mt-auto flex flex-col gap-1.5" aria-hidden>
              {[
                ["Condesa", "2 salas"],
                ["Del Valle", "1 sala"],
              ].map(([name, rooms]) => (
                <span key={name} className="flex h-9 items-center justify-between rounded-[10px] bg-white px-3 text-[13px] font-semibold">
                  {name}
                  <span className="font-medium text-ink-faint">{rooms}</span>
                </span>
              ))}
            </div>
          </div>

          <div className={`${cell} md:col-span-2`}>
            <h3 className={cellTitle}>Tu marca, no la nuestra</h3>
            <p className={cellText}>Tu logo y tus fotos en el panel y en la app de tus alumnos desde el primer día.</p>
            <div className="mt-auto flex h-16 items-center justify-center rounded-[14px] border border-ink/[0.06] bg-white">
              <Image
                src="/landing/logo-estudio.png"
                alt="Logo de un estudio"
                width={400}
                height={98}
                className="h-[34px] w-auto mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className={section}>
        <HowItWorks />
      </section>

      <section id="app-alumnos" className={section}>
        <div className="grid items-stretch gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <span className={eyebrow}>Para tus alumnos</span>
            <h2 className={h2}>Reservar su cama toma menos que mandar un mensaje.</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
              {studentPerks.map((k) => (
                <div key={k.title} className="flex flex-col gap-1 rounded-[18px] border border-ink/[0.08] bg-white p-4">
                  <span className="text-[15px] font-bold text-ink">{k.title}</span>
                  <span className="text-[13px] leading-normal text-ink-soft">{k.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[340px] overflow-hidden rounded-[28px] bg-[#EDEBE6]">
            <Image
              src="/landing/sala.png"
              alt="Sala de reformers"
              fill
              sizes="(min-width: 1024px) 540px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-[18px] bg-white/95 px-4 py-3.5" aria-hidden>
              <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[14px] bg-ink leading-none text-white">
                <span className="text-[10px] font-semibold opacity-70">MIÉ</span>
                <span className="text-base font-bold">23</span>
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">Reservaste la cama 4</span>
                <span className="text-xs text-ink-soft">08:00 · Reformer Intermedio · Mariana</span>
              </div>
              <Check className="h-5 w-5 shrink-0 text-brand-700" strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-[72px] lg:py-28">
        <div className="flex flex-col items-center gap-[18px] rounded-[28px] bg-brand-900 px-6 py-14 text-center lg:rounded-[36px] lg:px-10 lg:py-[88px]">
          <h2 className="max-w-[820px] text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-[44px] lg:text-[56px]">
            ¿List@ para dejar el WhatsApp y las hojas de cálculo?
          </h2>
          <p className="max-w-[520px] text-base leading-[1.55] text-white/75">
            Crea tu estudio gratis y prueba el panel completo hoy mismo.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link
              href="/onboarding"
              className="flex h-[54px] items-center gap-2.5 rounded-full bg-white px-[26px] text-base font-bold text-brand-900 hover:bg-brand-50"
            >
              Crear mi estudio gratis
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>
            <Link
              href="/login"
              className="flex h-[54px] items-center rounded-full border border-white/30 px-[22px] text-base font-semibold text-white hover:bg-white/10"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <span className="text-[13px] text-brand-300">Sin tarjeta de crédito para empezar</span>
        </div>
      </section>

      <footer className="border-t border-ink/[0.08]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-7 text-sm text-ink-soft">
          <span className="flex items-center gap-2.5">
            <BrandMark size={26} />© {new Date().getFullYear()} YouArePilates
          </span>
          <nav className="flex flex-wrap gap-5 font-medium">
            <InstallAdminButton className="hover:text-ink" showIcon={false}>
              Descargar la app del panel
            </InstallAdminButton>
            <Link href="/login" className="hover:text-ink">
              Iniciar sesión
            </Link>
            <Link href="/onboarding" className="hover:text-ink">
              Crear estudio
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
