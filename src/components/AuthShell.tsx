import Link from "next/link";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-3xl font-extrabold text-brand-700">
        🐾 WorK9
      </Link>
      <div className="card p-6">
        <h1 className="h1 mb-5">{title}</h1>
        {children}
      </div>
    </main>
  );
}
