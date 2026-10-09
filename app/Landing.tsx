import Link from "next/link";
import { formatCOP } from "@/lib/format";
import { valorUrgenteVigente } from "@/lib/pagos/precioUrgente";
import InstalarApp from "./InstalarApp";

// Página de presentación para quien todavía no ha iniciado sesión.
// Todo el contenido refleja las reglas reales de la plataforma
// (comisión 3% solo al ejecutor, 30 días sin comisión desde el primer
// trabajo completado, precio fijo sin regateo, Urgente con aviso por
// WhatsApp a 10 km). Si una regla cambia en el código, actualizar aquí.

const ESPECIALIDADES = [
  "Ventanería",
  "Puertas",
  "Fachadas",
  "Divisiones de baño",
  "Vitrinas",
  "Producción",
  "Instalación",
];

const PASOS = [
  { n: "01", t: "Publica", d: "Qué necesitas, cantidad, plazo y el valor que pagas." },
  { n: "02", t: "Recibe postulaciones", d: "Se postulan quienes aceptan tu valor, los más cercanos primero." },
  { n: "03", t: "Elige y coordina", d: "Revisa historial y calificaciones. Los celulares se revelan en el chat al elegir." },
  { n: "04", t: "Completa y califica", d: "Ambos se califican. Tu reputación crece con cada trabajo." },
];

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...trazo} strokeWidth={2.6}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export default function Landing() {
  const precioUrgente = formatCOP(valorUrgenteVigente());

  return (
    <div className="landing">
      <header className="landing__barra">
        <Link href="/" className="landing__marca">
          Enganche<span>.</span>
        </Link>
        <Link href="/entrar" className="landing__entrar">
          Entrar
        </Link>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="landing__hero">
        <div className="landing__hero-texto">
          <span className="chip-tecnico">Sistemas de aluminio y vidrio · Colombia</span>
          <h1 className="landing__titulo">
            Todo el gremio del aluminio y vidrio, <em>enganchado.</em>
          </h1>
          <p className="landing__bajada">
            Publica lo que necesitas producir o instalar, con tu precio. Talleres, empresas e independientes
            cerca de ti se postulan. Tú eliges con quién trabajar.
          </p>
          <div className="landing__ctas">
            <Link href="/entrar" className="landing__cta">
              Entrar gratis
              <svg width="22" height="22" viewBox="0 0 24 24" {...trazo} strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a href="#como" className="landing__cta-sec">
              Cómo funciona
            </a>
          </div>
          <ul className="landing__confianza">
            <li>Solo tu celular, sin contraseñas</li>
            <li>Tu número oculto hasta elegir</li>
            <li>Todo Colombia</li>
          </ul>
          <InstalarApp />
        </div>

        <div className="landing__telefono" aria-label="Ejemplo de cómo se ve una oferta en Enganche">
          <div className="landing__pantalla">
            <p className="landing__pantalla-titulo">Ofertas cerca</p>
            <p className="landing__ejemplo">Ejemplo</p>
            <div className="landing__oferta landing__oferta--urgente">
              <div className="landing__insignias">
                <span className="landing__insignia landing__insignia--urgente">Urgente</span>
                <span className="landing__insignia">Instalación</span>
              </div>
              <p className="landing__oferta-t">12 ventanas corredizas · conjunto VIS</p>
              <p className="landing__oferta-d">Jamundí · 4,2 km · entrega 8 días</p>
              <div className="landing__oferta-pie">
                <span className="landing__valor">$4.800.000</span>
                <span className="landing__postular">Postularme</span>
              </div>
            </div>
            <div className="landing__oferta">
              <div className="landing__insignias">
                <span className="landing__insignia">Producción</span>
                <span className="landing__insignia landing__insignia--nivel">Nivel 2</span>
              </div>
              <p className="landing__oferta-t">40 m² ventanería Línea Superior</p>
              <p className="landing__oferta-d">Palmira · 9,8 km · entrega 15 días</p>
              <div className="landing__oferta-pie">
                <span className="landing__valor">$9.600.000</span>
                <span className="landing__postular">Postularme</span>
              </div>
            </div>
          </div>
          <div className="landing__flotante landing__flotante--a">
            <strong>Nueva postulación</strong>
            <span>Un taller cercano se postuló a tu oferta</span>
          </div>
          <div className="landing__flotante landing__flotante--b">
            <strong>⚡ Oferta Urgente</strong>
            <span>Aviso por WhatsApp a ejecutores cerca de tu obra</span>
          </div>
        </div>
      </section>

      {/* ---------- FRANJA ---------- */}
      <div className="landing__franja" aria-hidden="true">
        <div className="landing__franja-pista">
          {[...ESPECIALIDADES, ...ESPECIALIDADES].map((e, i) => (
            <span key={i}>
              {e.toUpperCase()} <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <section id="como" className="landing__seccion">
        <h2 className="landing__h2">De la oferta al trabajo cerrado</h2>
        <p className="landing__p">
          Lo que hoy se pierde en grupos de WhatsApp y Facebook, ahora con orden, historial y confianza.
        </p>
        <div className="landing__pasos">
          {PASOS.map((p) => (
            <div key={p.n} className="landing__paso">
              <span className="landing__paso-n">{p.n}</span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
          <div className="landing__paso landing__paso--oscuro">
            <span className="landing__paso-n">30</span>
            <h3>Días de garantía</h3>
            <p>Si aparece un problema, se reporta desde el chat. Quien responde por su trabajo gana reputación.</p>
          </div>
        </div>
      </section>

      {/* ---------- PARA QUIÉN ---------- */}
      <section className="landing__seccion">
        <h2 className="landing__h2">
          Tres formas de <span className="landing__azul">engancharte</span>
        </h2>
        <div className="landing__perfiles">
          <div className="landing__perfil">
            <div className="landing__perfil-vidrio" />
            <h3>Talleres</h3>
            <p>Llena tu planta con trabajos de producción y consigue instaladores cuando la obra aprieta.</p>
          </div>
          <div className="landing__perfil">
            <div className="landing__perfil-vidrio landing__perfil-vidrio--b" />
            <h3>Empresas y constructoras</h3>
            <p>Publica tu obra con tu presupuesto y elige entre postulantes con historial visible.</p>
          </div>
          <div className="landing__perfil">
            <div className="landing__perfil-vidrio landing__perfil-vidrio--c" />
            <h3>Independientes</h3>
            <p>Instaladores, vidrieros y aluminieros: postúlate a trabajos cerca y construye tu reputación.</p>
          </div>
        </div>
      </section>

      {/* ---------- PRECIO FIJO + NIVELES ---------- */}
      <section className="landing__seccion">
        <div className="landing__precio">
          <div>
            <span className="landing__kicker">SIN REGATEO</span>
            <h2 className="landing__h2 landing__h2--claro">Tú pones el precio.</h2>
            <p className="landing__p landing__p--claro">
              Quien publica define el valor. Los postulantes lo aceptan o no: nadie compite bajando precios.
            </p>
          </div>
          <div className="landing__niveles">
            <p className="landing__niveles-t">CADA OFERTA LLEVA SU NIVEL</p>
            <div className="landing__nivel">
              <b>1</b>
              <span>
                <strong>Tradicional</strong>La línea de siempre, la de mayor volumen del gremio.
              </span>
            </div>
            <div className="landing__nivel">
              <b>2</b>
              <span>
                <strong>Superior / Universal</strong>Líneas de gama media, más técnicas.
              </span>
            </div>
            <div className="landing__nivel landing__nivel--acento">
              <b>3</b>
              <span>
                <strong>Especializada</strong>Alta gama, institucional y fachadas especiales.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- COBRO ---------- */}
      <section className="landing__seccion">
        <h2 className="landing__h2 landing__centro">Solo pagas si trabajas</h2>
        <p className="landing__p landing__centro">Registrarte, publicar y postularte no cuesta nada.</p>
        <div className="landing__cobros">
          <div className="landing__cobro">
            <p className="landing__cobro-t">Usar Enganche</p>
            <p className="landing__cobro-v">$0</p>
            <ul>
              <li><Check />Crear tu perfil</li>
              <li><Check />Publicar ofertas</li>
              <li><Check />Postularte y chatear</li>
            </ul>
          </div>
          <div className="landing__cobro landing__cobro--oscuro">
            <p className="landing__cobro-t">Comisión</p>
            <p className="landing__cobro-v landing__naranja">3%</p>
            <ul>
              <li><Check />Solo quien ejecuta el trabajo</li>
              <li><Check />Solo cuando se completa</li>
              <li><Check />Tus primeros 30 días desde tu primer trabajo, sin comisión</li>
              <li><Check />El pago del trabajo va directo entre ustedes</li>
            </ul>
          </div>
          <div className="landing__cobro landing__cobro--borde">
            <p className="landing__cobro-t">⚡ Urgente (opcional)</p>
            <p className="landing__cobro-v">{precioUrgente}</p>
            <ul>
              <li><Check />Aviso inmediato por WhatsApp</li>
              <li><Check />A ejecutores cerca de tu obra</li>
              <li><Check />Insignia Urgente en tu oferta</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="landing__seccion">
        <div className="landing__final">
          <h2>Engánchate hoy. Es gratis.</h2>
          <p>Solo necesitas tu celular. Te llega un código y listo: sin contraseñas, sin complicaciones.</p>
          <Link href="/entrar" className="landing__cta landing__cta--oscuro">
            Entrar gratis
          </Link>
        </div>
      </section>

      <footer className="landing__pie">
        <p className="landing__marca">
          Enganche<span>.</span>
        </p>
        <p>
          <a href="mailto:Enganche.App.Contacto@gmail.com">Enganche.App.Contacto@gmail.com</a>
        </p>
        <p>
          <Link href="/terminos">Términos y condiciones</Link> · <Link href="/privacidad">Política de privacidad</Link>
        </p>
      </footer>
    </div>
  );
}
