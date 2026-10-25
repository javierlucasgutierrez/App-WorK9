import { createOwnDog } from "@/app/actions/client";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { DogFields } from "@/components/DogFields";
import { PageHeader } from "@/components/ui";

export default function NewDogPage() {
  return (
    <>
      <PageHeader title="Añadir perro" back={{ href: "/cliente/perros", label: "Mis perros" }} />
      <ActionForm action={createOwnDog} className="card space-y-4">
        <DogFields />
        <SubmitButton>Añadir perro</SubmitButton>
      </ActionForm>
    </>
  );
}
