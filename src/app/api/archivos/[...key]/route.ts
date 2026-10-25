import { getSession } from "@/lib/auth";
import { storage } from "@/lib/storage";

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Sirve los vídeos y fotos guardados, solo a usuarios conectados.
// Admite "Range" (peticiones por trozos), necesario para que los vídeos funcionen en iPhone.
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await getSession())) return new Response("No autorizado", { status: 401 });

  const key = (await params).key.join("/");
  const type = TYPES[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
  const rangeHeader = req.headers.get("range");
  const match = rangeHeader?.match(/bytes=(\d*)-(\d*)/);

  if (match && (match[1] || match[2])) {
    const head = await storage.read(key, { start: 0, end: 0 });
    if (!head) return new Response("No encontrado", { status: 404 });
    head.stream.cancel();
    const size = head.size;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const part = await storage.read(key, { start, end });
    if (!part) return new Response("No encontrado", { status: 404 });
    return new Response(part.stream, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  const file = await storage.read(key);
  if (!file) return new Response("No encontrado", { status: 404 });
  return new Response(file.stream, {
    headers: { "Content-Type": type, "Content-Length": String(file.size), "Accept-Ranges": "bytes" },
  });
}
