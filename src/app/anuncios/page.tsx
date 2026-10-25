import Link from "next/link";
import { ListingGrid } from "@/components/market/ListingCard";
import { Empty } from "@/components/ui";
import { LISTING_CATEGORIES } from "@/lib/constants";
import { knownZones, searchListings, SORT_OPTIONS, TYPE_FILTERS, type Filters } from "@/lib/listings";

export const metadata = { title: "Buscar material · K9 Club" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const f = await searchParams;
  const [listings, zones] = await Promise.all([searchListings(f), knownZones()]);

  /** Dirección del buscador cambiando solo algunos filtros. */
  const href = (changes: Filters) => {
    const params = Object.entries({ ...f, ...changes }).filter(([, v]) => v) as [string, string][];
    const s = new URLSearchParams(params).toString();
    return s ? `/anuncios?${s}` : "/anuncios";
  };
  const chip = (active: boolean) => `chip ${active ? "chip-active" : ""}`;
  const hasFilters = !!(f.q || f.cat || f.tipo || f.zona);

  return (
    <>
      <h1 className="h1 mb-3">{f.cat ? f.cat : "Buscar material"}</h1>

      <form action="/anuncios" role="search" className="card mb-3 space-y-2 p-3">
        {f.cat && <input type="hidden" name="cat" value={f.cat} />}
        {f.tipo && <input type="hidden" name="tipo" value={f.tipo} />}
        <input name="q" type="search" defaultValue={f.q ?? ""} placeholder="¿Qué buscas? Ej.: manga, bozal, jaula…" aria-label="Palabras" className="input" />
        <div className="flex gap-2">
          <input name="zona" defaultValue={f.zona ?? ""} placeholder="📍 Zona o ciudad" aria-label="Zona o ciudad" list="zonas" className="input" />
          <datalist id="zonas">
            {zones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
          <select name="orden" defaultValue={f.orden ?? ""} aria-label="Ordenar" className="input w-auto">
            {SORT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button className="btn w-full">🔍 Buscar</button>
      </form>

      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {TYPE_FILTERS.map(([value, label]) => (
          <Link key={value} href={href({ tipo: value })} className={chip((f.tipo ?? "") === value)}>
            {label}
          </Link>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ cat: "" })} className={chip(!f.cat)}>
          Todas las categorías
        </Link>
        {LISTING_CATEGORIES.map((c) => (
          <Link key={c} href={href({ cat: c })} className={chip(f.cat === c)}>
            {c}
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="muted">
          {listings.length === 1 ? "1 anuncio" : `${listings.length} anuncios`}
          {f.q && <> con «{f.q}»</>}
          {f.zona && <> en «{f.zona}»</>}
        </p>
        {hasFilters && (
          <Link href="/anuncios" className="link text-sm">
            Quitar filtros
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <Empty>
          <p className="text-3xl">🐕‍🦺</p>
          <p className="mt-2">No hay anuncios con estos filtros.</p>
          <p className="mt-1 text-sm">Prueba con otra palabra o quita algún filtro.</p>
        </Empty>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </>
  );
}
