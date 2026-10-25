import { parseInputDate } from "./format";
import { optionalNumber, optionalText, text } from "./forms";

/** Datos de la ficha del perro a partir del formulario (lo usan adiestrador y cliente). */
export function dogDataFromForm(form: FormData) {
  const sex = text(form, "sex");
  return {
    name: text(form, "name"),
    breed: optionalText(form, "breed"),
    sex: sex === "MALE" || sex === "FEMALE" ? sex : null,
    birthDate: parseInputDate(form.get("birthDate")),
    weightKg: optionalNumber(form, "weightKg"),
    notes: optionalText(form, "notes"),
  };
}
