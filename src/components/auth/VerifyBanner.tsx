import Link from "next/link";
import { resendVerification } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "../ActionForm";

/** Aviso mientras el socio no haya confirmado su correo. */
export function VerifyBanner({ outbox }: { outbox: boolean }) {
  return (
    <div className="bg-jute-100 text-jute-700">
      <div className="mx-auto max-w-5xl px-4 py-2 text-sm">
        <ActionForm action={resendVerification} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            📧 <strong>Confirma tu correo</strong> para poder publicar y contactar. Te hemos enviado un enlace.
          </span>
          <SubmitButton className="font-semibold underline" pendingText="Enviando…">
            Reenviar
          </SubmitButton>
          {outbox && (
            <Link href="/correos" className="font-semibold underline">
              Ver correos de prueba
            </Link>
          )}
        </ActionForm>
      </div>
    </div>
  );
}
