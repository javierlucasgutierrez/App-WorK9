import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getSession, homeFor } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  return (
    <AuthShell title="Crear cuenta">
      <RegisterForm />
      <p className="muted mt-5 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="link">
          Entra
        </Link>
      </p>
    </AuthShell>
  );
}
