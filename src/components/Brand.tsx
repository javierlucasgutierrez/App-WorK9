import { BRAND } from "@/lib/brand";

/** Logotipo de texto: nombre con el eslogan al lado. */
export function Brand({ size = "sm" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-2 text-left">
      <span className={`whitespace-nowrap font-extrabold text-brand-700 ${big ? "text-3xl" : "text-lg"}`}>
        🐾 {BRAND.name}
      </span>
      <span
        className={`border-l border-brand-500/40 pl-2 font-medium leading-tight text-gray-600 ${
          big ? "text-sm" : "text-[11px]"
        }`}
      >
        {BRAND.shortSlogan}
      </span>
    </span>
  );
}
