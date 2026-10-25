import "server-only";
import { db } from "./db";
import { percent } from "./format";
import type { ProgressSeries } from "@/components/ProgressChart";

/** Evolución de un perro: % de aciertos por ejercicio, en sesiones y en casa. */
export async function getDogProgress(dogId: string) {
  const [sessionItems, practices] = await Promise.all([
    db.sessionExercise.findMany({
      where: { session: { dogId } },
      include: { session: true, exercise: true },
      orderBy: { session: { date: "asc" } },
    }),
    db.homePractice.findMany({ where: { dogId }, include: { exercise: true }, orderBy: { date: "asc" } }),
  ]);

  const byExercise = new Map<string, { title: string; series: ProgressSeries[] }>();
  const entry = (id: string, title: string) => {
    if (!byExercise.has(id)) {
      byExercise.set(id, {
        title,
        series: [
          { key: "session", name: "Con el adiestrador", points: [] },
          { key: "home", name: "En casa", points: [] },
        ],
      });
    }
    return byExercise.get(id)!;
  };

  for (const item of sessionItems) {
    const total = item.successes + item.failures;
    if (!total) continue;
    entry(item.exerciseId, item.exercise.title).series[0].points.push({
      t: item.session.date.getTime(),
      pct: percent(item.successes, total),
      label: `${item.successes} aciertos de ${total}`,
    });
  }
  for (const p of practices) {
    if (!p.repetitions) continue;
    entry(p.exerciseId, p.exercise.title).series[1].points.push({
      t: p.date.getTime(),
      pct: percent(p.successes, p.repetitions),
      label: `${p.successes} aciertos de ${p.repetitions}`,
    });
  }

  return [...byExercise.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}
