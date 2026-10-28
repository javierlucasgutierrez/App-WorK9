// Avance: cómo evoluciona cada perro en sus trabajos y criterios.
// Sí cuenta 100, A medias 50 y No 0. Se mira la media de las últimas veces y si sube o baja.

const CHECK_VALUE = { 'Sí': 100, 'A medias': 50, 'No': 0 };
const PROGRESS_WINDOW = 5;
const WEEKS = 8;

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function trendOf(values) {
  if (values.length < 4) return 'flat';
  const last = avg(values.slice(-3)), prev = avg(values.slice(-6, -3));
  return last - prev > 10 ? 'up' : last - prev < -10 ? 'down' : 'flat';
}

function progressData(sessions) {
  const sorted = [...sessions].sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  const groups = new Map();
  for (const s of sorted) {
    for (const e of s.exercises || []) {
      const key = e.exercise + (e.tool ? '\u0000' + e.tool : '');
      if (!groups.has(key)) groups.set(key, { name: e.exercise, material: e.tool || '', count: 0, last: s.date, crit: new Map(), pillars: { intention: [], precision: [], control: [] } });
      const g = groups.get(key);
      g.count++;
      g.last = s.date;
      for (const [c, v] of Object.entries(e.checks || {})) {
        if (!(v in CHECK_VALUE)) continue;
        if (!g.crit.has(c)) g.crit.set(c, []);
        g.crit.get(c).push(CHECK_VALUE[v]);
      }
      for (const [k] of PILLARS) if (e[k]) g.pillars[k].push(+e[k]);
    }
  }
  return [...groups.values()].sort((a, b) => b.last.localeCompare(a.last));
}

function weeklyCounts(sessions) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const counts = Array(WEEKS).fill(0);
  for (const s of sessions) {
    const [y, m, d] = s.date.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    const weekStart = new Date(y, m - 1, d - ((day.getDay() + 6) % 7));
    const idx = WEEKS - 1 - Math.round((monday - weekStart) / (7 * 86400000));
    if (idx >= 0 && idx < WEEKS) counts[idx]++;
  }
  return counts;
}

function sparkline(counts) {
  const W = 320, H = 64, max = Math.max(2, ...counts);
  const xy = counts.map((v, i) => [10 + i * ((W - 20) / (counts.length - 1)), H - 8 - (v / max) * (H - 18)]);
  const line = xy.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const [lx, ly] = xy.at(-1);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Sesiones por semana: ${counts.join(', ')}">
    <line x1="10" y1="${H - 8}" x2="${W - 10}" y2="${H - 8}" stroke="var(--line)" stroke-width="1"/>
    <polygon points="10,${H - 8} ${line} ${W - 10},${H - 8}" fill="var(--accent)" fill-opacity=".14"/>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${lx}" cy="${ly}" r="4" fill="var(--accent)"/>
  </svg>`;
}

const barColor = (p) => (p >= 80 ? 'var(--ok)' : p >= 50 ? 'var(--warn)' : 'var(--bad)');
const arrow = (t) => `<span class="tr ${t}" aria-label="${{ up: 'mejora', down: 'empeora', flat: 'igual' }[t]}">${{ up: '↑', down: '↓', flat: '→' }[t]}</span>`;

function progressHtml(dog, sessions) {
  if (!sessions.length) return `<div class="empty">Cuando registres sesiones de ${esc(dog.name)}, aquí verás cómo avanza en cada trabajo y criterio.</div>`;
  const since = new Date(Date.now() - WEEKS * 7 * 86400000).toLocaleDateString('sv');
  const recent = sessions.filter((s) => s.date >= since);
  const minutes = recent.reduce((n, s) => n + (+s.minutes || 0), 0);
  const allChecks = recent.flatMap((s) => (s.exercises || []).flatMap((e) => Object.values(e.checks || {}))).filter((v) => v in CHECK_VALUE);
  const okPct = allChecks.length ? Math.round(avg(allChecks.map((v) => CHECK_VALUE[v]))) : null;
  const groups = progressData(sessions);

  return `
    <div class="kpis">
      <div class="kpi"><b>${recent.length}</b><span>sesiones · ${WEEKS} sem.</span></div>
      <div class="kpi"><b>${minutes >= 60 ? num(Math.round(minutes / 6) / 10) + ' h' : minutes + ' min'}</b><span>de trabajo</span></div>
      <div class="kpi"><b>${okPct == null ? '—' : okPct + ' %'}</b><span>criterios cumplidos</span></div>
    </div>
    ${groups.map((g) => {
      const crits = [...g.crit.entries()].map(([c, vals]) => {
        const p = Math.round(avg(vals.slice(-PROGRESS_WINDOW)));
        return `<div class="bar"><span>${esc(c)}</span><span class="pct">${p} %</span>${arrow(trendOf(vals))}<div class="track"><i style="width:${p}%;--c:${barColor(p)}"></i></div></div>`;
      }).join('');
      const pill = PILLARS.map(([k, l]) => { const a = avg(g.pillars[k].slice(-PROGRESS_WINDOW)); return a ? `${l} ${fmtAvg(a)}` : ''; }).filter(Boolean).join(' · ');
      return `<div class="block"><div class="bh"><h3>${esc(g.name)}</h3><small>${g.material ? esc(g.material) + ' · ' : ''}${g.count} ${g.count === 1 ? 'vez' : 'veces'}</small></div>
        ${crits || '<p class="hint" style="margin:4px 0">Sin criterios marcados todavía. Añádelos al registrar la sesión.</p>'}
        ${pill ? `<p class="hint" style="margin:6px 0 0">${pill} <span class="muted">(de 5)</span></p>` : ''}</div>`;
    }).join('')}
    <div class="block"><div class="bh"><h3>Sesiones por semana</h3><small>últimas ${WEEKS} semanas</small></div>${sparkline(weeklyCounts(sessions))}</div>
  `;
}

async function viewProgress(dogId) {
  const dogs = sortDogs(await DB.all('dogs'));
  if (!dogs.length) { setHeader('Avance', false, 'Evolución'); app.innerHTML = '<div class="empty">Todavía no hay perros.</div>'; return; }
  const dog = dogs.find((d) => d.id === dogId) || dogs.find((d) => d.id === viewProgress.last) || dogs[0];
  viewProgress.last = dog.id;
  setHeader('Avance', false, [dog.name, dog.type].filter(Boolean).join(' · '));
  const sessions = await DB.byDog(dog.id);
  app.innerHTML = `
    <div class="who">${dogs.map((d) => `<button type="button" data-pdog="${d.id}" aria-pressed="${d.id === dog.id}"><i>${esc(d.name[0])}</i>${esc(d.name)}</button>`).join('')}</div>
    ${progressHtml(dog, sessions)}`;
  $$('[data-pdog]').forEach((b) => (b.onclick = () => viewProgress(b.dataset.pdog)));
}
