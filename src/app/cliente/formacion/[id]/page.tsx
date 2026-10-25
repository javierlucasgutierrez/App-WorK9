import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { VideoPlayer } from "@/components/VideoPlayer";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function ClientContentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const content = await db.content.findFirst({ where: { id, published: true }, include: { author: true } });
  if (!content) notFound();

  return (
    <>
      <PageHeader
        title={content.title}
        subtitle={`${content.summary} · por ${content.author.name}`}
        back={{ href: "/cliente/formacion", label: "Formación" }}
      />
      {content.isPremium ? (
        // Los pagos llegarán en una versión futura: por ahora el contenido de pago se muestra bloqueado.
        <div className="card space-y-3 text-center">
          <p className="text-4xl">🔒</p>
          <p className="font-semibold">Contenido de pago {content.priceCents != null && `· ${formatPrice(content.priceCents)}`}</p>
          <p className="muted">Muy pronto podrás desbloquearlo desde aquí.</p>
        </div>
      ) : (
        <div className="card space-y-3">
          <VideoPlayer videoKey={content.videoKey} videoUrl={content.videoUrl} />
          <p className="whitespace-pre-line">{content.body}</p>
        </div>
      )}
    </>
  );
}
