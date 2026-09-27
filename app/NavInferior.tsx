"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegación inferior (estilo app) — solo para usuarios con sesión.
// Se oculta en pantallas donde estorba: el chat (tiene su propia caja de
// texto abajo), el ingreso/registro y el panel de administración.
const OCULTAR_EN = [/^\/entrar/, /^\/registro/, /^\/admin/, /^\/publicaciones\/[^/]+\/chat/];

type Item = { href: string; etiqueta: string; icono: React.ReactNode; activo: (p: string) => boolean };

const trazo = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ITEMS: Item[] = [
  {
    href: "/",
    etiqueta: "Inicio",
    activo: (p) => p === "/",
    icono: (
      <svg {...trazo}>
        <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/feed",
    etiqueta: "Ofertas",
    activo: (p) => p.startsWith("/feed"),
    icono: (
      <svg {...trazo}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
    ),
  },
  {
    href: "/mis-publicaciones",
    etiqueta: "Mis ofertas",
    activo: (p) => p.startsWith("/mis-publicaciones"),
    icono: (
      <svg {...trazo}>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
      </svg>
    ),
  },
  {
    href: "/postulaciones",
    etiqueta: "Postulado",
    activo: (p) => p.startsWith("/postulaciones"),
    icono: (
      <svg {...trazo}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
];

export default function NavInferior() {
  const pathname = usePathname() ?? "/";
  if (OCULTAR_EN.some((r) => r.test(pathname))) return null;

  const [inicio, ofertas, misOfertas, postulado] = ITEMS;

  const enlace = (it: Item) => (
    <Link
      key={it.href}
      href={it.href}
      className={`nav-inferior__item${it.activo(pathname) ? " es-activo" : ""}`}
      aria-current={it.activo(pathname) ? "page" : undefined}
    >
      {it.icono}
      <span>{it.etiqueta}</span>
    </Link>
  );

  return (
    <>
      <div className="nav-inferior__espacio" aria-hidden="true" />
      <nav className="nav-inferior" aria-label="Navegación principal">
        {enlace(inicio)}
        {enlace(ofertas)}
        <Link href="/publicar" className="nav-inferior__publicar" aria-label="Publicar una oferta">
          <svg {...trazo} width={28} height={28} strokeWidth={2.8}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        {enlace(misOfertas)}
        {enlace(postulado)}
      </nav>
    </>
  );
}
