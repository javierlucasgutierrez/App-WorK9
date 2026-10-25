import Link from "next/link";
import { ListingPhoto } from "./ListingPhoto";
import { ListingPrice } from "./ListingPrice";

type Rec = {
  id: string;
  note: string | null;
  trainer: { name: string };
  dog: { name: string };
  listing: {
    id: string;
    title: string;
    photoKey: string | null;
    isFree: boolean;
    priceCents: number | null;
    condition: string;
    status: string;
  };
};

/** Material recomendado por el adiestrador. `renderActions` permite añadir botones (p. ej. borrar). */
export function RecommendationList({
  items,
  base,
  renderActions,
}: {
  items: Rec[];
  base: string;
  renderActions?: (id: string) => React.ReactNode;
}) {
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="card flex gap-3 p-3">
          <Link href={`${base}/${r.listing.id}`} className="shrink-0">
            <ListingPhoto photoKey={r.listing.photoKey} title={r.listing.title} className="h-20 w-20 rounded-xl" />
          </Link>
          <div className="min-w-0 flex-1 space-y-1">
            <Link href={`${base}/${r.listing.id}`} className="block font-semibold hover:underline">
              {r.listing.title}
            </Link>
            <p className="text-sm">
              <ListingPrice listing={r.listing} />
              <span className="muted"> · para {r.dog.name}</span>
            </p>
            {r.note && <p className="text-sm text-gray-700">“{r.note}” — {r.trainer.name}</p>}
            {renderActions?.(r.id)}
          </div>
        </li>
      ))}
    </ul>
  );
}
