import { ContentCard } from "@/components/ContentCard";
import { Empty, PageHeader } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ClientContentPage() {
  await requireClient();
  const contents = await db.content.findMany({
    where: { published: true },
    orderBy: [{ isPremium: "asc" }, { createdAt: "desc" }],
  });
  return (
    <>
      <PageHeader title="Formación" subtitle="Artículos y vídeos para aprender a educar a tu perro." />
      {contents.length === 0 ? (
        <Empty>Pronto habrá contenido aquí.</Empty>
      ) : (
        <ul className="space-y-3">
          {contents.map((c) => (
            <li key={c.id}>
              <ContentCard href={`/cliente/formacion/${c.id}`} content={c} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
