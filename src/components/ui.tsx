import Link from "next/link";

export function PageHeader({
  title,
  back,
  subtitle,
  action,
}: {
  title: string;
  back?: { href: string; label: string };
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="muted mb-1 inline-block hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="muted mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

/** Bloque desplegable (para formularios que no hace falta ver siempre). */
export function Collapsible({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="card group" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        {title}
        <span className="text-gray-400 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">{children}</p>;
}

export function StatusBadge({ done }: { done: boolean }) {
  return done ? (
    <span className="badge bg-brand-100 text-brand-700">Hecho</span>
  ) : (
    <span className="badge bg-amber-100 text-amber-800">Pendiente</span>
  );
}
