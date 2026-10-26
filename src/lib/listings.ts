import "server-only";
import type { Prisma } from "@prisma/client";
import { LISTING_CATEGORIES } from "./constants";
import { db } from "./db";
import { normalize } from "./search";

/** Filtros del buscador (vienen en la dirección: /anuncios?q=manga&cat=Mordida...). */
export type Filters = { q?: string; cat?: string; tipo?: string; zona?: string; orden?: string };

export const TYPE_FILTERS = [
  ["", "Todo"],
  ["segunda", "Segunda mano"],
  ["nuevo", "Nuevo"],
  ["gratis", "Gratis"],
] as const;

export const SORT_OPTIONS = [
  ["", "Más recientes"],
  ["barato", "Más baratos"],
  ["caro", "Más caros"],
] as const;

/** Anuncios que puede ver cualquiera: ni ocultos por moderación ni de cuentas bloqueadas. */
export const publicListing = { hiddenAt: null, seller: { blockedAt: null } } satisfies Prisma.ListingWhereInput;

/** Lo que se pide a la base de datos para pintar una tarjeta de anuncio. */
export const cardSelect = {
  id: true,
  title: true,
  isFree: true,
  priceCents: true,
  condition: true,
  status: true,
  location: true,
  photos: { select: { key: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ListingSelect;

export async function searchListings(f: Filters) {
  // Los vendidos no salen en el buscador (sí en «Mis anuncios»).
  const where: Prisma.ListingWhereInput = { ...publicListing, status: { not: "SOLD" } };
  const and: Prisma.ListingWhereInput[] = [];
  for (const word of normalize(f.q ?? "").split(" ").filter(Boolean)) {
    and.push({ searchText: { contains: word } });
  }
  if (f.zona?.trim()) and.push({ locationSearch: { contains: normalize(f.zona) } });
  if (and.length) where.AND = and;
  if (f.cat && LISTING_CATEGORIES.includes(f.cat)) where.category = f.cat;
  if (f.tipo === "segunda") where.condition = "USED";
  if (f.tipo === "nuevo") where.condition = "NEW";
  if (f.tipo === "gratis") where.isFree = true;

  const orderBy: Prisma.ListingOrderByWithRelationInput[] =
    f.orden === "barato"
      ? [{ isFree: "desc" }, { priceCents: { sort: "asc", nulls: "first" } }]
      : f.orden === "caro"
        ? [{ priceCents: { sort: "desc", nulls: "last" } }]
        : [{ createdAt: "desc" }];

  return db.listing.findMany({ where, orderBy, select: cardSelect, take: 120 });
}

/** Zonas ya usadas en el club (para sugerirlas al escribir). */
export async function knownZones() {
  const [listings, users] = await Promise.all([
    db.listing.findMany({ select: { location: true }, distinct: ["location"] }),
    db.user.findMany({ select: { location: true }, where: { location: { not: null } }, distinct: ["location"] }),
  ]);
  const all = [...listings.map((l) => l.location), ...users.map((u) => u.location ?? "")].filter(Boolean);
  return [...new Set(all)].sort((a, b) => a.localeCompare(b, "es"));
}
