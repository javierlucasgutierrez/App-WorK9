import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelInterest, sendInterest, setListingStatus } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ContactCard } from "@/components/market/ContactCard";
import { ListingGallery } from "@/components/market/ListingGallery";
import { ConditionBadge, ListingPrice, StatusBadge } from "@/components/market/ListingPrice";
import { Avatar } from "@/components/SiteShell";
import { Notice } from "@/components/ui";
import { getUser, loginUrl } from "@/lib/auth";
import { ACCOUNT_TYPES, LISTING_CATEGORY_ICONS, LISTING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { formatDate, formatMonth, timeAgo } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ publicado?: string; guardado?: string }> };

async function load(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      seller: { include: { _count: { select: { listings: true } } } },
      interests: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await db.listing.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: listing?.title ?? "Anuncio" };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const notice = await searchParams;
  const [listing, user] = await Promise.all([load(id), getUser()]);
  if (!listing) notFound();

  const isOwner = user?.id === listing.sellerId;
  const myInterest = user && listing.interests.find((i) => i.userId === user.id);
  const seller = listing.seller;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/anuncios" className="muted mb-2 inline-block hover:underline">
        ← Volver a los anuncios
      </Link>
      {notice.publicado && <Notice>✅ ¡Anuncio publicado! Ya lo puede ver todo el club.</Notice>}
      {notice.guardado && <Notice>✅ Cambios guardados.</Notice>}

      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-5">
        <div className="space-y-4">
          <article className="card overflow-hidden p-0">
            <ListingGallery urls={listing.photos.map((p) => fileUrl(p.key))} title={listing.title} />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ListingPrice listing={listing} className="text-2xl" />
                <ConditionBadge condition={listing.condition} />
                <StatusBadge status={listing.status} />
              </div>
              <h1 className="text-xl font-bold leading-snug text-brand-900">{listing.title}</h1>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                <Link href={`/anuncios?cat=${encodeURIComponent(listing.category)}`} className="hover:underline">
                  {LISTING_CATEGORY_ICONS[listing.category]} {listing.category}
                </Link>
                <span>📍 {listing.location}</span>
                <span>🕒 Publicado {timeAgo(listing.createdAt)}</span>
              </p>
              <p className="whitespace-pre-line leading-relaxed text-gray-800">{listing.description}</p>
            </div>
          </article>
        </div>

        <aside className="mt-4 space-y-4 md:mt-0">
          {!isOwner && (
            <section className="card flex items-center gap-3">
              <Avatar name={seller.name} className="h-12 w-12 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold">{seller.name}</p>
                <p className="text-sm text-gray-600">
                  {ACCOUNT_TYPES[seller.accountType]}
                  {seller.location && ` · ${seller.location}`}
                </p>
                <p className="text-xs text-gray-500">
                  Socio desde {formatMonth(seller.createdAt)} · {seller._count.listings} anuncios
                </p>
              </div>
            </section>
          )}

          {isOwner ? (
            <>
              <section className="card space-y-3">
                <h2 className="h2">Estado del anuncio</h2>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LISTING_STATUS).map(([value, label]) => (
                    <form key={value} action={setListingStatus.bind(null, listing.id, value)}>
                      <button
                        className={`w-full ${listing.status === value ? "btn" : "btn-secondary"} px-1 text-sm`}
                        aria-pressed={listing.status === value}
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
                <p className="muted">Los anuncios vendidos dejan de salir en el buscador.</p>
                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <Link href={`/anuncios/${listing.id}/editar`} className="btn-secondary flex-1">
                    ✏️ Editar
                  </Link>
                </div>
              </section>
              <section className="card space-y-3">
                <h2 className="h2">🙋 Interesados ({listing.interests.length})</h2>
                {listing.interests.length === 0 ? (
                  <p className="muted">Cuando alguien pulse «Me interesa», verás aquí sus datos para contactar.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {listing.interests.map((i) => (
                      <li key={i.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                        <ContactCard person={i.user} subject={`MercaK9: ${listing.title}`} />
                        {i.message && <p className="rounded-xl bg-gray-50 p-2 text-sm text-gray-700">“{i.message}”</p>}
                        <p className="muted text-xs">{formatDate(i.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : myInterest ? (
            <section className="card space-y-3 border-brand-200">
              <p className="font-semibold text-brand-700">✅ Le has avisado. Estos son sus datos para que habléis:</p>
              <ContactCard person={seller} subject={`MercaK9: ${listing.title}`} />
              <form action={cancelInterest.bind(null, listing.id)}>
                <ConfirmButton message="¿Quitar tu interés por este anuncio?" className="btn-secondary w-full text-sm">
                  Ya no me interesa
                </ConfirmButton>
              </form>
            </section>
          ) : listing.status === "SOLD" ? (
            <p className="card text-center text-gray-600">Este anuncio ya está vendido.</p>
          ) : !user ? (
            <section className="card space-y-3 text-center">
              <Link href={loginUrl(`/anuncios/${listing.id}`)} className="btn w-full">
                🙋 Me interesa
              </Link>
              <p className="muted">
                Para contactar, entra o{" "}
                <Link href={`/registro?volver=/anuncios/${listing.id}`} className="link">
                  crea tu cuenta gratis
                </Link>
                .
              </p>
            </section>
          ) : (
            <section className="card">
              {listing.status === "RESERVED" && (
                <p className="mb-3 rounded-xl bg-amber-50 p-2 text-sm text-amber-900">Está reservado, pero puedes avisar por si queda libre.</p>
              )}
              <ActionForm action={sendInterest.bind(null, listing.id)}>
                <div>
                  <label htmlFor="message" className="label">
                    Mensaje para {seller.name.split(" ")[0]} (opcional)
                  </label>
                  <textarea id="message" name="message" rows={3} className="input" placeholder="¿Sigue disponible? ¿Lo puedo ver este fin de semana?" />
                </div>
                <SubmitButton pendingText="Enviando…">🙋 Me interesa</SubmitButton>
                <p className="muted text-center">Al pulsar, os veréis mutuamente el nombre, correo y teléfono.</p>
              </ActionForm>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
