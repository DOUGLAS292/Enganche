"use client";

import { useEffect, useState } from "react";

// Botón para instalar Enganche como app en el celular (PWA).
// - Android / Chrome: usa el aviso nativo "beforeinstallprompt".
// - iPhone / Safari: no existe ese aviso, así que se muestran los pasos
//   (Compartir → "Agregar a inicio").
// - Si ya está instalada (se abrió como app), no se muestra nada.

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstalarApp({ variante = "claro" }: { variante?: "claro" | "oscuro" }) {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [esIOS, setEsIOS] = useState(false);
  const [instalada, setInstalada] = useState(true);
  const [verPasosIOS, setVerPasosIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalada(standalone);

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    setEsIOS(ios);

    const alPedir = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    };
    const alInstalar = () => {
      setInstalada(true);
      setEvento(null);
    };
    window.addEventListener("beforeinstallprompt", alPedir);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPedir);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (instalada) return null;
  if (!evento && !esIOS) return null;

  const oscuro = variante === "oscuro";

  async function instalar() {
    if (evento) {
      await evento.prompt();
      const eleccion = await evento.userChoice;
      if (eleccion.outcome === "accepted") setInstalada(true);
      setEvento(null);
    } else if (esIOS) {
      setVerPasosIOS((v) => !v);
    }
  }

  return (
    <div className={`instalar-app${oscuro ? " instalar-app--oscuro" : ""}`}>
      <button type="button" onClick={instalar} className="instalar-app__boton">
        <span aria-hidden="true" className="instalar-app__icono">⬇</span>
        <span>
          <span className="instalar-app__titulo">Instala Enganche en tu celular</span>
          <span className="instalar-app__sub">Ábrela como una app, sin tienda y sin ocupar espacio</span>
        </span>
      </button>
      {esIOS && verPasosIOS && (
        <ol className="instalar-app__pasos">
          <li>
            Toca el botón <strong>Compartir</strong> de Safari (el cuadro con la flecha hacia arriba).
          </li>
          <li>
            Elige <strong>&ldquo;Agregar a inicio&rdquo;</strong>.
          </li>
          <li>
            Toca <strong>Agregar</strong>. Enganche quedará en tu pantalla como una app.
          </li>
        </ol>
      )}
    </div>
  );
}
