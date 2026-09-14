import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Gilroy es la tipografía oficial de La Ventanería (manual de identidad
// LV-MKT-001), pero no está disponible como fuente libre/CDN — el manual
// exige no sustituirla arbitrariamente en piezas oficiales de marca. Poppins
// se usa aquí como reemplazo temporal por ser geométrica y de peso similar;
// cuando Douglas entregue los archivos de Gilroy, se reemplaza por esa.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Enganche",
  description:
    "Marketplace de demanda para producción e instalación de sistemas de aluminio y vidrio.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#04253A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
