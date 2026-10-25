import { notFound } from "next/navigation";
import { cancelInterest, deleteListing, sendInterest, setListingStatus, updateListing } from "@/app/actions/market";
import { db } from "@/lib/db";
import { LISTING_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ActionForm, SubmitButton } from "../ActionForm";
import { ConfirmButton } from "../ConfirmButton";
import { Field } from "../Field";
import { Collapsible, PageHeader } from "../ui";
import { ListingFields } from "./ListingFields";
import { ListingPhoto } from "./ListingPhoto";
import { ListingBadges, ListingPrice } from "./ListingPrice";

function Contact({ person }: { person: { name: string; email: string; phone: string | null } }) {
  return (
    <div className="text-sm">
      <p className="font-semibold">{person.name}</p>
      <p className="select-all">✉️ {person.email}</p>
      {person.phone && (
        <p>
          📞{" "}
          <a href={`tel:${person.phone}`} className="link">
            {person.phone}
          </a>
        </p>
      )}
    </div>
  );
}

/** Ficha de un anuncio: el anunciante ve los interesados; los demás pueden avisar con «Me interesa». */
export async function ListingDetail({ userId, base, id }: { userId: string; base: string; id: string }) {
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: true,
      interests: { include: { user: true }, orderBy: { createdAt: "desc" } },
      recommendations: { where: { dog: { ownerId: userId } }, include: { trainer: true, dog: true } },
    },
  });
  if (!listing) notFound();
  const isOwner = listing.sellerId === userId;
  const myInterest = listing.interests.find((i) => i.userId === userId);

  return (
    <>
      <PageHeader title={listing.title} back={{ href: base, label: "Material" }} />
      <div className="space-y-4">
        <div className="card overflow-hidden p-0">
          <ListingPhoto photoKey={listing.photoKey} title={listing.title} className="aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2 text-xl">
              <ListingPrice listing={listing} />
              <ListingBadges listing={listing} />
            </div>
            <p className="muted">
              {[listing.category, listing.location, `Publicado el ${formatDate(listing.createdAt)}`].filter(Boolean).join(" · ")}
            </p>
            <p className="whitespace-pre-line">{listing.description}</p>
            {!isOwner && <p className="muted">Anuncia: {listing.seller.name}</p>}
          </div>
        </div>

        {listing.recommendations.map((r) => (
          <div key={r.id} className="card border-brand-100 bg-brand-50 text-sm">
            <p className="font-semibold text-brand-700">
              ⭐ {r.trainer.name} lo recomienda para {r.dog.name}
            </p>
            {r.note && <p className="mt-1">{r.note}</p>}
          </div>
        ))}

        {isOwner ? (
          <>
            <section className="card space-y-3">
              <h2 className="h2">Interesados ({listing.interests.length})</h2>
              {listing.interests.length === 0 ? (
                <p className="muted">Cuando alguien pulse «Me interesa», verás aquí sus datos para contactar.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {listing.interests.map((i) => (
                    <li key={i.id} className="py-2">
                      <Contact person={i.user} />
                      {i.message && <p className="mt-1 text-sm text-gray-700">“{i.message}”</p>}
                      <p className="muted text-xs">{formatDate(i.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card space-y-2">
              <h2 className="h2">Estado del anuncio</h2>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(LISTING_STATUS).map(([value, label]) => (
                  <form key={value} action={setListingStatus.bind(null, listing.id, value)}>
                    <button
                      className={`w-full ${listing.status === value ? "btn" : "btn-secondary"} px-2 text-sm`}
                      aria-pressed={listing.status === value}
                    >
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </section>
            <Collapsible title="Editar anuncio">
              <ActionForm action={updateListing.bind(null, listing.id)}>
                <ListingFields listing={listing} />
                <SubmitButton>Guardar</SubmitButton>
              </ActionForm>
              <form action={deleteListing.bind(null, listing.id)} className="mt-6 border-t pt-4">
                <ConfirmButton message="¿Borrar este anuncio?">Borrar anuncio</ConfirmButton>
              </form>
            </Collapsible>
          </>
        ) : myInterest ? (
          <section className="card space-y-3">
            <p className="font-semibold text-brand-700">✅ Ya le has avisado. Contacta con el anunciante:</p>
            <Contact person={listing.seller} />
            <form action={cancelInterest.bind(null, listing.id)}>
              <button className="btn-secondary w-full">Ya no me interesa</button>
            </form>
          </section>
        ) : listing.status === "SOLD" ? (
          <p className="card text-center text-gray-600">Este anuncio ya está vendido.</p>
        ) : (
          <section className="card">
            <ActionForm action={sendInterest.bind(null, listing.id)}>
              <Field label="Mensaje para el anunciante (opcional)" name="message" placeholder="¿Sigue disponible? ¿Lo puedo ver?" />
              <SubmitButton>🙋 Me interesa</SubmitButton>
              <p className="muted text-center">Al pulsar, el anunciante verá tu nombre, correo y teléfono.</p>
            </ActionForm>
          </section>
        )}
      </div>
    </>
  );
}
