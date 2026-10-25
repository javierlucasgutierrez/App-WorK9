import { createPractice } from "@/app/actions/client";
import { toInputDate } from "@/lib/format";
import { ActionForm, SubmitButton } from "./ActionForm";
import { Field } from "./Field";

type Option = { id: string; label: string };

/** Formulario para apuntar una práctica en casa. */
export function PracticeForm({ assignments }: { assignments: Option[] }) {
  return (
    <ActionForm action={createPractice} resetOnSuccess>
      {assignments.length === 1 ? (
        <input type="hidden" name="assignmentId" value={assignments[0].id} />
      ) : (
        <div>
          <label htmlFor="assignmentId" className="label">
            ¿Qué habéis practicado?
          </label>
          <select id="assignmentId" name="assignmentId" className="input" required>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <Field label="Fecha" name="date" type="date" defaultValue={toInputDate()} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Repeticiones" name="repetitions" type="number" min={1} inputMode="numeric" required />
        <Field label="✅ Le han salido bien" name="successes" type="number" min={0} inputMode="numeric" required />
      </div>
      <Field label="Comentario (opcional)" name="notes" placeholder="¿Cómo ha ido?" />
      <SubmitButton>Guardar práctica</SubmitButton>
    </ActionForm>
  );
}
