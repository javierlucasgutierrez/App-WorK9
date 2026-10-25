import { createListing } from "@/app/actions/market";
import { ActionForm, SubmitButton } from "../ActionForm";
import { PageHeader } from "../ui";
import { ListingFields } from "./ListingFields";

export function NewListing({ base }: { base: string }) {
  return (
    <>
      <PageHeader title="Publicar material" back={{ href: base, label: "Material" }} />
      <ActionForm action={createListing} className="card space-y-4">
        <ListingFields />
        <SubmitButton>Publicar</SubmitButton>
      </ActionForm>
    </>
  );
}
