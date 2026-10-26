import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelInterest, sendInterest, setListingHidden, setListingStatus, setUserBlocked } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ContactCard } from "@/components/market/ContactCard";
import { ListingGallery } from "@/components/market/ListingGallery";
import { ConditionBadge, ListingPrice, StatusBadge } from "@/components/market/ListingPrice";
import { ReportForm } from "@/components/market/ReportForm";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Notice } from "@/components/ui";
import { getUser, isAdmin, loginUrl } from "@/lib/auth";
import { ACCOUNT_TYPES, LISTING_CATEGORY_ICONS, LISTING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { formatPrice } from "@/lib/format";
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

// Título, texto y foto que se ven al compartir el anuncio (WhatsApp, redes...).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await db.listing.findUnique({
    where: { id: (await params).id },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });
  if (!listing || listing.hiddenAt) return { title: "Anuncio" };
  const price = listing.isFree ? "Lo regalo" : formatPrice(listing.priceCents);
  const description = `${price} · ${listing.location} · ${listing.description.slice(0, 140)}`;
  const images = listing.photos[0] ? [fileUrl(listing.photos[0].key)] : [];
  return { title: listing.title, description, openGraph: { title: `${listing.title} · ${price}`, description, images } };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const notice = await searchParams;
  const [listing, user] = await Promise.all([load(id), getUser()]);
  if (!listing) notFound();

  const isOwner = user?.id === listing.sellerId;
  const admin = isAdmin(user);
  const hidden = !!(listing.hiddenAt || listing.seller.blockedAt);
  if (hidden && !isOwner && !admin) notFound();
  const myInterest = user && listing.interests.find((i) => i.userId === user.id);
  const seller = listing.seller;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/anuncios" className="muted mb-2 inline-block hover:underline">
        ← Volver a los anuncios
      </Link>
      {notice.publicado && <Notice>✅ ¡Anuncio publicado! Ya lo puede ver todo el club.</Notice>}
      {notice.guardado && <Notice>✅ Cambios guardados.</Notice>}
      {hidden && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          🚫 Este anuncio está oculto por moderación y no lo ve nadie más.
        </p>
      )}

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
            <Link href={`/socios/${seller.id}`} className="card flex items-center gap-3 transition hover:shadow-md">
              <MemberAvatar member={seller} className="h-12 w-12 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold">{seller.name}</p>
                <p className="text-sm text-gray-600">
                  {ACCOUNT_TYPES[seller.accountType]}
                  {seller.location && ` · ${seller.location}`}
                </p>
                <p className="text-xs text-gray-500">
                  Socio desde {formatMonth(seller.createdAt)} · {seller._count.listings} {seller._count.listings === 1 ? "anuncio" : "anuncios"}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-brand-600">Ver su escaparate →</p>
              </div>
            </Link>
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
                        <ContactCard person={i.user} subject={`Canueve K9: ${listing.title}`} />
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
              <ContactCard person={seller} subject={`Canueve K9: ${listing.title}`} />
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

          {!isOwner && user && <ReportForm listingId={listing.id} />}

          {admin && (
            <section className="card space-y-2 border-amber-200 bg-amber-50">
              <h2 className="font-semibold text-amber-900">🛡️ Moderación</h2>
              <form action={setListingHidden.bind(null, listing.id, !listing.hiddenAt)}>
                <button className="btn-secondary w-full text-sm">{listing.hiddenAt ? "Volver a mostrar el anuncio" : "Ocultar este anuncio"}</button>
              </form>
              {!isOwner && (
                <form action={setUserBlocked.bind(null, seller.id, !seller.blockedAt)}>
                  <button className="btn-danger w-full">{seller.blockedAt ? `Desbloquear a ${seller.name}` : `Bloquear a ${seller.name}`}</button>
                </form>
              )}
              <Link href="/admin" className="link block text-center text-sm">
                Ir al panel de moderación
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
