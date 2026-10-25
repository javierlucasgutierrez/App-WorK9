import { BRAND } from "@/lib/brand";

/** Emblema del club: escudo con "K9". */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 2 36 8v12c0 9.5-6.8 16.2-16 18C10.8 36.2 4 29.5 4 20V8Z" fill="var(--color-jute-400)" />
      <path d="M20 5.5 33 10.4V20c0 7.8-5.5 13.4-13 15-7.5-1.6-13-7.2-13-15v-9.6Z" fill="var(--color-brand-800)" />
      <text x="20" y="25.5" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--color-jute-200)" fontFamily="system-ui, sans-serif">
        K9
      </text>
    </svg>
  );
}

/** Logotipo: emblema, nombre y el eslogan al lado. `tone` según el fondo (oscuro o claro). */
export function Brand({ size = "sm", tone = "dark" }: { size?: "sm" | "lg"; tone?: "dark" | "light" }) {
  const big = size === "lg";
  const onDark = tone === "dark";
  return (
    <span className="inline-flex items-center gap-2 text-left">
      <Logo className={big ? "h-12 w-12" : "h-9 w-9"} />
      <span className={`whitespace-nowrap font-extrabold tracking-tight ${onDark ? "text-white" : "text-brand-800"} ${big ? "text-3xl" : "text-xl"}`}>
        {BRAND.name}
      </span>
      <span
        className={`border-l pl-2 font-medium leading-tight ${
          onDark ? "border-jute-400/50 text-jute-200" : "border-brand-500/40 text-gray-600"
        } ${big ? "text-sm" : "text-[11px]"}`}
      >
        {BRAND.shortSlogan.split(" · ").map((w, i) => (
          <span key={w} className={big ? "" : "block sm:inline"}>
            {i > 0 && <span className={big ? "" : "hidden sm:inline"}> · </span>}
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}
