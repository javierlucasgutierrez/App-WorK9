// Valores permitidos para los campos de texto "tipo" de la base de datos.
export const ROLES = { TRAINER: "TRAINER", CLIENT: "CLIENT" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ASSIGNMENT_STATUS = { PENDING: "PENDING", DONE: "DONE" } as const;

export const DOG_SEX: Record<string, string> = { MALE: "Macho", FEMALE: "Hembra" };

export const LISTING_CATEGORIES = [
  "Collares y correas",
  "Arneses",
  "Material de adiestramiento",
  "Juguetes",
  "Premios y comida",
  "Transportines y camas",
  "Ropa y accesorios",
  "Servicios",
  "Otros",
];

export const LISTING_CONDITION: Record<string, string> = { NEW: "Nuevo", USED: "Segunda mano" };

export const LISTING_STATUS: Record<string, string> = { ACTIVE: "Disponible", RESERVED: "Reservado", SOLD: "Vendido" };
