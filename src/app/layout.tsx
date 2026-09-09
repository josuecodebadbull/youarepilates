import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YouArePilates — Software para estudios de Pilates",
  description:
    "Plataforma SaaS para estudios de Pilates: agendas, aforos de reformer, créditos y reservas en línea.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
