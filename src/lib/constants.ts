// Valores permitidos para los campos de texto "tipo" de la base de datos.
export const ROLES = { TRAINER: "TRAINER", CLIENT: "CLIENT" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ASSIGNMENT_STATUS = { PENDING: "PENDING", DONE: "DONE" } as const;

export const DOG_SEX: Record<string, string> = { MALE: "Macho", FEMALE: "Hembra" };

// Categorías de material, pensadas para el perro de trabajo.
export const LISTING_CATEGORIES = [
  "Mordida",
  "Detección",
  "Rastreo",
  "Obediencia y control",
  "Arneses",
  "Motivadores",
  "Transporte",
  "Equipo del guía",
  "Cursos y servicios",
  "Otros",
];

/** Ejemplos de qué entra en cada categoría (se muestran al publicar). */
export const LISTING_CATEGORY_HINTS: Record<string, string> = {
  Mordida: "mangas, trajes, bocados, látigos",
  Detección: "kits de olores, cajas, contenedores",
  Rastreo: "líneas largas, banderines",
  "Obediencia y control": "collares, correas, tiradores, bozales",
  Arneses: "de rastreo, de tiro, de protección",
  Motivadores: "rulos, pelotas, mordedores",
  Transporte: "jaulas, transportines, equipo para el coche",
  "Equipo del guía": "ropa, riñoneras, bolsas de premios",
  "Cursos y servicios": "seminarios, sesiones, figurante",
  Otros: "todo lo demás",
};

export const LISTING_CONDITION: Record<string, string> = { NEW: "Nuevo", USED: "Segunda mano" };

export const LISTING_STATUS: Record<string, string> = { ACTIVE: "Disponible", RESERVED: "Reservado", SOLD: "Vendido" };
