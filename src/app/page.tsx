import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10 text-center">
      <div>
        <p className="text-5xl">🐾</p>
        <h1 className="mt-2 text-4xl font-extrabold text-brand-700">Kanu</h1>
        <p className="mt-1 font-semibold text-gray-700">Tu entrenador canino de bolsillo</p>
        <p className="mt-3 text-gray-600">
          Deberes, vídeos, sesiones y evolución de cada perro. Para adiestradores y sus familias.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/entrar" className="btn">
          Entrar
        </Link>
        <Link href="/registro" className="btn-secondary">
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
