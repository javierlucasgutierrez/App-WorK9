/** Dirección con la que la web pide un archivo guardado (ver src/app/api/archivos). */
export function fileUrl(key: string) {
  return `/api/archivos/${key}`;
}
