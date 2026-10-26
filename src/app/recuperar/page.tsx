import { requestPasswordReset } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/Field";

export const metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="¿Has olvidado la contraseña?" intro="Escribe tu correo y te mandaremos un enlace para elegir una nueva.">
      <ActionForm action={requestPasswordReset}>
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <SubmitButton pendingText="Enviando…">Enviar enlace</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
