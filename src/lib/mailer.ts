import "server-only";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * "Puerta" única para enviar correos (igual que storage.ts con las fotos).
 *
 * - "console": no envía nada; guarda cada correo en la carpeta correos/ para verlo en /correos.
 *   Es lo que se usa en local.
 * - "resend": lo envía de verdad con https://resend.com (necesita RESEND_API_KEY).
 * Para usar otro servicio, basta con añadir otra implementación de `Mailer`.
 */
export type Mail = { to: string; subject: string; text: string; link?: { label: string; url: string } };

interface Mailer {
  send(mail: Mail): Promise<void>;
}

const FROM = () => process.env.MAIL_FROM ?? "Canueve K9 <hola@canueve.es>";
export const OUTBOX_DIR = path.resolve("correos");

class ConsoleMailer implements Mailer {
  async send(mail: Mail) {
    await mkdir(OUTBOX_DIR, { recursive: true });
    const file = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    await writeFile(path.join(OUTBOX_DIR, file), JSON.stringify({ ...mail, from: FROM(), date: new Date() }, null, 2));
    console.log(`\n✉️  Correo para ${mail.to}: ${mail.subject}${mail.link ? `\n   ${mail.link.label}: ${mail.link.url}` : ""}\n`);
  }
}

class ResendMailer implements Mailer {
  constructor(private apiKey: string) {}

  async send(mail: Mail) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to: mail.to, subject: mail.subject, text: plainText(mail), html: html(mail) }),
    });
    if (!res.ok) console.error("No se ha podido enviar el correo:", res.status, await res.text());
  }
}

function plainText(mail: Mail) {
  return mail.link ? `${mail.text}\n\n${mail.link.label}: ${mail.link.url}` : mail.text;
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function html(mail: Mail) {
  const paragraphs = mail.text
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = mail.link
    ? `<p style="margin:22px 0"><a href="${escapeHtml(mail.link.url)}" style="background:#8f5f3d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${escapeHtml(mail.link.label)}</a></p>`
    : "";
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1f231f">
<p style="font-size:13px;font-weight:800;letter-spacing:1px;color:#1c1c1e;margin:0">MARKET</p>
<p style="font-size:22px;font-weight:800;color:#8f5f3d;margin:0 0 18px">CANUEVE <span style="color:#1c1c1e">K9</span></p>
${paragraphs}${button}
<p style="font-size:12px;color:#6b6f68;margin-top:28px">Market Canueve K9 · Conecta, compra y comparte con la comunidad del perro de trabajo</p></div>`;
}

function createMailer(): Mailer {
  const driver = process.env.MAIL_DRIVER ?? "console";
  if (driver === "console") return new ConsoleMailer();
  if (driver === "resend" && process.env.RESEND_API_KEY) return new ResendMailer(process.env.RESEND_API_KEY);
  throw new Error(`MAIL_DRIVER "${driver}" no está bien configurado`);
}

const mailer = createMailer();

/** Envía un correo. Si falla, lo apunta pero no rompe lo que estaba haciendo el usuario. */
export async function sendMail(mail: Mail) {
  try {
    await mailer.send(mail);
  } catch (e) {
    console.error("Error al enviar el correo:", e);
  }
}

export const outboxEnabled = () => (process.env.MAIL_DRIVER ?? "console") === "console";

/** Correos guardados en local (solo con MAIL_DRIVER="console"), del más nuevo al más antiguo. */
export async function readOutbox(limit = 30) {
  const files = await readdir(OUTBOX_DIR).catch(() => [] as string[]);
  const latest = files.filter((f) => f.endsWith(".json")).sort().reverse().slice(0, limit);
  return Promise.all(
    latest.map(async (f) => ({ id: f, ...(JSON.parse(await readFile(path.join(OUTBOX_DIR, f), "utf8")) as Mail & { date: string }) })),
  );
}
