import { notFound } from "next/navigation";
import { updateOwnDog } from "@/app/actions/client";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { DogFields } from "@/components/DogFields";
import { DogProgress } from "@/components/DogProgress";
import { SessionList } from "@/components/SessionList";
import { Collapsible, PageHeader } from "@/components/ui";
import { getClientDog } from "@/lib/access";
import { requireClient } from "@/lib/auth";
import { DOG_SEX } from "@/lib/constants";
import { age } from "@/lib/format";

export default async function MyDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await requireClient();
  const dog = await getClientDog(client.id, id);
  if (!dog) notFound();

  return (
    <>
      <PageHeader
        title={`🐕 ${dog.name}`}
        back={{ href: "/cliente/perros", label: "Mis perros" }}
        subtitle={[dog.breed, dog.sex && DOG_SEX[dog.sex], age(dog.birthDate), dog.weightKg && `${dog.weightKg} kg`]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="space-y-6">
        {dog.notes && <p className="card whitespace-pre-line text-sm">{dog.notes}</p>}
        <Collapsible title="Editar ficha">
          <ActionForm action={updateOwnDog.bind(null, dog.id)}>
            <DogFields dog={dog} />
            <SubmitButton>Guardar ficha</SubmitButton>
          </ActionForm>
        </Collapsible>
        <DogProgress dogId={dog.id} />
        <section className="space-y-3">
          <h2 className="h2">Sesiones con tu adiestrador</h2>
          <SessionList dogId={dog.id} />
        </section>
      </div>
    </>
  );
}
