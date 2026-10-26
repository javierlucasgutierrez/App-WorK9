import Link from "next/link";
import { dismissReport, setListingHidden, setUserBlocked } from "@/app/actions/listings";
import { ListingPhoto } from "@/components/market/ListingPhoto";
import { Empty, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Moderación" };

// Panel de moderación: denuncias pendientes, anuncios ocultos y cuentas bloqueadas.
export default async function AdminPage() {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [reports, hidden, blocked, members, newMembers, activeListings, newListings, interests] = await Promise.all([
    db.report.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true } },
        listing: { include: { seller: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      },
    }),
    db.listing.findMany({ where: { hiddenAt: { not: null } }, orderBy: { hiddenAt: "desc" }, include: { seller: { select: { name: true } } } }),
    db.user.findMany({ where: { blockedAt: { not: null } }, orderBy: { blockedAt: "desc" } }),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.listing.count({ where: { hiddenAt: null, status: { not: "SOLD" } } }),
    db.listing.count({ where: { createdAt: { gte: weekAgo } } }),
    db.listingInterest.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const stats: [string, number, string][] = [
    ["Socios", members, `+${newMembers} esta semana`],
    ["Anuncios activos", activeListings, `+${newListings} esta semana`],
    ["«Me interesa»", interests, "esta semana"],
    ["Denuncias pendientes", reports.length, reports.length ? "revisar abajo" : "todo al día"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="🛡️ Moderación" subtitle="Solo lo ven los administradores." />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <li key={label} className="card p-3">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-brand-900">{value}</p>
            <p className="text-xs text-gray-500">{sub}</p>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="h2">Denuncias pendientes</h2>
        {reports.length === 0 ? (
          <Empty>No hay denuncias pendientes. 👍</Empty>
        ) : (
          reports.map((r) => (
            <article key={r.id} className="card space-y-3">
              <div className="flex gap-3">
                <ListingPhoto photoKey={r.listing.photos[0]?.key} title={r.listing.title} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <Link href={`/anuncios/${r.listing.id}`} className="font-semibold hover:underline">
                    {r.listing.title}
                  </Link>
                  <p className="text-sm text-gray-600">
                    De{" "}
                    <Link href={`/socios/${r.listing.sellerId}`} className="link">
                      {r.listing.seller.name}
                    </Link>{" "}
                    ({r.listing.seller.email})
                  </p>
                </div>
              </div>
              <p className="rounded-xl bg-amber-50 p-2 text-sm">
                <strong>{REPORT_REASONS[r.reason]}</strong>
                {r.details && <> — “{r.details}”</>}
                <span className="block text-xs text-gray-500">
                  Denunciado por {r.reporter.name} · {timeAgo(r.createdAt)}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={setListingHidden.bind(null, r.listing.id, true)}>
                  <button className="btn px-3 text-sm">Ocultar anuncio</button>
                </form>
                <form action={dismissReport.bind(null, r.id)}>
                  <button className="btn-secondary px-3 text-sm">Está bien, descartar</button>
                </form>
                <form action={setUserBlocked.bind(null, r.listing.sellerId, true)}>
                  <button className="btn-danger">Bloquear al anunciante</button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Anuncios ocultos ({hidden.length})</h2>
        {hidden.length === 0 ? (
          <p className="muted">Ninguno.</p>
        ) : (
          <ul className="card divide-y divide-gray-100 py-1">
            {hidden.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/anuncios/${l.id}`} className="min-w-0 truncate text-sm hover:underline">
                  {l.title} <span className="text-gray-500">· {l.seller.name}</span>
                </Link>
                <form action={setListingHidden.bind(null, l.id, false)}>
                  <button className="btn-secondary min-h-9 px-3 py-1 text-sm">Mostrar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Cuentas bloqueadas ({blocked.length})</h2>
        {blocked.length === 0 ? (
          <p className="muted">Ninguna.</p>
        ) : (
          <ul className="card divide-y divide-gray-100 py-1">
            {blocked.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate text-sm">
                  {u.name} <span className="text-gray-500">· {u.email}</span>
                </span>
                <form action={setUserBlocked.bind(null, u.id, false)}>
                  <button className="btn-secondary min-h-9 px-3 py-1 text-sm">Desbloquear</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
