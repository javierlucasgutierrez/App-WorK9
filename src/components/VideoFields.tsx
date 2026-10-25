import { MAX_VIDEO_MB } from "@/lib/storage";
import { Field } from "./Field";

/** Campos para subir un vídeo o poner un enlace. Si ya hay vídeo, permite quitarlo. */
export function VideoFields({ videoUrl, hasVideo }: { videoUrl?: string | null; hasVideo?: boolean }) {
  return (
    <div className="space-y-3 rounded-xl bg-gray-50 p-3">
      <div>
        <label htmlFor="video" className="label">
          {hasVideo ? "Sustituir vídeo" : "Subir vídeo"} (MP4, WebM o MOV, máx. {MAX_VIDEO_MB} MB)
        </label>
        <input id="video" name="video" type="file" accept="video/mp4,video/webm,video/quicktime" className="input" />
        <p className="muted mt-1">Desde el móvil puedes grabarlo en ese momento.</p>
      </div>
      {hasVideo && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeVideo" /> Quitar el vídeo actual
        </label>
      )}
      <Field label="…o enlace a un vídeo (YouTube, etc.)" name="videoUrl" type="url" placeholder="https://" defaultValue={videoUrl ?? ""} />
    </div>
  );
}
