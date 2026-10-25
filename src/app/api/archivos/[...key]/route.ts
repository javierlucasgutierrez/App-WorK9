import { storage } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Sirve las fotos guardadas. Son públicas, como los anuncios.
// Cada foto tiene un nombre único que no cambia, así que el navegador puede guardarla en caché.
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const type = TYPES[key.split(".").pop()?.toLowerCase() ?? ""];
  if (!type) return new Response("No encontrado", { status: 404 });
  const file = await storage.read(key);
  if (!file) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
