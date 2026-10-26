import Link from "next/link";
import { ListingPhoto } from "@/components/market/ListingPhoto";
import { ListingPrice, StatusBadge } from "@/components/market/ListingPrice";
import { Empty, Notice } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Mis anuncios" };

type Row = {
  id: string;
  title: string;
  isFree: boolean;
  priceCents: number | null;
  condition: string;
  status: string;
  hiddenAt: Date | null;
  photos: { key: string }[];
};

function ListingRow({ listing: l, extra }: { listing: Row; extra: React.ReactNode }) {
  return (
    <li>
      <Link href={`/anuncios/${l.id}`} className={`card flex gap-3 p-2.5 transition hover:shadow-md ${l.status === "SOLD" ? "opacity-70" : ""}`}>
        <ListingPhoto photoKey={l.photos[0]?.key} title={l.title} className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate font-semibold">{l.title}</p>
          <p className="flex items-center gap-2">
            <ListingPrice listing={l} className="text-sm" />
            {l.hiddenAt ? <span className="badge bg-red-100 text-red-700">Oculto por moderación</span> : <StatusBadge status={l.status} showActive />}
          </p>
          <div className="text-sm text-gray-600">{extra}</div>
        </div>
      </Link>
    </li>
  );
}

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ ver?: string; borrado?: string }> }) {
  const user = await requireUser("/mis-anuncios");
  const { ver, borrado } = await searchParams;
  const showInterests = ver === "interesan";

  const photo = { select: { key: true }, orderBy: { position: "asc" as const }, take: 1 };
  const [mine, interests] = await Promise.all([
    db.listing.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { photos: photo, _count: { select: { interests: true } } },
    }),
    db.listingInterest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { photos: photo, seller: { select: { name: true } } } } },
    }),
  ]);

  const tab = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-center text-sm font-semibold ${active ? "bg-white text-brand-800 shadow-sm" : "text-gray-600"}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="h1">Mis anuncios</h1>
        <Link href="/publicar" className="btn shrink-0">
          + Publicar
        </Link>
      </div>
      {borrado && <Notice>Anuncio borrado.</Notice>}

      <nav className="mb-4 flex gap-1 rounded-xl bg-black/5 p-1">
        <Link href="/mis-anuncios" className={tab(!showInterests)}>
          Publicados ({mine.length})
        </Link>
        <Link href="/mis-anuncios?ver=interesan" className={tab(showInterests)}>
          Me interesan ({interests.length})
        </Link>
      </nav>

      {showInterests ? (
        interests.length === 0 ? (
          <Empty>
            Aún no has pulsado «Me interesa» en ningún anuncio.{" "}
            <Link href="/anuncios" className="link">
              Echa un vistazo
            </Link>
            .
          </Empty>
        ) : (
          <ul className="space-y-2">
            {interests.map((i) => (
              <ListingRow key={i.id} listing={i.listing} extra={<>De {i.listing.seller.name} · avisaste {timeAgo(i.createdAt)}</>} />
            ))}
          </ul>
        )
      ) : mine.length === 0 ? (
        <Empty>
          <p>Aún no has publicado nada.</p>
          <p className="mt-1 text-sm">¿Tienes material que ya no usas? ¡Anímate!</p>
        </Empty>
      ) : (
        <ul className="space-y-2">
          {mine.map((l) => (
            <ListingRow
              key={l.id}
              listing={l}
              extra={
                l._count.interests > 0 ? (
                  <span className="font-semibold text-brand-700">
                    🙋 {l._count.interests} {l._count.interests === 1 ? "interesado" : "interesados"}
                  </span>
                ) : (
                  <>Sin interesados todavía · {timeAgo(l.createdAt)}</>
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
