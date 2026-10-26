import { reportListing } from "@/app/actions/listings";
import { REPORT_REASONS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "../ActionForm";

/** «Denunciar anuncio»: plegado, para no molestar, pero siempre a mano. */
export function ReportForm({ listingId }: { listingId: string }) {
  return (
    <details className="group text-center">
      <summary className="inline-block cursor-pointer list-none text-sm text-gray-500 underline-offset-2 hover:underline">
        🚩 Denunciar anuncio
      </summary>
      <ActionForm action={reportListing.bind(null, listingId)} className="card mt-2 space-y-3 text-left" resetOnSuccess>
        <fieldset className="space-y-2">
          <legend className="label">¿Qué pasa con este anuncio?</legend>
          {Object.entries(REPORT_REASONS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={value} required className="h-4 w-4 accent-brand-600" /> {label}
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="details" className="label">
            Detalles (opcional)
          </label>
          <textarea id="details" name="details" rows={2} className="input" maxLength={1000} />
        </div>
        <SubmitButton className="btn-secondary w-full" pendingText="Enviando…">
          Enviar denuncia
        </SubmitButton>
      </ActionForm>
    </details>
  );
}
