import Link from "next/link";

const features = [
  {
    title: "Cero sobreventa",
    description:
      "Transacciones atómicas en Firestore garantizan que una cama de reformer nunca se asigne a dos alumnos a la vez.",
  },
  {
    title: "Multi-sede, multi-tenant",
    description:
      "Cada estudio aísla su información y su marca. Administra varias sucursales desde un solo panel.",
  },
  {
    title: "App instalable para tus alumnos",
    description:
      "PWA instalable en iOS y Android sin pasar por las tiendas de apps, con check-in por QR y funcionamiento offline.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Software para estudios de Pilates
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Gestiona tu estudio de Pilates sin hojas de cálculo ni WhatsApp
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Agendas, aforos de Reformer, paquetes de créditos y una app de reservas
          para tus alumnos. Todo en una sola plataforma.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Crear mi estudio gratis
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Ya tengo una cuenta
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
