import { db } from "@/lib/db";
import { formatDate, percent } from "@/lib/format";
import { Empty } from "./ui";

/** Historial de sesiones con el adiestrador (también sirve como "tabla" de la evolución). */
export async function SessionList({
  dogId,
  renderActions,
}: {
  dogId: string;
  renderActions?: (sessionId: string) => React.ReactNode;
}) {
  const sessions = await db.trainingSession.findMany({
    where: { dogId },
    include: { exercises: { include: { exercise: true } } },
    orderBy: { date: "desc" },
  });
  if (sessions.length === 0) return <Empty>Todavía no hay sesiones.</Empty>;

  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li key={s.id} className="card space-y-2">
          <p className="font-semibold">📅 {formatDate(s.date)}</p>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="font-medium">Ejercicio</th>
                <th className="w-12 text-right font-medium">✅</th>
                <th className="w-12 text-right font-medium">❌</th>
                <th className="w-14 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {s.exercises.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 align-top">
                  <td className="py-1">
                    {e.exercise.title}
                    {e.notes && <div className="text-xs text-gray-500">{e.notes}</div>}
                  </td>
                  <td className="py-1 text-right">{e.successes}</td>
                  <td className="py-1 text-right">{e.failures}</td>
                  <td className="py-1 text-right font-semibold">{percent(e.successes, e.successes + e.failures)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.notes && <p className="whitespace-pre-line text-sm text-gray-700">{s.notes}</p>}
          {renderActions?.(s.id)}
        </li>
      ))}
    </ul>
  );
}
