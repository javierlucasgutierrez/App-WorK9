import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl } from "./app-url";

// Entrar con Google (OAuth 2.0 / OpenID Connect), sin librerías extra.
// Necesita GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env (se crean en console.cloud.google.com).

export const GOOGLE_STATE_COOKIE = "mercak9_google_state";
const redirectUri = () => appUrl("/api/auth/google/callback");
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Cambia el código que devuelve Google por los datos verificados de la persona. */
export async function googleProfile(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google respondió ${res.status}`);
  const { id_token } = (await res.json()) as { id_token: string };
  const { payload } = await jwtVerify(id_token, googleKeys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  return {
    googleId: String(payload.sub),
    email: String(payload.email ?? "").toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: String(payload.name ?? payload.email ?? "Socio"),
  };
}
