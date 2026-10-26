import "server-only";
import { createHash, randomBytes } from "crypto";
import { appUrl } from "./app-url";
import { db } from "./db";
import { sendMail } from "./mailer";

// Enlaces de un solo uso que se mandan por correo. En la base de datos solo se guarda su huella.

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const LIFETIME_HOURS = { VERIFY_EMAIL: 72, RESET_PASSWORD: 1 } as const;
type Kind = keyof typeof LIFETIME_HOURS;

async function createToken(userId: string, kind: Kind) {
  await db.authToken.deleteMany({ where: { userId, kind, usedAt: null } }); // solo vale el último enlace
  const token = randomBytes(32).toString("base64url");
  await db.authToken.create({
    data: { userId, kind, tokenHash: hash(token), expiresAt: new Date(Date.now() + LIFETIME_HOURS[kind] * 3_600_000) },
  });
  return token;
}

/** Comprueba un enlace y lo marca como usado. Devuelve el id del usuario o null si no vale. */
export async function consumeToken(token: string, kind: Kind) {
  const found = await db.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!found || found.kind !== kind || found.usedAt || found.expiresAt < new Date()) return null;
  await db.authToken.update({ where: { id: found.id }, data: { usedAt: new Date() } });
  return found.userId;
}

/** Igual que consumeToken pero sin gastarlo (para enseñar el formulario de nueva contraseña). */
export async function checkToken(token: string, kind: Kind) {
  const found = await db.authToken.findUnique({ where: { tokenHash: hash(token) } });
  return !!found && found.kind === kind && !found.usedAt && found.expiresAt > new Date();
}

export async function sendVerificationEmail(user: { id: string; name: string; email: string }) {
  const token = await createToken(user.id, "VERIFY_EMAIL");
  await sendMail({
    to: user.email,
    subject: "Confirma tu correo en MercaK9",
    text: `Hola, ${user.name}:\n\nGracias por unirte a MercaK9. Confirma tu correo para poder publicar anuncios y contactar con otros socios.\n\nEl enlace caduca en 3 días.`,
    link: { label: "Confirmar mi correo", url: appUrl(`/verificar/${token}`) },
  });
}

export async function sendPasswordResetEmail(user: { id: string; name: string; email: string }) {
  const token = await createToken(user.id, "RESET_PASSWORD");
  await sendMail({
    to: user.email,
    subject: "Elige una contraseña nueva en MercaK9",
    text: `Hola, ${user.name}:\n\nHemos recibido una petición para cambiar tu contraseña. Si no has sido tú, ignora este correo: tu contraseña sigue igual.\n\nEl enlace caduca en 1 hora.`,
    link: { label: "Elegir contraseña nueva", url: appUrl(`/recuperar/${token}`) },
  });
}
