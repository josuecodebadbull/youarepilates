import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
