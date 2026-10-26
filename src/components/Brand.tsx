import { BRAND } from "@/lib/brand";

/** Logotipo (icono + nombre). `tone` según el fondo: oscuro (por defecto) o claro. */
export function Brand({ tone = "dark", className = "h-11 w-auto sm:h-12" }: { tone?: "dark" | "light"; className?: string }) {
  const src = tone === "dark" ? "/marca/logo-cabecera-claro.svg" : "/marca/logo-cabecera.svg";
  // eslint-disable-next-line @next/next/no-img-element -- SVG estático de la propia web
  return <img src={src} alt={BRAND.name} className={className} />;
}
