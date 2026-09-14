import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import ChatClient from "./ChatClient";

type Fila = {
  autor_id: string;
  ganador_id: string | null;
  sistema_o_proyecto: string;
  autor_nombre: string;
  ganador_nombre: string | null;
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const { id } = await params;
  const result = await query<Fila>(
    `select
       p.autor_id, p.ganador_id, p.sistema_o_proyecto,
       autor.nombre_razon_social as autor_nombre,
       ganador.nombre_razon_social as ganador_nombre
     from publicaciones p
     join usuarios autor on autor.id = p.autor_id
     left join usuarios ganador on ganador.id = p.ganador_id
     where p.id = $1`,
    [id]
  );

  const fila = result.rows[0];
  if (!fila || !fila.ganador_id) {
    notFound();
  }
  if (usuarioId !== fila.autor_id && usuarioId !== fila.ganador_id) {
    redirect(`/publicaciones/${id}`);
  }

  const esAutor = usuarioId === fila.autor_id;
  const nombreContraparte = esAutor ? (fila.ganador_nombre as string) : fila.autor_nombre;

  return <ChatClient publicacionId={id} titulo={fila.sistema_o_proyecto} miId={usuarioId} nombreContraparte={nombreContraparte} />;
}
