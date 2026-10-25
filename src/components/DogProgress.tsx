import { getDogProgress } from "@/lib/progress";
import { ProgressChart } from "./ProgressChart";
import { Empty } from "./ui";

/** Sección "Evolución": una gráfica de % de aciertos por ejercicio. */
export async function DogProgress({ dogId }: { dogId: string }) {
  const progress = await getDogProgress(dogId);
  return (
    <section className="space-y-3">
      <h2 className="h2">Evolución</h2>
      {progress.length === 0 ? (
        <Empty>Aún no hay sesiones ni prácticas registradas.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {progress.map((p) => (
            <ProgressChart key={p.id} title={p.title} series={p.series} />
          ))}
        </div>
      )}
    </section>
  );
}
