import { LISTING_CONDITION, LISTING_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

type L = { isFree: boolean; priceCents: number | null; condition: string; status: string };

export function ListingPrice({ listing }: { listing: L }) {
  return (
    <span className="font-bold text-brand-700">{listing.isFree ? "Gratis" : formatPrice(listing.priceCents)}</span>
  );
}

export function ListingBadges({ listing }: { listing: L }) {
  return (
    <span className="flex flex-wrap gap-1">
      <span className={`badge ${listing.condition === "NEW" ? "bg-sky-100 text-sky-800" : "bg-gray-100 text-gray-700"}`}>
        {LISTING_CONDITION[listing.condition]}
      </span>
      {listing.status !== "ACTIVE" && (
        <span className={`badge ${listing.status === "SOLD" ? "bg-gray-200 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
          {LISTING_STATUS[listing.status]}
        </span>
      )}
    </span>
  );
}
