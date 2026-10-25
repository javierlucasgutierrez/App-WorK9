import { Field, TextArea } from "./Field";
import { VideoFields } from "./VideoFields";

type Content = {
  title: string;
  summary: string;
  body: string;
  videoKey: string | null;
  videoUrl: string | null;
  isPremium: boolean;
  priceCents: number | null;
  published: boolean;
};

export function ContentFields({ content }: { content?: Content }) {
  return (
    <div className="space-y-3">
      <Field label="Título" name="title" defaultValue={content?.title} required />
      <Field label="Resumen (una frase)" name="summary" defaultValue={content?.summary} required />
      <TextArea label="Texto" name="body" rows={8} defaultValue={content?.body} />
      <VideoFields videoUrl={content?.videoUrl} hasVideo={!!content?.videoKey} />
      <div className="space-y-2 rounded-xl bg-gray-50 p-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={content?.published ?? true} /> Publicado (visible para clientes)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPremium" defaultChecked={content?.isPremium} /> De pago (próximamente)
        </label>
        <Field
          label="Precio (€)"
          name="price"
          inputMode="decimal"
          placeholder="Ej.: 4,99"
          defaultValue={content?.priceCents != null ? (content.priceCents / 100).toFixed(2).replace(".", ",") : ""}
        />
      </div>
    </div>
  );
}
