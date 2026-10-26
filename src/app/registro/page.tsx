import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Choice, Field } from "@/components/Field";
import { getUser, googleEnabled, safeBack } from "@/lib/auth";
import { ACCOUNT_TYPE_HINTS, ACCOUNT_TYPES } from "@/lib/constants";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const back = safeBack((await searchParams).volver);
  if (await getUser()) redirect(back);

  return (
    <AuthShell title="Únete a Canueve K9" intro="Es gratis. Con tu cuenta puedes publicar anuncios y contactar con otros socios.">
      {googleEnabled() && <GoogleButton back={back} />}
      <ActionForm action={register}>
        <input type="hidden" name="volver" value={back} />
        <Choice label="Soy…" name="accountType" options={Object.entries(ACCOUNT_TYPES)} hints={ACCOUNT_TYPE_HINTS} defaultValue="INDIVIDUAL" />
        <Field label="Nombre y apellidos (o nombre del taller o club)" name="name" autoComplete="name" required />
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Field
          label="Teléfono (opcional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Solo lo verán las personas con las que contactes por un anuncio."
        />
        <Field label="Zona o ciudad (opcional)" name="location" placeholder="Ej.: Valencia" />
        <Field label="Contraseña (mínimo 8 caracteres)" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" name="acepto" required className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
          <span>
            Acepto las{" "}
            <Link href="/legal/normas" target="_blank" className="link">
              normas de la comunidad
            </Link>{" "}
            y la{" "}
            <Link href="/legal/privacidad" target="_blank" className="link">
              política de privacidad
            </Link>
            .
          </span>
        </label>
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
