"use client";

import { useState } from "react";

type Exercise = { id: string; title: string };

/** Filas de ejercicios de una sesión: se pueden añadir y quitar. */
export function SessionRows({ exercises, initial }: { exercises: Exercise[]; initial: string[] }) {
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : [exercises[0]?.id ?? ""]).map((id, i) => ({ key: i, id })),
  );
  const [next, setNext] = useState(rows.length);

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={row.key} className="card space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Ejercicio {i + 1}</label>
              <select name="exerciseId" defaultValue={row.id} className="input" required>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                className="btn-danger"
                aria-label="Quitar ejercicio"
                onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
              >
                ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">✅ Aciertos</label>
              <input name="successes" type="number" min={0} inputMode="numeric" defaultValue={0} className="input" />
            </div>
            <div>
              <label className="label">❌ Fallos</label>
              <input name="failures" type="number" min={0} inputMode="numeric" defaultValue={0} className="input" />
            </div>
          </div>
          <input name="exerciseNotes" placeholder="Nota sobre este ejercicio (opcional)" className="input" />
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => {
          setRows([...rows, { key: next, id: exercises[0]?.id ?? "" }]);
          setNext(next + 1);
        }}
      >
        + Añadir otro ejercicio
      </button>
    </div>
  );
}
