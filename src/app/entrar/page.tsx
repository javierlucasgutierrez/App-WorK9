import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Field } from "@/components/Field";
import { getUser, googleEnabled, safeBack } from "@/lib/auth";

export const metadata = { title: "Entrar" };

const GOOGLE_ERRORS: Record<string, string> = {
  google: "No se ha podido entrar con Google. Vuelve a intentarlo.",
  bloqueado: "Esta cuenta está bloqueada. Si crees que es un error, escríbenos.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string; error?: string }> }) {
  const params = await searchParams;
  const back = safeBack(params.volver);
  if (await getUser()) redirect(back);

  return (
    <AuthShell title="Entrar" intro="Entra para publicar anuncios y contactar con otros socios.">
      {params.error && GOOGLE_ERRORS[params.error] && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {GOOGLE_ERRORS[params.error]}
        </p>
      )}
      {googleEnabled() && <GoogleButton back={back} />}
      <ActionForm action={login}>
        <input type="hidden" name="volver" value={back} />
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm">
        <Link href="/recuperar" className="link">
          ¿Has olvidado la contraseña?
        </Link>
      </p>
      <p className="muted mt-5 text-center">
        ¿Aún no eres socio?{" "}
        <Link href={`/registro?volver=${encodeURIComponent(back)}`} className="link">
          Crea tu cuenta gratis
        </Link>
      </p>
    </AuthShell>
  );
}
