"use client";

import { useState } from "react";

/** Precio en euros o la casilla «Lo regalo» (que desactiva el precio). */
export function PriceField({ priceCents, isFree }: { priceCents?: number | null; isFree?: boolean }) {
  const [free, setFree] = useState(!!isFree);
  return (
    <div className="grid grid-cols-2 items-end gap-3">
      <div>
        <label htmlFor="price" className="label">
          Precio (€)
        </label>
        <input
          id="price"
          name="price"
          inputMode="decimal"
          placeholder={free ? "—" : "Ej.: 45"}
          disabled={free}
          required={!free}
          defaultValue={priceCents != null ? String(priceCents / 100).replace(".", ",") : ""}
          className="input disabled:bg-gray-100"
        />
      </div>
      <label
        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 font-medium ${
          free ? "border-jute-400 bg-jute-50 text-jute-700" : "border-gray-300 bg-white"
        }`}
      >
        <input type="checkbox" name="isFree" checked={free} onChange={(e) => setFree(e.target.checked)} className="h-5 w-5 accent-jute-600" />
        🎁 Lo regalo
      </label>
    </div>
  );
}
