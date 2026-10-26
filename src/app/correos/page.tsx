import { notFound } from "next/navigation";
import { PageHeader, Empty } from "@/components/ui";
import { appUrl } from "@/lib/app-url";
import { outboxEnabled, readOutbox } from "@/lib/mailer";

export const metadata = { title: "Correos de prueba" };

// Solo en local (MAIL_DRIVER="console"): muestra los correos que la web "habría enviado".
export default async function OutboxPage() {
  if (!outboxEnabled()) notFound();
  const mails = await readOutbox();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="📬 Correos de prueba"
        subtitle="En tu ordenador los correos no se envían de verdad: se guardan aquí para que puedas probarlos. Cuando la web esté publicada, llegarán al buzón de cada persona."
      />
      {mails.length === 0 ? (
        <Empty>Todavía no se ha enviado ningún correo.</Empty>
      ) : (
        <ul className="space-y-3">
          {mails.map((m) => (
            <li key={m.id} className="card space-y-2">
              <div className="flex flex-wrap justify-between gap-x-3 text-sm text-gray-500">
                <span>Para: {m.to}</span>
                <span>{new Date(m.date).toLocaleString("es-ES")}</span>
              </div>
              <p className="font-semibold">{m.subject}</p>
              <p className="whitespace-pre-line text-sm text-gray-700">{m.text}</p>
              {m.link && (
                <a href={m.link.url.replace(appUrl(), "")} className="btn">
                  {m.link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
