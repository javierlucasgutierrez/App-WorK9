import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="text-5xl">🐕‍🦺</p>
      <h1 className="h1 mt-3">No lo encontramos</h1>
      <p className="muted mt-1">Puede que el anuncio se haya borrado o que la dirección no sea correcta.</p>
      <Link href="/anuncios" className="btn mt-5">
        Ver anuncios
      </Link>
    </div>
  );
}
