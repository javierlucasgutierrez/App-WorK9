import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";
import { getSession, homeFor } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  return (
    <AuthShell title="Entrar">
      <ActionForm action={login}>
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton>Entrar</SubmitButton>
      </ActionForm>
      <p className="muted mt-5 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="link">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
