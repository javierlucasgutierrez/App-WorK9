import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Empty, PageHeader } from "../ui";
import { db } from "@/lib/db";
import { LISTING_CATEGORIES } from "@/lib/constants";
import { ListingCard } from "./ListingCard";

export type MarketFilters = { tipo?: string; cat?: string; mios?: string };

const TYPES = [
  ["", "Todo"],
  ["segunda", "Segunda mano"],
  ["nuevo", "Nuevo"],
  ["gratis", "Gratis"],
] as const;

/** Lista de anuncios con filtros (sirve igual para adiestradores y clientes). */
export async function MarketList({ userId, base, filters }: { userId: string; base: string; filters: MarketFilters }) {
  const mine = filters.mios === "1";
  const where: Prisma.ListingWhereInput = mine ? { sellerId: userId } : { status: { not: "SOLD" } };
  if (!mine) {
    if (filters.tipo === "segunda") where.condition = "USED";
    if (filters.tipo === "nuevo") where.condition = "NEW";
    if (filters.tipo === "gratis") where.isFree = true;
    if (filters.cat && LISTING_CATEGORIES.includes(filters.cat)) where.category = filters.cat;
  }
  const listings = await db.listing.findMany({ where, orderBy: { createdAt: "desc" } });

  const href = (changes: MarketFilters) => {
    const q = new URLSearchParams(Object.entries({ ...filters, ...changes }).filter(([, v]) => v) as [string, string][]);
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
      active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"
    }`;

  return (
    <>
      <PageHeader
        title="Material"
        subtitle="Nuevo y de segunda mano, entre socios del club."
        action={
          <Link href={`${base}/nuevo`} className="btn shrink-0">
            + Publicar
          </Link>
        }
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={base} className={chip(!mine && !filters.tipo)}>
          Todo
        </Link>
        {TYPES.slice(1).map(([value, label]) => (
          <Link key={value} href={href({ tipo: value, mios: "" })} className={chip(!mine && filters.tipo === value)}>
            {label}
          </Link>
        ))}
        <Link href={`${base}?mios=1`} className={chip(mine)}>
          Mis anuncios
        </Link>
      </div>
      {!mine && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <Link href={href({ cat: "" })} className={chip(!filters.cat)}>
            Todas las categorías
          </Link>
          {LISTING_CATEGORIES.map((c) => (
            <Link key={c} href={href({ cat: c })} className={chip(filters.cat === c)}>
              {c}
            </Link>
          ))}
        </div>
      )}
      {listings.length === 0 ? (
        <Empty>{mine ? "Aún no has publicado nada. ¡Anímate con lo que ya no uses!" : "No hay anuncios con estos filtros."}</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {listings.map((l) => (
            <li key={l.id} className="min-w-0">
              <ListingCard href={`${base}/${l.id}`} listing={l} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
