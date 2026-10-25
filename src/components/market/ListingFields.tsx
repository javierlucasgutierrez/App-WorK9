import { LISTING_CATEGORIES, LISTING_CATEGORY_HINTS } from "@/lib/constants";
import { MAX_IMAGE_MB } from "@/lib/storage";
import { Field, TextArea } from "../Field";

type Listing = {
  title: string;
  description: string;
  category: string;
  condition: string;
  isFree: boolean;
  priceCents: number | null;
  location: string | null;
  photoKey: string | null;
};

export function ListingFields({ listing }: { listing?: Listing }) {
  return (
    <div className="space-y-3">
      <Field label="¿Qué ofreces?" name="title" placeholder="Ej.: Manga de mordida de yute" defaultValue={listing?.title} required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="category" className="label">
            Categoría
          </label>
          <select id="category" name="category" className="input" defaultValue={listing?.category ?? LISTING_CATEGORIES[0]}>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c} ({LISTING_CATEGORY_HINTS[c]})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className="label">
            Estado
          </label>
          <select id="condition" name="condition" className="input" defaultValue={listing?.condition ?? "USED"}>
            <option value="USED">Segunda mano</option>
            <option value="NEW">Nuevo</option>
          </select>
        </div>
      </div>
      <TextArea
        label="Descripción"
        name="description"
        rows={4}
        placeholder="Marca, talla, nivel, estado, uso que ha tenido…"
        defaultValue={listing?.description}
        required
      />
      <div className="grid grid-cols-2 items-end gap-3">
        <Field
          label="Precio (€)"
          name="price"
          inputMode="decimal"
          placeholder="Ej.: 15"
          defaultValue={listing?.priceCents != null ? String(listing.priceCents / 100).replace(".", ",") : ""}
        />
        <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5">
          <input type="checkbox" name="isFree" defaultChecked={listing?.isFree} /> Lo regalo
        </label>
      </div>
      <Field label="Zona (opcional)" name="location" placeholder="Ej.: Sevilla centro" defaultValue={listing?.location ?? ""} />
      <div>
        <label htmlFor="photo" className="label">
          {listing?.photoKey ? "Cambiar foto" : "Foto"} (JPG, PNG o WebP, máx. {MAX_IMAGE_MB} MB)
        </label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
        <p className="muted mt-1">Desde el móvil puedes hacerla en ese momento.</p>
      </div>
    </div>
  );
}
