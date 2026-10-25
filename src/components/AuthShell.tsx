export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-2 md:py-8">
      <div className="card p-6">
        <h1 className="h1">{title}</h1>
        {intro && <p className="muted mt-1">{intro}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
