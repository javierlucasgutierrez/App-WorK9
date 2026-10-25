import { fileUrl } from "@/lib/storage";

/** Muestra el vídeo subido y/o el enlace externo de un ejercicio o contenido. */
export function VideoPlayer({ videoKey, videoUrl }: { videoKey?: string | null; videoUrl?: string | null }) {
  if (!videoKey && !videoUrl) return null;
  return (
    <div className="space-y-2">
      {videoKey && (
        <video
          src={fileUrl(videoKey)}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-xl bg-black"
        />
      )}
      {videoUrl && (
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
          ▶ Ver vídeo en enlace externo
        </a>
      )}
    </div>
  );
}
