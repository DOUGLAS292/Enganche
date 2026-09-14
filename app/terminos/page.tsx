import Link from "next/link";

export const metadata = { title: "Términos y condiciones — Enganche" };

export default function TerminosPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" style={{ color: "var(--color-azul-suave)", fontSize: 13 }}>
        ← Inicio
      </Link>

      <h1 style={{ fontSize: 24, marginTop: 14 }}>Términos y condiciones</h1>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Última actualización: septiembre de 2026 · Versión piloto</p>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
        <Clausula titulo="1. Qué es Enganche">
          Enganche es una plataforma que conecta a personas, talleres y empresas que necesitan
          producción o instalación de sistemas de aluminio y vidrio, con quienes ofrecen ese
          servicio. Enganche es un intermediario tecnológico: no fabrica, no instala, no
          transporta ni entrega los sistemas de aluminio y vidrio, y no es parte del acuerdo
          comercial que se cierra entre el autor de la oferta y la persona elegida.
        </Clausula>

        <Clausula titulo="2. Quién responde por el trabajo">
          La calidad, los materiales, los tiempos de entrega, la instalación y cualquier garantía
          sobre el trabajo son responsabilidad exclusiva de quien lo ejecuta y de quien lo
          contrató, según lo que acuerden entre ellos. Enganche no garantiza el resultado del
          trabajo ni verifica en persona la idoneidad técnica, financiera o legal de los usuarios,
          más allá de la información que ellos mismos registran en la plataforma.
        </Clausula>

        <Clausula titulo="3. Pagos entre las partes">
          El valor del trabajo se acuerda y se paga directamente entre el autor de la oferta y la
          persona elegida, por fuera de la plataforma. Enganche no procesa ni custodia esos
          pagos. Enganche únicamente cobra una comisión propia por el uso de la plataforma
          (ver cláusula 4), que es independiente del pago del trabajo entre las partes.
        </Clausula>

        <Clausula titulo="4. Comisión de la plataforma">
          Durante el periodo de arranque en una ciudad nueva, el uso de Enganche es gratuito.
          Pasado ese periodo, cada trabajo marcado como completado genera una comisión a favor
          de Enganche, calculada sobre el valor ofertado, que es responsabilidad de la persona
          elegida para el trabajo. Las condiciones vigentes de esta comisión se muestran dentro
          de la plataforma en el momento de cerrar cada trabajo.
        </Clausula>

        <Clausula titulo="5. Veracidad de la información">
          Cada usuario es responsable de que los datos que registra (identidad, ubicación,
          experiencia, valores ofertados, fotos, descripciones) sean ciertos. Enganche puede
          suspender o eliminar cuentas que registren información falsa, que incumplan
          reiteradamente lo acordado con otros usuarios, o que usen la plataforma para fines
          distintos a los que fue diseñada.
        </Clausula>

        <Clausula titulo="6. Calificaciones y garantías">
          Al completar un trabajo, ambas partes pueden calificarse mutuamente y, dentro de los 30
          días siguientes, reportar un problema de garantía. Estas calificaciones y reportes son
          insumos de confianza para la comunidad; Enganche no media ni decide disputas entre las
          partes, y no reemplaza los mecanismos legales que cada usuario pueda ejercer por su
          cuenta.
        </Clausula>

        <Clausula titulo="7. Tratamiento de datos personales">
          Los datos personales que registras (celular, nombre o razón social, documento,
          ubicación) se usan únicamente para operar la plataforma: verificar tu identidad,
          mostrarte ofertas cercanas, y permitir el contacto entre las partes de un trabajo
          elegido. Conforme a la Ley 1581 de 2012 y sus decretos reglamentarios (habeas data en
          Colombia), puedes solicitar en cualquier momento la consulta, corrección o eliminación
          de tus datos escribiendo a través de los canales de contacto de Enganche.
        </Clausula>

        <Clausula titulo="8. Cambios a estos términos">
          Como este es un producto en fase piloto, estos términos pueden ajustarse a medida que
          la plataforma crece. Si hay cambios importantes, se avisará dentro de la aplicación.
        </Clausula>

        <Clausula titulo="9. Aceptación">
          Al marcar la casilla de aceptación durante el registro, confirmas que leíste y aceptas
          estos términos y condiciones para poder usar Enganche.
        </Clausula>
      </div>
    </main>
  );
}

function Clausula({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 14, color: "#eef2f5", margin: "0 0 4px" }}>{titulo}</h2>
      <p style={{ margin: 0 }}>{children}</p>
    </section>
  );
}
