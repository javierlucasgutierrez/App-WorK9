import { LISTING_CATEGORIES, LISTING_CATEGORY_HINTS, LISTING_CONDITION, MAX_PHOTOS } from "@/lib/constants";
import { Choice, Field, TextArea } from "../Field";
import { PhotoPicker } from "./PhotoPicker";
import { PriceField } from "./PriceField";

type Listing = {
  title: string;
  description: string;
  category: string;
  condition: string;
  isFree: boolean;
  priceCents: number | null;
  location: string;
};

/** Campos del formulario de anuncio (para publicar y para editar). */
export function ListingFields({
  listing,
  photos,
  defaultLocation,
  zones,
}: {
  listing?: Listing;
  photos?: { id: string; url: string }[];
  defaultLocation?: string | null;
  zones: string[];
}) {
  return (
    <div className="space-y-4">
      <PhotoPicker existing={photos} max={MAX_PHOTOS} />
      <Field label="¿Qué ofreces?" name="title" placeholder="Ej.: Manga de mordida de yute" defaultValue={listing?.title} required maxLength={90} />
      <div>
        <label htmlFor="category" className="label">
          Categoría
        </label>
        <select id="category" name="category" className="input" defaultValue={listing?.category ?? ""} required>
          <option value="" disabled>
            Elige una categoría
          </option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} ({LISTING_CATEGORY_HINTS[c]})
            </option>
          ))}
        </select>
      </div>
      <Choice
        label="Estado"
        name="condition"
        options={[["USED", LISTING_CONDITION.USED], ["NEW", LISTING_CONDITION.NEW]]}
        defaultValue={listing?.condition ?? "USED"}
      />
      <TextArea
        label="Descripción"
        name="description"
        rows={5}
        placeholder="Marca, talla, nivel, cuánto uso ha tenido, si incluye algo más…"
        defaultValue={listing?.description}
        required
      />
      <PriceField priceCents={listing?.priceCents} isFree={listing?.isFree} />
      <Field
        label="Zona o ciudad"
        name="location"
        placeholder="Ej.: Sevilla"
        defaultValue={listing?.location ?? defaultLocation ?? ""}
        list="zonas"
        required
      />
      <datalist id="zonas">
        {zones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
    </div>
  );
}
