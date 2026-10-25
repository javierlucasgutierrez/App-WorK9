import Link from "next/link";
import { ListingPhoto } from "./ListingPhoto";
import { ConditionBadge, ListingPrice, StatusBadge } from "./ListingPrice";

export type CardListing = {
  id: string;
  title: string;
  isFree: boolean;
  priceCents: number | null;
  condition: string;
  status: string;
  location: string;
  photos: { key: string }[];
};

export function ListingCard({ listing: l }: { listing: CardListing }) {
  return (
    <Link
      href={`/anuncios/${l.id}`}
      className={`card group flex h-full flex-col overflow-hidden p-0 transition hover:shadow-md ${l.status === "SOLD" ? "opacity-60" : ""}`}
    >
      <div className="relative">
        <ListingPhoto photoKey={l.photos[0]?.key} title={l.title} className="aspect-square w-full" />
        <span className="absolute left-2 top-2">
          <StatusBadge status={l.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <ListingPrice listing={l} className="text-lg leading-tight" />
        <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-800">{l.title}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-1 pt-1">
          <ConditionBadge condition={l.condition} />
          <span className="truncate text-xs text-gray-500">📍 {l.location}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingGrid({ listings }: { listings: CardListing[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <li key={l.id} className="min-w-0">
          <ListingCard listing={l} />
        </li>
      ))}
    </ul>
  );
}
