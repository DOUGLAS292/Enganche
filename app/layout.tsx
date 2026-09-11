import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enganche",
  description:
    "Marketplace de demanda para producción e instalación de sistemas de aluminio y vidrio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
