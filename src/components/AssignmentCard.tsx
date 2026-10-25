import { formatDate, percent } from "@/lib/format";
import { StatusBadge } from "./ui";

type Props = {
  assignment: {
    status: string;
    instructions: string | null;
    targetReps: number | null;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    exercise: { title: string };
    homePractices: { repetitions: number; successes: number }[];
  };
  children?: React.ReactNode;
};

/** Resumen de un deber: ejercicio, indicaciones, estado y prácticas en casa. */
export function AssignmentSummary({ assignment: a, children }: Props) {
  const reps = a.homePractices.reduce((s, p) => s + p.repetitions, 0);
  const ok = a.homePractices.reduce((s, p) => s + p.successes, 0);
  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">🎯 {a.exercise.title}</p>
        <StatusBadge done={a.status === "DONE"} />
      </div>
      {a.instructions && <p className="whitespace-pre-line text-sm">{a.instructions}</p>}
      <p className="muted">
        {[
          a.targetReps ? `${a.targetReps} repeticiones/día` : null,
          a.dueDate ? `Para el ${formatDate(a.dueDate)}` : null,
          a.status === "DONE" && a.completedAt ? `Hecho el ${formatDate(a.completedAt)}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || `Mandado el ${formatDate(a.createdAt)}`}
      </p>
      {a.homePractices.length > 0 && (
        <p className="text-sm text-brand-700">
          🏠 {a.homePractices.length} prácticas en casa · {reps} repeticiones · {percent(ok, reps)}% aciertos
        </p>
      )}
      {children}
    </div>
  );
}
