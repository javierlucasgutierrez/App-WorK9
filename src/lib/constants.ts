// Valores permitidos para los campos de texto "tipo" de la base de datos.
export const ROLES = { TRAINER: "TRAINER", CLIENT: "CLIENT" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ASSIGNMENT_STATUS = { PENDING: "PENDING", DONE: "DONE" } as const;

export const DOG_SEX: Record<string, string> = { MALE: "Macho", FEMALE: "Hembra" };
