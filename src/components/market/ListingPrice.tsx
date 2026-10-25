import { LISTING_CONDITION, LISTING_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

type L = { isFree: boolean; priceCents: number | null; condition: string; status: string };

export function ListingPrice({ listing, className = "" }: { listing: L; className?: string }) {
  return listing.isFree ? (
    <span className={`font-extrabold text-jute-700 ${className}`}>🎁 Lo regalo</span>
  ) : (
    <span className={`font-extrabold text-brand-800 ${className}`}>{formatPrice(listing.priceCents)}</span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span className={`badge ${condition === "NEW" ? "bg-brand-100 text-brand-700" : "bg-jute-100 text-jute-700"}`}>
      {LISTING_CONDITION[condition]}
    </span>
  );
}

export function StatusBadge({ status, showActive = false }: { status: string; showActive?: boolean }) {
  if (status === "ACTIVE" && !showActive) return null;
  const color =
    status === "SOLD" ? "bg-gray-800 text-white" : status === "RESERVED" ? "bg-amber-400 text-amber-950" : "bg-brand-600 text-white";
  return <span className={`badge ${color}`}>{LISTING_STATUS[status]}</span>;
}
