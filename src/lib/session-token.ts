import { SignJWT, jwtVerify } from "jose";

// Token de sesión firmado que se guarda en una cookie.

export const SESSION_COOKIE = "canueve_session";
export const SESSION_DAYS = 30;

export type SessionPayload = { userId: string; name: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta AUTH_SECRET en el archivo .env");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
