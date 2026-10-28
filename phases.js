// Fases de trabajo por ejercicio y semáforo para saber si el perro está listo para pasar de fase.

const PLAN_DEFAULTS = { minSessions: 3, minScore: 4 };
const ALARMS = new Set(['Con choque', 'Se queda con la presa']);

function getPlan(dog, exercise) {
  return (dog.plans || {})[exercise];
}

function currentPhase(plan) {
  return plan && plan.phases[plan.current];
}

// Mira las últimas sesiones del ejercicio en la fase actual y devuelve el color con sus motivos.
function semaphore(plan, sessions, exercise) {
  const phase = currentPhase(plan);
  if (!phase) return { color: 'grey', title: 'Sin fases', reasons: [] };
  const n = plan.minSessions || PLAN_DEFAULTS.minSessions;
  const min = plan.minScore || PLAN_DEFAULTS.minScore;

  const recent = sortSessions([...sessions])
    .map((s) => ({ date: s.date, entries: s.exercises.filter((e) => e.exercise === exercise && e.phaseId === phase.id) }))
    .filter((s) => s.entries.length)
    .slice(0, n);

  if (!recent.length) return { color: 'grey', title: 'Sin sesiones en esta fase', reasons: [], count: 0, n };

  const reasons = [];
  const all = recent.flatMap((s) => s.entries);
  const alarms = {};
  for (const e of all) for (const v of [e.entry, e.cut]) if (ALARMS.has(v)) alarms[v] = (alarms[v] || 0) + 1;

  const avgs = {};
  for (const [k] of PILLARS) {
    const vals = all.map((e) => +e[k]).filter(Boolean);
    avgs[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  let color = 'green';
  const worse = (c) => {
    const rank = { green: 0, yellow: 1, red: 2 };
    if (rank[c] > rank[color]) color = c;
  };

  for (const [v, times] of Object.entries(alarms)) {
    reasons.push(`«${v}» ${times === 1 ? '1 vez' : times + ' veces'}`);
    worse('red');
  }
  for (const [k, label] of exType(exercise) === 'fisico' ? [] : PILLARS) {
    const a = avgs[k];
    if (a === null) { reasons.push(`Falta nota de ${label.toLowerCase()}`); worse('yellow'); }
    else if (a < min - 1) { reasons.push(`${label}: ${fmtAvg(a)} (pides ${min})`); worse('red'); }
    else if (a < min) { reasons.push(`${label}: ${fmtAvg(a)} (pides ${min})`); worse('yellow'); }
  }
  if (recent.length < n) {
    reasons.unshift(`Lleva ${recent.length} de ${n} sesiones en esta fase`);
    worse('yellow');
  }

  const last = plan.current >= plan.phases.length - 1;
  const title = { green: last ? 'Fase final consolidada' : 'Listo para pasar de fase', yellow: 'Todavía no', red: 'No pasar: revisar' }[color];
  return { color, title, reasons, avgs, count: recent.length, n };
}

const fmtAvg = (a) => a.toFixed(1).replace('.', ',');
const dot = (color) => `<span class="dot ${color}" aria-hidden="true"></span>`;

// Bloque de la ficha del perro con todas sus fases.
function plansSection(dog, sessions) {
  const plans = Object.entries(dog.plans || {});
  return `
    <h2>Fases de trabajo</h2>
    ${plans.length ? '' : '<p class="muted">Aún no has creado fases para este perro.</p>'}
    ${plans.map(([ex, plan]) => {
      const ph = currentPhase(plan);
      const sem = semaphore(plan, sessions, ex);
      return `<a class="card plan-card" href="#/perro/${dog.id}/fases/${encodeURIComponent(ex)}">
        ${dot(sem.color)}
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:1.15rem">${esc(ex)}</div>
          <div>Fase ${plan.current + 1} de ${plan.phases.length}${ph?.name ? ': ' + esc(ph.name) : ''}</div>
          <div class="muted">${esc(sem.title)}</div>
        </div>
      </a>`;
    }).join('')}
    <a class="btn small" href="#/perro/${dog.id}/fases/nuevo">＋ Fases de un ejercicio</a>
  `;
}

async function viewPlan(dogId, exParam) {
  const dog = await DB.get('dogs', dogId);
  if (!dog) return (location.hash = '#/');
  if (exParam === 'nuevo') return viewPlanNew(dog);
  const exercise = decodeURIComponent(exParam);
  const plan = getPlan(dog, exercise);
  if (!plan) return location.replace('#/perro/' + dog.id);
  setHeader(exercise + ' · ' + dog.name, true);
  const sessions = await DB.byDog(dog.id);
  const sem = semaphore(plan, sessions, exercise);
  const isLast = plan.current >= plan.phases.length - 1;

  app.innerHTML = `
    <div class="sem ${sem.color}">
      ${dot(sem.color)}
      <div>
        <div style="font-weight:900;font-size:1.2rem">${esc(sem.title)}</div>
        ${sem.reasons.map((r) => `<div>• ${esc(r)}</div>`).join('')}
        <div class="muted" style="font-size:.85rem;margin-top:4px">Mira las últimas ${plan.minSessions} sesiones de esta fase. Nota mínima: ${plan.minScore} en intención, precisión y control.</div>
      </div>
    </div>
    ${plan.phases.map((ph, i) => `
      <div class="card phase${i === plan.current ? ' current' : ''}${i < plan.current ? ' done' : ''}">
        <div style="font-weight:900">${i < plan.current ? '✔ ' : i === plan.current ? '▶ ' : ''}Fase ${i + 1}${ph.name ? ': ' + esc(ph.name) : ''}</div>
        ${ph.goal ? `<div class="muted" style="margin-top:6px;font-size:.85rem">OBJETIVO</div><div style="white-space:pre-wrap">${esc(ph.goal)}</div>` : ''}
        ${ph.criteria ? `<div class="muted" style="margin-top:6px;font-size:.85rem">PARA PASAR</div><div style="white-space:pre-wrap">${esc(ph.criteria)}</div>` : ''}
      </div>`).join('')}
    ${isLast ? '' : `<button class="btn ${sem.color === 'green' ? 'primary' : ''}" id="advance">Pasar a la fase ${plan.current + 2}</button>`}
    ${plan.current > 0 ? `<button class="btn small" id="regress">Volver a la fase ${plan.current}</button>` : ''}
    <button class="btn small" id="editPlan">✏️ Editar fases</button>
    ${(plan.history || []).length ? `<h3>Cambios de fase</h3>${plan.history.slice().reverse().map((h) => `<div class="muted">${fmtDate(h.date)}: fase ${h.from + 1} → fase ${h.to + 1}</div>`).join('')}` : ''}
  `;

  const move = async (to) => {
    plan.history = [...(plan.history || []), { date: today(), from: plan.current, to }];
    plan.current = to;
    dog.updatedAt = new Date().toISOString();
    await DB.put('dogs', dog);
    toast(`Ahora en fase ${to + 1}`);
    viewPlan(dog.id, exParam);
  };
  const adv = $('#advance');
  if (adv) adv.onclick = () => {
    const warn = sem.color === 'green' ? '' : `El semáforo NO está en verde (${sem.title.toLowerCase()}).\n\n`;
    if (confirm(`${warn}¿Pasar a ${dog.name} a la fase ${plan.current + 2}?`)) move(plan.current + 1);
  };
  const reg = $('#regress');
  if (reg) reg.onclick = () => confirm(`¿Volver a la fase ${plan.current}?`) && move(plan.current - 1);
  $('#editPlan').onclick = () => editPlan(dog, exercise);
}

async function viewPlanNew(dog) {
  setHeader('Nuevas fases · ' + dog.name, true);
  const free = allExercises().filter((e) => !getPlan(dog, e) && (!(dog.exercises || []).length || dog.exercises.includes(e)));
  const others = (await DB.all('dogs')).filter((d) => d.id !== dog.id && Object.keys(d.plans || {}).length);
  app.innerHTML = `
    <p>¿Para qué ejercicio?</p>
    ${free.length ? exerciseChips('newEx', free, '') : '<p class="muted">Ya tienes fases en todos sus ejercicios.</p>'}
    <div id="copyBox"></div>
  `;
  const group = $('[data-group="newEx"]');
  if (!group) return;
  group.onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const ex = b.dataset.value;
    const sources = others.filter((d) => getPlan(d, ex));
    if (!sources.length) return editPlan(dog, ex);
    $$('.chip', group).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    $('#copyBox').innerHTML = `
      <h3>¿Copiar las fases de otro perro?</h3>
      ${sources.map((d) => `<button class="btn small" data-copy="${d.id}">Copiar de ${esc(d.name)}</button>`).join('')}
      <button class="btn primary" id="blank">Empezar en blanco</button>`;
    $('#blank').onclick = () => editPlan(dog, ex);
    $$('[data-copy]').forEach((c) => (c.onclick = () => {
      const src = getPlan(sources.find((d) => d.id === c.dataset.copy), ex);
      editPlan(dog, ex, {
        ...PLAN_DEFAULTS, minSessions: src.minSessions, minScore: src.minScore, current: 0, history: [],
        phases: src.phases.map((p) => ({ ...p, id: uid() })),
      });
    }));
  };
}

function editPlan(dog, exercise, template) {
  setHeader('Editar fases · ' + exercise, true);
  const existing = getPlan(dog, exercise);
  const plan = JSON.parse(JSON.stringify(existing || template || { ...PLAN_DEFAULTS, current: 0, history: [], phases: [] }));
  if (!plan.phases.length) plan.phases.push({ id: uid(), name: '', goal: '', criteria: '' });

  const render = () => {
    app.innerHTML = `
      <p class="muted">Cada fase con su objetivo y lo que tiene que cumplir para pasar a la siguiente. Están en orden: no se salta ninguna.</p>
      ${plan.phases.map((ph, i) => `
        <div class="card" data-phase="${i}">
          <div style="font-weight:900">Fase ${i + 1}${i === plan.current && existing ? ' (actual)' : ''}</div>
          <label class="field">Nombre<input data-k="name" value="${esc(ph.name)}" placeholder="Ej.: Entrada limpia al piquete fijo"></label>
          <label class="field">Objetivo<textarea data-k="goal" rows="3">${esc(ph.goal)}</textarea></label>
          <label class="field">Criterios para pasar<textarea data-k="criteria" rows="3">${esc(ph.criteria)}</textarea></label>
          <div class="row">
            <button type="button" class="btn small" data-up="${i}" ${i === 0 ? 'disabled' : ''}>↑ Subir</button>
            <button type="button" class="btn small danger" data-rm="${i}" ${plan.phases.length === 1 ? 'disabled' : ''}>Quitar</button>
          </div>
        </div>`).join('')}
      <button type="button" class="btn small" id="addPhase">＋ Añadir fase</button>
      <h3>Semáforo</h3>
      <div class="group"><div class="glabel">¿Cuántas sesiones mirar?</div>${chips('minSessions', ['2', '3', '4', '5'], String(plan.minSessions), 'scores')}</div>
      <div class="group"><div class="glabel">Nota mínima en los tres pilares</div>${chips('minScore', ['3', '4', '5'], String(plan.minScore), 'scores')}</div>
      <p class="muted" style="font-size:.85rem">Se pone en rojo si en esas sesiones hay «Con choque» o «Se queda con la presa», o si algún pilar está más de un punto por debajo.</p>
      <button class="btn primary" id="savePlan">Guardar fases</button>
      ${existing ? '<button class="btn danger" id="delPlan">Borrar las fases de este ejercicio</button>' : ''}
    `;
    $$('[data-phase]').forEach((card) => {
      const ph = plan.phases[+card.dataset.phase];
      $$('[data-k]', card).forEach((inp) => (inp.oninput = () => (ph[inp.dataset.k] = inp.value)));
    });
    $$('[data-up]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.up;
      [plan.phases[i - 1], plan.phases[i]] = [plan.phases[i], plan.phases[i - 1]];
      render();
    }));
    $$('[data-rm]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.rm;
      if (!confirm(`¿Quitar la fase ${i + 1}?`)) return;
      plan.phases.splice(i, 1);
      if (plan.current >= plan.phases.length) plan.current = plan.phases.length - 1;
      else if (i < plan.current) plan.current--;
      render();
    }));
    $('#addPhase').onclick = () => { plan.phases.push({ id: uid(), name: '', goal: '', criteria: '' }); render(); $$('[data-phase]').at(-1).scrollIntoView({ behavior: 'smooth' }); };
    for (const key of ['minSessions', 'minScore']) {
      $(`[data-group="${key}"]`).onclick = (ev) => {
        const b = ev.target.closest('.chip');
        if (!b) return;
        plan[key] = +b.dataset.value;
        $$(`[data-group="${key}"] .chip`).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      };
    }
    $('#savePlan').onclick = async () => {
      plan.phases.forEach((p) => { p.name = p.name.trim(); p.goal = p.goal.trim(); p.criteria = p.criteria.trim(); });
      dog.plans = { ...(dog.plans || {}), [exercise]: plan };
      dog.updatedAt = new Date().toISOString();
      await DB.put('dogs', dog);
      toast('Fases guardadas');
      location.replace(`#/perro/${dog.id}/fases/${encodeURIComponent(exercise)}`);
      if (existing) route();
    };
    const del = $('#delPlan');
    if (del) del.onclick = async () => {
      if (!confirm(`¿Borrar todas las fases de ${exercise}? Las sesiones no se borran.`)) return;
      delete dog.plans[exercise];
      await DB.put('dogs', dog);
      toast('Fases borradas');
      location.replace('#/perro/' + dog.id);
    };
  };
  render();
}
