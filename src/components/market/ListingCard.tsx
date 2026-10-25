import Link from "next/link";
import { ListingPhoto } from "./ListingPhoto";
import { ListingBadges, ListingPrice } from "./ListingPrice";

type Props = {
  href: string;
  listing: {
    title: string;
    photoKey: string | null;
    isFree: boolean;
    priceCents: number | null;
    condition: string;
    status: string;
    location: string | null;
    category: string;
  };
};

export function ListingCard({ href, listing: l }: Props) {
  return (
    <Link
      href={href}
      className={`card flex flex-col overflow-hidden p-0 hover:border-brand-500 ${l.status === "SOLD" ? "opacity-60" : ""}`}
    >
      <ListingPhoto photoKey={l.photoKey} title={l.title} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <ListingPrice listing={l} />
        <p className="line-clamp-2 text-sm font-medium leading-snug">{l.title}</p>
        <p className="muted text-xs">{[l.category, l.location].filter(Boolean).join(" · ")}</p>
        <div className="mt-auto pt-1">
          <ListingBadges listing={l} />
        </div>
      </div>
    </Link>
  );
}
