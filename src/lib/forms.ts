// Lectura cómoda de campos de formulario.
export const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
export const optionalText = (form: FormData, key: string) => text(form, key) || null;

export function optionalNumber(form: FormData, key: string) {
  const s = text(form, key).replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
