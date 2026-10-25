import { createListing } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ListingFields } from "@/components/market/ListingFields";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { knownZones } from "@/lib/listings";

export const metadata = { title: "Publicar anuncio · K9 Club" };

export default async function PublishPage() {
  const user = await requireUser("/publicar");
  const zones = await knownZones();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Publicar anuncio" subtitle="Material, cursos o servicios para el perro de trabajo." />
      <ActionForm action={createListing} className="card space-y-5">
        <ListingFields defaultLocation={user.location} zones={zones} />
        <SubmitButton pendingText="Publicando…">Publicar anuncio</SubmitButton>
      </ActionForm>
    </div>
  );
}
