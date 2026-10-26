import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGrid } from "@/components/market/ListingCard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Empty } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatMonth } from "@/lib/format";
import { cardSelect } from "@/lib/listings";

type Props = { params: Promise<{ id: string }> };

/** Quita "https://" y la barra final para enseñar la web de forma limpia. */
const shortUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const instagramHandle = (s: string) => s.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");

async function load(id: string) {
  return db.user.findFirst({ where: { id, blockedAt: null } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = await load((await params).id);
  return member ? { title: member.name, description: member.bio ?? `${ACCOUNT_TYPES[member.accountType]} en Market Canueve K9` } : {};
}

// Escaparate público de un socio: sus datos de presentación y todos sus anuncios.
export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  const [member, viewer] = await Promise.all([load(id), getUser()]);
  if (!member) notFound();
  const listings = await db.listing.findMany({
    where: { sellerId: id, hiddenAt: null, status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    select: cardSelect,
  });
  const ig = member.instagram && instagramHandle(member.instagram);

  return (
    <div className="space-y-6">
      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <MemberAvatar member={member} className="h-20 w-20 text-3xl" />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="h1">{member.name}</h1>
          <p className="text-sm text-gray-600">
            <span className="badge mr-1 bg-brand-100 text-brand-700">{ACCOUNT_TYPES[member.accountType]}</span>
            {member.location && <>📍 {member.location} · </>}Socio desde {formatMonth(member.createdAt)}
          </p>
          {member.bio && <p className="whitespace-pre-line pt-1 text-gray-800">{member.bio}</p>}
          {(member.website || ig) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {member.website && (
                <a href={member.website} target="_blank" rel="noopener noreferrer nofollow" className="btn-secondary px-3 text-sm">
                  🌐 {shortUrl(member.website)}
                </a>
              )}
              {ig && (
                <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer nofollow" className="btn-secondary px-3 text-sm">
                  📸 @{ig}
                </a>
              )}
            </div>
          )}
        </div>
        {viewer?.id === member.id && (
          <Link href="/perfil" className="btn-secondary shrink-0 text-sm">
            ✏️ Editar mi escaparate
          </Link>
        )}
      </section>

      <section>
        <h2 className="h2 mb-3">Anuncios de {member.name.split(" ")[0]} ({listings.length})</h2>
        {listings.length ? <ListingGrid listings={listings} /> : <Empty>Ahora mismo no tiene anuncios disponibles.</Empty>}
      </section>
    </div>
  );
}
