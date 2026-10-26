/** Dirección pública de la web, sin barra final (para enlaces en correos y al compartir). */
export function appUrl(path = "") {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "") + path;
}
