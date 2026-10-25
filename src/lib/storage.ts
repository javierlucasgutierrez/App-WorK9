import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * "Puerta" única para guardar y leer archivos (las fotos de los anuncios).
 *
 * Ahora los guarda en una carpeta local (STORAGE_LOCAL_DIR). Para pasar a la nube
 * (Amazon S3, Cloudflare R2, Bunny...) basta con escribir otra implementación de
 * `Storage` y elegirla con STORAGE_DRIVER en .env. El resto de la app solo guarda
 * la "clave" del archivo en la base de datos y no cambia.
 */
export interface Storage {
  save(file: File, folder: string): Promise<string>; // devuelve la clave
  read(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_MB = 10;

// Extensión según el tipo real del archivo (no según el nombre que traiga).
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

class LocalStorage implements Storage {
  constructor(private root: string) {}

  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Ruta no válida");
    return full;
  }

  async save(file: File, folder: string) {
    const key = `${folder}/${randomUUID()}${EXTENSIONS[file.type] ?? ".bin"}`;
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));
    return key;
  }

  async read(key: string) {
    try {
      return await readFile(this.resolve(key));
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

/** Lee las fotos de un formulario y comprueba que son válidas (sin guardarlas todavía). */
export function photosFromForm(form: FormData, field: string, max: number) {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > max) throw new Error(`Puedes subir como máximo ${max} fotos.`);
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Las fotos deben ser JPG, PNG o WebP.");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Cada foto puede ocupar como máximo ${MAX_IMAGE_MB} MB.`);
  }
  return files;
}
