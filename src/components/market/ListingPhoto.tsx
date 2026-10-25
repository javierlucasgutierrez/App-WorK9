import { fileUrl } from "@/lib/files";

/** Foto del anuncio (o un hueco con icono si no tiene). */
export function ListingPhoto({ photoKey, title, className = "" }: { photoKey?: string | null; title: string; className?: string }) {
  if (!photoKey) {
    return (
      <div className={`flex items-center justify-center bg-jute-50 text-4xl ${className}`} aria-hidden>
        🦴
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- las fotos vienen de nuestro propio almacenamiento
  return <img src={fileUrl(photoKey)} alt={title} className={`object-cover ${className}`} loading="lazy" />;
}
