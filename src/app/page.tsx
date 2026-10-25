import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { Brand } from "@/components/Brand";
import { BRAND } from "@/lib/brand";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10 text-center">
      <div>
        <h1 className="flex justify-center">
          <Brand size="lg" />
        </h1>
        <p className="mt-4 font-semibold text-gray-700">{BRAND.slogan}</p>
        <p className="mt-3 text-gray-600">
          El punto de encuentro del perro de trabajo: compra y vende material nuevo y de segunda mano (mordida,
          detección, rastreo…) y, si eres adiestrador, sigue la evolución de cada perro con tus clientes.
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
