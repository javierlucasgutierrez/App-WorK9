// Valores permitidos para los campos de texto "tipo" de la base de datos.

export const ACCOUNT_TYPES: Record<string, string> = {
  INDIVIDUAL: "Particular",
  PROFESSIONAL: "Profesional",
  MAKER: "Creador / taller",
};

/** Explicación corta de cada tipo de cuenta (se muestra al registrarse). */
export const ACCOUNT_TYPE_HINTS: Record<string, string> = {
  INDIVIDUAL: "Guía, deportista o aficionado",
  PROFESSIONAL: "Adiestrador, figurante, club",
  MAKER: "Fabricas o vendes material",
};

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

/** Ejemplos de qué entra en cada categoría (se muestran al publicar y en el inicio). */
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

export const LISTING_CATEGORY_ICONS: Record<string, string> = {
  Mordida: "🦷",
  Detección: "👃",
  Rastreo: "🧭",
  "Obediencia y control": "🦮",
  Arneses: "🎽",
  Motivadores: "🎾",
  Transporte: "🚐",
  "Equipo del guía": "🎒",
  "Cursos y servicios": "🎓",
  Otros: "📦",
};

export const LISTING_CONDITION: Record<string, string> = { NEW: "Nuevo", USED: "Segunda mano" };

export const LISTING_STATUS: Record<string, string> = { ACTIVE: "Disponible", RESERVED: "Reservado", SOLD: "Vendido" };

export const MAX_PHOTOS = 6;

export const REPORT_REASONS: Record<string, string> = {
  FRAUD: "Parece un engaño o estafa",
  FORBIDDEN: "Material prohibido o venta de animales",
  WRONG: "Datos falsos o categoría equivocada",
  SPAM: "Spam o anuncio repetido",
  OTHER: "Otro motivo",
};
