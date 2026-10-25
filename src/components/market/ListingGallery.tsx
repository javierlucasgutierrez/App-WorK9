"use client";

import { useRef, useState } from "react";

/** Fotos del anuncio: se pasan deslizando con el dedo (o con las miniaturas en el ordenador). */
export function ListingGallery({ urls, title }: { urls: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-jute-50 text-6xl" aria-hidden>
        🦴
      </div>
    );
  }

  const goTo = (i: number) => {
    const el = strip.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      <div className="relative bg-black/90">
        <div
          ref={strip}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- fotos de nuestro propio almacenamiento
            <img
              key={url}
              src={url}
              alt={`${title} (foto ${i + 1} de ${urls.length})`}
              className="aspect-[4/3] w-full shrink-0 snap-center object-contain"
            />
          ))}
        </div>
        {urls.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            {index + 1} / {urls.length}
          </span>
        )}
      </div>
      {urls.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-brand-600" : "border-transparent opacity-70"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
