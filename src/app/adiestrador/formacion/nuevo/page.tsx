import { createContent } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ContentFields } from "@/components/ContentFields";
import { PageHeader } from "@/components/ui";

export default function NewContentPage() {
  return (
    <>
      <PageHeader title="Nuevo contenido" back={{ href: "/adiestrador/formacion", label: "Formación" }} />
      <ActionForm action={createContent} className="card space-y-4">
        <ContentFields />
        <SubmitButton>Crear</SubmitButton>
      </ActionForm>
    </>
  );
}
