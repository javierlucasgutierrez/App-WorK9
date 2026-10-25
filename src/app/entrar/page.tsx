import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";
import { getUser, safeBack } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const back = safeBack((await searchParams).volver);
  if (await getUser()) redirect(back);

  return (
    <AuthShell title="Entrar" intro="Entra para publicar anuncios y contactar con otros socios.">
      <ActionForm action={login}>
        <input type="hidden" name="volver" value={back} />
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      </ActionForm>
      <p className="muted mt-5 text-center">
        ¿Aún no eres socio?{" "}
        <Link href={`/registro?volver=${encodeURIComponent(back)}`} className="link">
          Crea tu cuenta gratis
        </Link>
      </p>
    </AuthShell>
  );
}
