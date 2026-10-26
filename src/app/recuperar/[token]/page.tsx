import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";
import { checkToken } from "@/lib/tokens";

export const metadata = { title: "Contraseña nueva" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await checkToken(token, "RESET_PASSWORD"))) {
    return (
      <AuthShell title="Enlace caducado" intro="Este enlace ya se ha usado o ha caducado (dura 1 hora).">
        <Link href="/recuperar" className="btn w-full">
          Pedir otro enlace
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Elige una contraseña nueva">
      <ActionForm action={resetPassword.bind(null, token)}>
        <Field label="Contraseña nueva (mínimo 8 caracteres)" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Field label="Repite la contraseña" name="password2" type="password" autoComplete="new-password" required minLength={8} />
        <SubmitButton>Guardar y entrar</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
