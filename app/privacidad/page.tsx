import Link from "next/link";

export const metadata = { title: "Política de privacidad — Enganche" };

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>

      <h1 className="titular" style={{ fontSize: 26, marginTop: 14, fontWeight: 700 }}>Política de privacidad</h1>
      <p style={{ color: "var(--color-mist)", fontSize: 13 }}>Última actualización: septiembre de 2026</p>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
        <Clausula titulo="1. Alcance de esta política">
          Esta política aplica al uso de la aplicación web y móvil Enganche, disponible en enganche.vercel.app
          y, próximamente, en Google Play Store. Describe qué datos personales recopilamos, para qué los
          usamos, con quién los compartimos y qué derechos tiene cada usuario sobre su información.
        </Clausula>

        <Clausula titulo="2. Qué datos recopilamos">
          Número de celular (identificador de la cuenta e inicio de sesión sin contraseñas), nombre o razón
          social, ciudad, ubicación geográfica exacta (opcional, solo si la compartes al publicar), documento
          de identidad o NIT (opcional), la información de las ofertas que publicas, los mensajes de chat con
          la otra parte de un trabajo, y las calificaciones y reportes de garantía que registras o recibes.
          Enganche no solicita ni almacena contraseñas: el acceso se hace con un código de un solo uso enviado
          por WhatsApp.
        </Clausula>

        <Clausula titulo="3. Para qué usamos estos datos">
          Verificar tu identidad e iniciar sesión, mostrarte ofertas cercanas, permitir el contacto entre las
          partes de un trabajo elegido, calcular la comisión de la plataforma cuando corresponde, construir tu
          historial de reputación visible para otros usuarios, y prevenir fraude o uso indebido de la
          plataforma.
        </Clausula>

        <Clausula titulo="4. Con quién compartimos los datos">
          No vendemos ni alquilamos datos personales. Dentro de la app, otros usuarios ven tu nombre, ciudad,
          calificación y trabajos completados — nunca tu celular, ni siquiera en el chat. Compartimos datos
          con los proveedores que operan la infraestructura de la plataforma (hosting, base de datos, y el
          envío de códigos de verificación cuando esté activo), y con autoridades solo ante un requerimiento
          legal válido.
        </Clausula>

        <Clausula titulo="5. Seguridad de la información">
          La información viaja cifrada (HTTPS). El acceso a tu cuenta se protege con sesiones firmadas
          digitalmente y códigos de verificación de un solo uso, con expiración de 5 minutos y límite de
          intentos.
        </Clausula>

        <Clausula titulo="6. Tus derechos (Habeas Data)">
          Conforme a la Ley 1581 de 2012 y sus decretos reglamentarios (protección de datos personales en
          Colombia), puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización
          otorgada; ser informado del uso dado a tus datos; solicitar su eliminación cuando no exista un deber
          legal de conservarlos; y revocar tu autorización en cualquier momento, escribiendo a{" "}
          <a href="mailto:contacto.enganche@gmail.com" style={{ color: "var(--color-azul-suave)" }}>
            contacto.enganche@gmail.com
          </a>
          .
        </Clausula>

        <Clausula titulo="7. Conservación de los datos">
          Conservamos tus datos mientras tu cuenta esté activa. Si solicitas eliminar tu cuenta, tus datos
          personales se eliminan o anonimizan, salvo la información que debamos conservar por obligación legal
          o contable (por ejemplo, comisiones ya cobradas).
        </Clausula>

        <Clausula titulo="8. Menores de edad">
          Enganche está dirigido a personas mayores de 18 años. No está diseñado para menores de edad y no
          recopilamos intencionalmente sus datos.
        </Clausula>

        <Clausula titulo="9. Cambios a esta política">
          Como Enganche está en fase piloto, esta política puede actualizarse a medida que la plataforma
          evoluciona. Los cambios relevantes se anunciarán dentro de la aplicación.
        </Clausula>

        <Clausula titulo="10. Contacto">
          Para preguntas sobre esta política o para ejercer tus derechos de Habeas Data, escribe a{" "}
          <a href="mailto:contacto.enganche@gmail.com" style={{ color: "var(--color-azul-suave)" }}>
            contacto.enganche@gmail.com
          </a>
          .
        </Clausula>
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: "var(--color-mist-tenue)" }}>
        Enganche es operado por La Ventanería Ingeniería y Diseño S.A.S., NIT 901.593.033-5, empresa colombiana
        responsable del tratamiento de datos descrito en esta política.
      </p>
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
