import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// Freno contra abusos: cuenta los intentos recientes de cada acción en la base de datos
// (así funciona igual con uno o con varios servidores).

/** Devuelve true si se puede seguir; false si se ha pasado del límite en la ventana de tiempo. */
export async function allow(key: string, limit: number, windowMinutes: number) {
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const count = await db.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return false;
  await db.rateLimitHit.create({ data: { key } });
  // De vez en cuando, limpiar intentos de hace más de un día.
  if (Math.random() < 0.02) await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  return true;
}

/** Dirección IP de quien hace la petición (la que indica el servidor de alojamiento). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export const TOO_MANY = "Has hecho demasiados intentos seguidos. Espera un rato y vuelve a probar.";
