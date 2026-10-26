import { notFound } from "next/navigation";
import { deleteListing, updateListing } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ListingFields } from "@/components/market/ListingFields";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { knownZones } from "@/lib/listings";

export const metadata = { title: "Editar anuncio" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/anuncios/${id}/editar`);
  const [listing, zones] = await Promise.all([
    db.listing.findFirst({ where: { id, sellerId: user.id }, include: { photos: { orderBy: { position: "asc" } } } }),
    knownZones(),
  ]);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Editar anuncio" back={{ href: `/anuncios/${id}`, label: "Volver al anuncio" }} />
      <ActionForm action={updateListing.bind(null, id)} className="card space-y-5">
        <ListingFields listing={listing} photos={listing.photos.map((p) => ({ id: p.id, url: fileUrl(p.key) }))} zones={zones} />
        <SubmitButton>Guardar cambios</SubmitButton>
      </ActionForm>
      <form action={deleteListing.bind(null, id)} className="mt-6 text-center">
        <ConfirmButton message="¿Seguro que quieres borrar este anuncio? No se puede deshacer.">🗑️ Borrar anuncio</ConfirmButton>
      </form>
    </div>
  );
}
