"use client";

import { useState } from "react";

export type ProgressPoint = { t: number; pct: number; label: string };
export type ProgressSeries = { key: "session" | "home"; name: string; points: ProgressPoint[] };

// Colores validados para daltonismo; "En casa" además va con línea discontinua.
const STYLE = {
  session: { color: "#2a78d6", dash: undefined },
  home: { color: "#eb6834", dash: "6 4" },
} as const;

const W = 340;
const H = 170;
const PAD = { top: 12, right: 14, bottom: 24, left: 34 };
const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

/** Gráfica de % de aciertos a lo largo del tiempo para un ejercicio. */
export function ProgressChart({ title, series }: { title: string; series: ProgressSeries[] }) {
  const [hover, setHover] = useState<{ s: ProgressSeries; p: ProgressPoint } | null>(null);
  const visible = series.filter((s) => s.points.length > 0);
  const all = visible.flatMap((s) => s.points);
  if (all.length === 0) return null;

  let min = Math.min(...all.map((p) => p.t));
  let max = Math.max(...all.map((p) => p.t));
  if (min === max) {
    min -= 86400000;
    max += 86400000;
  }
  const x = (t: number) => PAD.left + ((t - min) / (max - min)) * (W - PAD.left - PAD.right);
  const y = (pct: number) => PAD.top + (1 - pct / 100) * (H - PAD.top - PAD.bottom);

  return (
    <figure className="card">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{title}</span>
        {visible.length > 1 && (
          <span className="flex gap-3 text-xs text-gray-600">
            {visible.map((s) => (
              <span key={s.key} className="flex items-center gap-1">
                <svg width="18" height="8" aria-hidden>
                  <line x1="1" y1="4" x2="17" y2="4" stroke={STYLE[s.key].color} strokeWidth="2" strokeDasharray={STYLE[s.key].dash} />
                </svg>
                {s.name}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Evolución de aciertos en ${title}`}>
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                {v}%
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} fontSize="10" fill="#6b7280">
            {dateFmt.format(min)}
          </text>
          <text x={W - PAD.right} y={H - 6} fontSize="10" fill="#6b7280" textAnchor="end">
            {dateFmt.format(max)}
          </text>
          {visible.map((s) => {
            const st = STYLE[s.key];
            return (
              <g key={s.key}>
                <polyline
                  fill="none"
                  stroke={st.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeDasharray={st.dash}
                  points={s.points.map((p) => `${x(p.t)},${y(p.pct)}`).join(" ")}
                />
                {s.points.map((p, i) => (
                  <g key={i}>
                    <circle cx={x(p.t)} cy={y(p.pct)} r="4.5" fill={st.color} stroke="#fff" strokeWidth="2" />
                    {/* zona de toque más grande que el punto */}
                    <circle
                      cx={x(p.t)}
                      cy={y(p.pct)}
                      r="14"
                      fill="transparent"
                      onPointerEnter={() => setHover({ s, p })}
                      onPointerLeave={() => setHover(null)}
                      onClick={() => setHover({ s, p })}
                    />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-44 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs shadow"
            style={{
              left: `${(x(hover.p.t) / W) * 100}%`,
              top: `${(y(hover.p.pct) / H) * 100}%`,
              marginTop: -8,
              // cerca de los bordes, el recuadro se alinea hacia dentro para no salirse
              transform: `translate(${x(hover.p.t) / W > 0.7 ? "-100%" : x(hover.p.t) / W < 0.3 ? "0" : "-50%"}, -100%)`,
            }}
          >
            <div className="font-semibold">{hover.p.pct}% aciertos</div>
            <div className="text-gray-600">
              {hover.s.name} · {dateFmt.format(hover.p.t)}
            </div>
            <div className="text-gray-600">{hover.p.label}</div>
          </div>
        )}
      </div>
    </figure>
  );
}
