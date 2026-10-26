"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SIDE = 1600; // píxeles del lado mayor tras reducir
const QUALITY = 0.85;

/** Reduce la foto en el propio móvil antes de subirla (menos datos y subida más rápida). */
async function shrink(file: File): Promise<File> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // si el navegador no sabe leerla, se sube tal cual y el servidor la valida
  }
}

type Existing = { id: string; url: string };

/**
 * Elegir varias fotos (desde el móvil, también hacerlas en ese momento).
 * Envía las nuevas en el campo "photos" y las que se quitan en "removePhoto".
 */
export function PhotoPicker({
  existing = [],
  max,
  name = "photos",
  removeName = "removePhoto",
  label,
}: {
  existing?: Existing[];
  max: number;
  name?: string;
  removeName?: string;
  label?: string;
}) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  const kept = existing.filter((p) => !removed.includes(p.id));
  const total = kept.length + added.length;

  // Pasamos las fotos ya reducidas al campo real del formulario.
  useEffect(() => {
    if (!field.current) return;
    const dt = new DataTransfer();
    added.forEach((a) => dt.items.add(a.file));
    field.current.files = dt.files;
  }, [added]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, max - total);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const ready = await Promise.all(files.map(shrink));
    setAdded((prev) => [...prev, ...ready.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    setBusy(false);
  }

  const tiles = [
    ...kept.map((p) => ({ key: p.id, url: p.url, onRemove: () => setRemoved((r) => [...r, p.id]) })),
    ...added.map((a, i) => ({
      key: a.url,
      url: a.url,
      onRemove: () => setAdded((prev) => prev.filter((_, j) => j !== i)),
    })),
  ];

  return (
    <div>
      <p className="label">
        {label ?? (
          <>
            Fotos <span className="font-normal text-gray-500">({total} de {max} · la primera será la portada)</span>
          </>
        )}
      </p>
      <input ref={field} type="file" name={name} multiple={max > 1} className="hidden" aria-hidden tabIndex={-1} />
      {removed.map((id) => (
        <input key={id} type="hidden" name={removeName} value={id} />
      ))}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.key} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
            <img src={t.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && max > 1 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white">Portada</span>
            )}
            <button
              type="button"
              onClick={t.onRemove}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {total < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 text-center text-sm font-semibold text-brand-700">
            <span className="text-2xl">{busy ? "⏳" : "📷"}</span>
            {busy ? "Preparando…" : max > 1 ? "Añadir fotos" : "Añadir foto"}
            <input type="file" accept="image/*" multiple={max > 1} onChange={onPick} className="sr-only" disabled={busy} />
          </label>
        )}
      </div>
      <p className="muted mt-1">Desde el móvil puedes hacerlas en ese momento o elegirlas de la galería.</p>
    </div>
  );
}
