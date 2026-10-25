import Link from "next/link";
import { ContentCard } from "@/components/ContentCard";
import { Empty, PageHeader } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TrainerContentPage() {
  const trainer = await requireTrainer();
  const contents = await db.content.findMany({ where: { authorId: trainer.id }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader
        title="Formación"
        subtitle="Artículos y vídeos para todos los clientes."
        action={
          <Link href="/adiestrador/formacion/nuevo" className="btn shrink-0">
            + Nuevo
          </Link>
        }
      />
      {contents.length === 0 ? (
        <Empty>Aún no has publicado contenido.</Empty>
      ) : (
        <ul className="space-y-3">
          {contents.map((c) => (
            <li key={c.id}>
              <ContentCard href={`/adiestrador/formacion/${c.id}`} content={c} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
