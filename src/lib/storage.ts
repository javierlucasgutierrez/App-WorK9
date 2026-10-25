import "server-only";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";

/**
 * "Puerta" única para guardar y leer vídeos.
 *
 * Ahora los guarda en una carpeta local (STORAGE_LOCAL_DIR). Para pasar a la nube
 * (Amazon S3, Cloudflare R2, Bunny...) basta con escribir otra implementación de
 * `Storage` y elegirla con STORAGE_DRIVER en .env. El resto de la app solo guarda
 * la "clave" del archivo en la base de datos y no cambia.
 */
export interface Storage {
  save(file: File, folder: string): Promise<string>; // devuelve la clave
  read(key: string, range?: { start: number; end?: number }): Promise<{
    stream: ReadableStream;
    size: number;
  } | null>;
  remove(key: string): Promise<void>;
}

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_VIDEO_MB = 200;

class LocalStorage implements Storage {
  constructor(private root: string) {}

  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Ruta no válida");
    return full;
  }

  async save(file: File, folder: string) {
    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".mp4";
    const key = `${folder}/${randomUUID()}${ext}`;
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));
    return key;
  }

  async read(key: string, range?: { start: number; end?: number }) {
    try {
      const full = this.resolve(key);
      const { size } = await stat(full);
      const node = createReadStream(full, range ? { start: range.start, end: range.end } : undefined);
      return { stream: Readable.toWeb(node) as ReadableStream, size };
    } catch {
      return null;
    }
  }

  async remove(key: string) {
    await unlink(this.resolve(key)).catch(() => {});
  }
}

function createStorage(): Storage {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return new LocalStorage(process.env.STORAGE_LOCAL_DIR ?? "./uploads");
  throw new Error(`STORAGE_DRIVER "${driver}" todavía no está implementado`);
}

export const storage = createStorage();

/** Dirección con la que la web pide un vídeo guardado. */
export function fileUrl(key: string) {
  return `/api/archivos/${key}`;
}

/** Valida y guarda un vídeo subido desde un formulario. Devuelve la clave o null si no hay archivo. */
export async function saveVideoFromForm(form: FormData, field: string, folder: string) {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) throw new Error("El vídeo debe ser MP4, WebM o MOV.");
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`El vídeo no puede pasar de ${MAX_VIDEO_MB} MB.`);
  return storage.save(file, folder);
}
