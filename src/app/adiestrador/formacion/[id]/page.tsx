import { notFound } from "next/navigation";
import { deleteContent, updateContent } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ContentFields } from "@/components/ContentFields";
import { Collapsible, PageHeader } from "@/components/ui";
import { VideoPlayer } from "@/components/VideoPlayer";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TrainerContentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await requireTrainer();
  const content = await db.content.findFirst({ where: { id, authorId: trainer.id } });
  if (!content) notFound();

  return (
    <>
      <PageHeader title={content.title} subtitle={content.summary} back={{ href: "/adiestrador/formacion", label: "Formación" }} />
      <div className="space-y-4">
        <div className="card space-y-3">
          <VideoPlayer videoKey={content.videoKey} videoUrl={content.videoUrl} />
          <p className="whitespace-pre-line">{content.body}</p>
        </div>
        <Collapsible title="Editar contenido">
          <ActionForm action={updateContent.bind(null, content.id)}>
            <ContentFields content={content} />
            <SubmitButton>Guardar</SubmitButton>
          </ActionForm>
          <form action={deleteContent.bind(null, content.id)} className="mt-6 border-t pt-4">
            <ConfirmButton message="¿Borrar este contenido?">Borrar contenido</ConfirmButton>
          </form>
        </Collapsible>
      </div>
    </>
  );
}
