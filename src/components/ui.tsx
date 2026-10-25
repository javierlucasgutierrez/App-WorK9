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
        <div className="min-w-0">
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="muted mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">{children}</div>;
}

/** Mensaje verde de confirmación (p. ej. "Anuncio publicado"). */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
      {children}
    </p>
  );
}
