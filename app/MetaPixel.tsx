"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Píxel de Meta: le cuenta a Meta quién llega desde los anuncios y quién
// completa el registro, para que las campañas busquen más aluminieros y
// vidrieros parecidos. Sin NEXT_PUBLIC_META_PIXEL_ID no se carga nada.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const pixelValido = Boolean(PIXEL_ID && /^\d+$/.test(PIXEL_ID));

export default function MetaPixel() {
  const pathname = usePathname();
  const primeraCarga = useRef(true);

  useEffect(() => {
    // El script de inicialización ya envía el PageView de la primera página;
    // aquí solo se cuentan las navegaciones internas de la app.
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!pixelValido) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
    </Script>
  );
}
