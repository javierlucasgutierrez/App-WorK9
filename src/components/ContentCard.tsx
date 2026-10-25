import Link from "next/link";
import { formatPrice } from "@/lib/format";

type Props = {
  href: string;
  content: { title: string; summary: string; isPremium: boolean; priceCents: number | null; videoKey: string | null; videoUrl: string | null; published?: boolean };
};

export function ContentCard({ href, content: c }: Props) {
  return (
    <Link href={href} className="card block hover:border-brand-500">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">
          📘 {c.title} {(c.videoKey || c.videoUrl) && "🎬"}
        </p>
        {c.isPremium ? (
          <span className="badge shrink-0 bg-violet-100 text-violet-800">🔒 {formatPrice(c.priceCents) || "De pago"}</span>
        ) : (
          <span className="badge shrink-0 bg-brand-100 text-brand-700">Gratis</span>
        )}
      </div>
      <p className="muted mt-1">{c.summary}</p>
      {c.published === false && <p className="mt-1 text-xs font-semibold text-gray-500">Borrador (no publicado)</p>}
    </Link>
  );
}
