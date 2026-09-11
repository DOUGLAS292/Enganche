import { redirect } from "next/navigation";
import { obtenerTelefonoVerificado } from "@/lib/auth/session";
import RegistroForm from "./RegistroForm";

export default async function RegistroPage() {
  const celular = await obtenerTelefonoVerificado();
  if (!celular) {
    redirect("/entrar");
  }
  return <RegistroForm celular={celular} />;
}
