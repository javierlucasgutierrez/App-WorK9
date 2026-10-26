import Link from "next/link";
import { ListingGrid } from "@/components/market/ListingCard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Notice } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { ACCOUNT_TYPES, LISTING_CATEGORIES, LISTING_CATEGORY_HINTS, LISTING_CATEGORY_ICONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { cardSelect, publicListing } from "@/lib/listings";

const NOTICES: Record<string, string> = {
  "verificado=1": "✅ ¡Correo confirmado! Ya puedes publicar y contactar con otros socios.",
  "verificado=caducado": "Ese enlace de confirmación ha caducado o ya se ha usado. Si aún no has confirmado tu correo, pulsa «Reenviar» en el aviso de arriba.",
  "contrasena=1": "✅ Contraseña cambiada. Ya has entrado con tu cuenta.",
  "cuenta-borrada=1": "Tu cuenta y tus anuncios se han borrado. ¡Gracias por haber formado parte de MercaK9!",
};

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const notice = Object.entries(params)
    .map(([k, v]) => NOTICES[`${k}=${v}`])
    .find(Boolean);
  const visible = { ...publicListing, status: { not: "SOLD" } };
  const [latest, gifts, listingCount, memberCount, byCategory, makers] = await Promise.all([
    db.listing.findMany({ where: visible, orderBy: { createdAt: "desc" }, take: 8, select: cardSelect }),
    db.listing.findMany({ where: { ...visible, isFree: true }, orderBy: { createdAt: "desc" }, take: 4, select: cardSelect }),
    db.listing.count({ where: visible }),
    db.user.count({ where: { blockedAt: null } }),
    db.listing.groupBy({ by: ["category"], where: visible, _count: true }),
    // Escaparates: creadores, talleres y profesionales con anuncios activos.
    db.user.findMany({
      where: { blockedAt: null, accountType: { in: ["MAKER", "PROFESSIONAL"] }, listings: { some: visible } },
      include: { _count: { select: { listings: { where: visible } } } },
      orderBy: [{ accountType: "asc" }, { createdAt: "asc" }],
      take: 8,
    }),
  ]);
  const countFor = (c: string) => byCategory.find((b) => b.category === c)?._count ?? 0;

  return (
    <div className="space-y-8">
      {notice && <Notice>{notice}</Notice>}
      <section className="-mx-4 -mt-5 bg-brand-800 px-4 pb-8 pt-6 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-8 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-jute-200">{BRAND.shortSlogan}</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          El punto de encuentro del <span className="text-jute-400">perro de trabajo</span>
        </h1>
        <p className="mt-3 max-w-xl text-white/80">
          Material nuevo y de segunda mano, creadores y talleres, cursos y servicios. Compra, vende o regala entre guías,
          figurantes, adiestradores y clubes.
        </p>
        <form action="/anuncios" role="search" className="mt-5 flex max-w-xl gap-2">
          <input
            name="q"
            type="search"
            placeholder="Busca: manga, kit de olores, jaula…"
            aria-label="Buscar material"
            className="input border-transparent text-gray-900"
          />
          <button className="btn-accent shrink-0" aria-label="Buscar">
            🔍<span className="hidden sm:inline">Buscar</span>
          </button>
        </form>
        <p className="mt-4 text-sm text-white/70">
          <strong className="text-white">{listingCount}</strong> anuncios activos · <strong className="text-white">{memberCount}</strong>{" "}
          socios en el club
        </p>
      </section>

      <section>
        <h2 className="h2 mb-3">Explora por categoría</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {LISTING_CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/anuncios?cat=${encodeURIComponent(c)}`}
                className="card flex h-full items-start gap-3 p-3 transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {LISTING_CATEGORY_ICONS[c]}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight text-brand-900">{c}</span>
                  <span className="line-clamp-2 text-xs text-gray-500">{LISTING_CATEGORY_HINTS[c]}</span>
                  {countFor(c) > 0 && (
                    <span className="mt-0.5 block text-xs font-semibold text-brand-600">
                      {countFor(c)} {countFor(c) === 1 ? "anuncio" : "anuncios"}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="h2">Recién publicado</h2>
          <Link href="/anuncios" className="link text-sm">
            Ver todo →
          </Link>
        </div>
        <ListingGrid listings={latest} />
      </section>

      {makers.length > 0 && (
        <section>
          <h2 className="h2">Creadores, talleres y profesionales</h2>
          <p className="muted mb-3">Material hecho a mano, cursos y servicios de gente del sector.</p>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {makers.map((m) => (
              <li key={m.id} className="w-60 shrink-0">
                <Link href={`/socios/${m.id}`} className="card flex h-full items-center gap-3 p-3 transition hover:shadow-md">
                  <MemberAvatar member={m} className="h-12 w-12 text-lg" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-brand-900">{m.name}</span>
                    <span className="block text-xs text-gray-500">
                      {ACCOUNT_TYPES[m.accountType]}
                      {m.location && ` · ${m.location}`}
                    </span>
                    <span className="block text-xs font-semibold text-brand-600">
                      {m._count.listings} {m._count.listings === 1 ? "anuncio" : "anuncios"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gifts.length > 0 && (
        <section className="rounded-3xl bg-jute-50 p-4 sm:p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="h2">🎁 Lo regalan</h2>
            <Link href="/anuncios?tipo=gratis" className="link text-sm">
              Ver todo →
            </Link>
          </div>
          <p className="muted mb-3">Material que otros socios regalan para que siga trabajando.</p>
          <ListingGrid listings={gifts} />
        </section>
      )}

      <section className="card flex flex-col items-start gap-3 border-brand-100 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="h2">¿Tienes material que ya no usas?</h2>
          <p className="text-sm text-gray-600">Dale una segunda vida: a otro guía y a su perro les puede venir genial.</p>
        </div>
        <Link href="/publicar" className="btn shrink-0">
          + Publicar anuncio
        </Link>
      </section>
    </div>
  );
}
