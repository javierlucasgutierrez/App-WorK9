// Utilidades para fechas y números en español.

export function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Fecha en formato "AAAA-MM-DD" para los campos <input type="date">. */
export function toInputDate(date: Date | null | undefined = new Date()) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Convierte "AAAA-MM-DD" en fecha (a mediodía, para evitar saltos de día por la zona horaria). */
export function parseInputDate(value: FormDataEntryValue | null) {
  const s = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function age(birthDate: Date | null | undefined) {
  if (!birthDate) return "";
  const months =
    (new Date().getFullYear() - birthDate.getFullYear()) * 12 + new Date().getMonth() - birthDate.getMonth();
  if (months < 12) return `${Math.max(months, 0)} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 año" : `${years} años`;
}

export function percent(ok: number, total: number) {
  return total > 0 ? Math.round((ok / total) * 100) : 0;
}

export function formatPrice(cents: number | null | undefined) {
  if (cents == null) return "";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}
