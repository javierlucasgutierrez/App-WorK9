import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { Choice, Field } from "@/components/Field";
import { getUser, safeBack } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const back = safeBack((await searchParams).volver);
  if (await getUser()) redirect(back);

  return (
    <AuthShell title="Únete al club" intro="Es gratis. Con tu cuenta puedes publicar anuncios y contactar con otros socios.">
      <ActionForm action={register}>
        <input type="hidden" name="volver" value={back} />
        <Choice label="Soy…" name="accountType" options={Object.entries(ACCOUNT_TYPES)} defaultValue="INDIVIDUAL" />
        <Field label="Nombre y apellidos" name="name" autoComplete="name" required />
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Field
          label="Teléfono (opcional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Solo lo verán las personas con las que contactes por un anuncio."
        />
        <Field label="Zona o ciudad (opcional)" name="location" placeholder="Ej.: Valencia" />
        <Field label="Contraseña (mínimo 6 caracteres)" name="password" type="password" autoComplete="new-password" required minLength={6} />
        <SubmitButton pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </ActionForm>
      <p className="muted mt-5 text-center">
        ¿Ya eres socio?{" "}
        <Link href={`/entrar?volver=${encodeURIComponent(back)}`} className="link">
          Entra
        </Link>
      </p>
    </AuthShell>
  );
}
