// Búsqueda sin distinguir mayúsculas ni tildes, igual en SQLite y en PostgreSQL:
// guardamos una copia "normalizada" del texto y buscamos sobre ella.

export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function searchFields(l: { title: string; description: string; category: string; location: string }) {
  return {
    searchText: normalize([l.title, l.description, l.category, l.location].join(" ")),
    locationSearch: normalize(l.location),
  };
}
