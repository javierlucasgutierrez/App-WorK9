// Registro de sesión: lo mínimo arriba (perro, actividad, duración) y el resto en desplegables.
// Trabajos, materiales y criterios se crean sobre la marcha y la app los recuerda.

const CHECK_SHORT = [['Sí', 'Sí'], ['A medias', '½'], ['No', 'No']];
const WORK_DETAIL_FIELDS = {
  mordida: ['reps', 'entry', 'bite', 'cut'],
  tecnico: ['reps'],
  deteccion: ['hides', 'found', 'falses', 'mark'],
  fisico: ['pmode', 'series', 'seriesTime', 'rest', 'speed', 'intensity', 'hrAvg', 'hrMax', 'link'],
};

const activityOf = (name) => settings.activities.find((a) => a.name === name);
// Tipo de un trabajo nuevo según la actividad en la que se crea.
const typeForActivity = (act) => ({ Defensa: 'mordida', Ataque: 'mordida', Ring: 'mordida', 'Detección': 'deteccion', 'Físico': 'fisico' }[act] || 'tecnico');
const GROUP_FOR_TYPE = { mordida: 'Mordida y defensa', deteccion: 'Detección', fisico: 'Trabajo físico', tecnico: 'Otras actividades' };

function fold(id, icon, title, meta, open, body, sub) {
  return `<section class="fold${sub ? ' sub' : ''}" data-open="${!!open}">
    <button type="button" class="fold-h" data-fold="${id}" aria-expanded="${!!open}">${icon ? `<span class="fico">${svgIcon(icon)}</span>` : ''}${title}<span class="meta">${meta}</span><span class="chev">${svgIcon('chev')}</span></button>
    <div class="fold-b">${open ? body : ''}</div></section>`;
}

const DRAFT_KEY = 'draft';

async function viewSession({ dogId, sessionId }) {
  const dogs = sortDogs(await DB.all('dogs'));
  if (!dogs.length) {
    setHeader('Nueva sesión', false, 'Sesión');
    app.innerHTML = '<div class="empty">Primero crea la ficha de un perro.</div><a class="btn primary" href="#/perro/nuevo/editar">＋ Nuevo perro</a>';
    return;
  }

  let session, isNew = true;
  if (sessionId) {
    session = await DB.get('sessions', sessionId);
    if (!session) return go('#/');
    session = JSON.parse(JSON.stringify(session));
    isNew = false;
  } else {
    // Si quedó una sesión a medias, se recupera.
    const draft = await DB.get('settings', DRAFT_KEY);
    if (draft?.session && (!dogId || draft.session.dogId === dogId) && await ask(`Tienes una sesión sin guardar de ${dogs.find((d) => d.id === draft.session.dogId)?.name || 'un perro'}. ¿Seguir con ella?`, 'Seguir')) {
      session = draft.session;
    } else {
      if (draft) await DB.del('settings', DRAFT_KEY);
      session = { id: uid(), dogId: dogId || (dogs.length === 1 ? dogs[0].id : ''), date: today(), activity: '', minutes: 30, exercises: [], resources: [], note: '' };
    }
  }
  session.exercises = session.exercises || [];
  session.resources = session.resources || [];

  const ui = { open: { works: true, res: false, team: false, note: false }, sub: {}, adding: false, showAllWorks: false, resDraft: null, newMat: {} };
  let dog = dogs.find((d) => d.id === session.dogId);
  let dogSessions = dog ? await DB.byDog(dog.id) : [];
  if (isNew && dog && !session.guide) prefillTeam();

  function prefillTeam() {
    const prev = sortSessions([...dogSessions])[0];
    session.guide = session.guide || prev?.guide || '';
    session.figurant = session.figurant || prev?.figurant || '';
  }

  let draftTimer, saved = false;
  const saveDraft = () => {
    if (!isNew || saved) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => DB.put('settings', { key: DRAFT_KEY, session }).catch(() => {}), 400);
  };

  // ---------- trabajos ----------
  const recentWorks = () => {
    const seen = [];
    for (const s of sortSessions([...dogSessions])) for (const e of s.exercises || []) if (!seen.includes(e.exercise)) seen.push(e.exercise);
    return seen.slice(0, 6);
  };
  function suggestedWorks() {
    const act = activityOf(session.activity);
    const own = dog?.exercises?.length ? dog.exercises : allExercises();
    const inAct = act?.groups?.length && !ui.showAllWorks
      ? settings.exGroups.filter((g) => act.groups.includes(g.name)).flatMap((g) => g.items).filter((x) => own.includes(x) || !dog?.exercises?.length)
      : own;
    const recent = recentWorks().filter((x) => !inAct.includes(x) && (ui.showAllWorks || !act?.groups?.length || exType(x) === typeForActivity(session.activity)));
    return [...new Set([...recent, ...inAct])].filter((x) => !session.exercises.some((e) => e.exercise === x));
  }
  const workCriteria = (w) => {
    const ph = getPlan(dog, w.exercise) && w.phaseId ? getPlan(dog, w.exercise).phases.find((p) => p.id === w.phaseId) : null;
    const fromPhase = criteriaList(ph);
    const own = (dog?.criteria?.[w.exercise] || []).filter((c) => !fromPhase.includes(c));
    const extra = Object.keys(w.checks || {}).filter((c) => !fromPhase.includes(c) && !own.includes(c));
    return [...fromPhase.map((c) => [c, true]), ...[...own, ...extra].map((c) => [c, false])];
  };

  function addWork(name) {
    const plan = getPlan(dog, name);
    const ph = currentPhase(plan);
    const w = { exercise: name, checks: {} };
    if (ph) { w.phaseId = ph.id; w.phaseName = `Fase ${plan.current + 1}${ph.name ? ': ' + ph.name : ''}`; }
    // Propone el material de la última vez con este perro.
    for (const s of sortSessions([...dogSessions])) {
      const prev = (s.exercises || []).find((e) => e.exercise === name && e.tool);
      if (prev) { w.tool = prev.tool; break; }
    }
    session.exercises.push(w);
    ui.sub[session.exercises.length - 1] = {};
  }

  async function createWork(name) {
    name = name.trim();
    if (!name) return;
    if (!allExercises().includes(name)) {
      const type = typeForActivity(session.activity);
      const group = settings.exGroups.find((g) => g.name === GROUP_FOR_TYPE[type]) || settings.exGroups.at(-1);
      group.items.push(name);
      await saveSettings();
    }
    if (dog?.exercises?.length && !dog.exercises.includes(name)) {
      dog.exercises.push(name);
      await DB.put('dogs', dog);
    }
    addWork(name);
  }

  // ---------- pintado ----------
  function workCard(w, i) {
    const type = exType(w.exercise);
    const sub = ui.sub[i] || (ui.sub[i] = {});
    const crits = workCriteria(w);
    const plan = getPlan(dog, w.exercise);
    const sem = plan ? semaphore(plan, dogSessions, w.exercise, dog) : null;
    const mats = [...new Set([...settings.materials, ...(w.tool ? [w.tool] : [])])];
    const pillarsSet = PILLARS.filter(([k]) => w[k]).length;
    const detailsSet = WORK_DETAIL_FIELDS[type].filter((k) => w[k] != null && w[k] !== '').length;
    return `<div class="work" data-w="${i}">
      <div class="wname">${esc(w.exercise)}<button type="button" data-delwork="${i}">Quitar</button></div>
      ${w.phaseName ? `<div class="phase-line">${dot(sem ? sem.color : 'grey')}<span>${esc(w.phaseName)}</span></div>` : ''}
      <div><div class="lbl">Material</div><div class="chips">
        ${mats.map((m) => `<button type="button" class="chip" data-mat="${i}" data-v="${esc(m)}" aria-pressed="${w.tool === m}">${esc(m)}</button>`).join('')}
        <button type="button" class="chip add" data-newmat="${i}">＋ Nuevo</button></div>
        ${ui.newMat[i] ? `<div class="addline" style="margin-top:6px"><input id="nm${i}" placeholder="Nombre del material…" autocomplete="off"><button type="button" data-addmat="${i}">Añadir</button></div>` : ''}
      </div>
      <div><div class="lbl">Criterios</div>
        ${crits.map(([c, fromPhase], ci) => `<div class="crit"><span class="cname">${esc(c)}${fromPhase ? '<small>de la fase</small>' : ''}</span>
          <div class="seg3">${CHECK_SHORT.map(([v, l]) => `<button type="button" data-crit="${i}" data-c="${esc(c)}" data-v="${v}" aria-pressed="${w.checks?.[c] === v}">${l}</button>`).join('')}</div></div>`).join('')}
        <div class="addline"><input id="nc${i}" placeholder="Añadir criterio… (ej.: muerde abajo)" autocomplete="off"><button type="button" data-addcrit="${i}">Añadir</button></div>
      </div>
      ${type !== 'fisico' ? fold(`p${i}`, '', 'Intención · precisión · control', `${pillarsSet}/3`, sub.p, `<div class="pillars">${PILLARS.map(([k, l]) =>
        `<div class="pillar"><span>${l}</span><div class="dots5">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-pil="${i}" data-k="${k}" data-n="${n}" class="${+w[k] === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>`).join('')}</div>`, true) : ''}
      ${fold(`d${i}`, '', { mordida: 'Entrada, mordida y corte', deteccion: 'Escondites y marcaje', fisico: 'Series, velocidad y pulsómetro', tecnico: 'Repeticiones' }[type], detailsSet ? `${detailsSet} datos` : 'opcional', sub.d, detailsHtml(w, i, type), true)}
      ${fold(`n${i}`, '', 'Nota', w.note ? '✎' : 'opcional', sub.n, `<textarea data-wnote="${i}" placeholder="Qué ha pasado en este trabajo…">${esc(w.note)}</textarea>`, true)}
    </div>`;
  }

  const stepperW = (i, k, v, step = 1) => `<div class="stepper"><button type="button" data-wstep="${i}" data-k="${k}" data-d="-${step}">−</button><output>${v}</output><button type="button" data-wstep="${i}" data-k="${k}" data-d="${step}">＋</button></div>`;
  const chipsW = (i, k, opts, sel) => `<div class="chips">${opts.map((o) => `<button type="button" class="chip${BAD.has(o) ? ' bad' : ''}" data-wset="${i}" data-k="${k}" data-v="${esc(o)}" aria-pressed="${sel === o}">${esc(o)}</button>`).join('')}</div>`;
  const numW = (i, k, v, ph) => `<input data-wnum="${i}" data-k="${k}" inputmode="decimal" value="${v != null && v !== '' ? esc(num(v)) : ''}" placeholder="${ph}" autocomplete="off">`;

  function detailsHtml(w, i, type) {
    if (type === 'mordida') return `
      <div><div class="lbl">Repeticiones</div>${stepperW(i, 'reps', w.reps ?? 0)}</div>
      <div><div class="lbl">Entrada</div>${chipsW(i, 'entry', settings.entries, w.entry)}</div>
      <div><div class="lbl">Mordida</div>${chipsW(i, 'bite', settings.bites, w.bite)}</div>
      <div><div class="lbl">Reacción al corte</div>${chipsW(i, 'cut', settings.cuts, w.cut)}</div>`;
    if (type === 'deteccion') return `
      <div class="row"><div><div class="lbl">Escondites</div>${stepperW(i, 'hides', w.hides ?? 0)}</div><div><div class="lbl">Encontrados</div>${stepperW(i, 'found', w.found ?? 0)}</div></div>
      <div><div class="lbl">Falsos marcajes</div>${stepperW(i, 'falses', w.falses ?? 0)}</div>
      <div><div class="lbl">Marcaje</div>${chipsW(i, 'mark', settings.marks, w.mark)}</div>`;
    if (type === 'fisico') return `
      <div><div class="lbl">Tipo</div>${chipsW(i, 'pmode', ['Continuo', 'Series'], w.pmode)}</div>
      ${w.pmode === 'Series' ? `<div class="row"><div><div class="lbl">Series</div>${stepperW(i, 'series', w.series ?? 4)}</div></div>
        <div class="row"><label class="field" style="margin:0">Cada serie (seg.)${numW(i, 'seriesTime', w.seriesTime, '30')}</label><label class="field" style="margin:0">Descanso (seg.)${numW(i, 'rest', w.rest, '60')}</label></div>` : ''}
      ${w.pmode === 'Continuo' ? `<label class="field" style="margin:0">Velocidad media (km/h)${numW(i, 'speed', w.speed, '12,5')}</label>` : ''}
      <div><div class="lbl">Intensidad</div>${chipsW(i, 'intensity', settings.intensities, w.intensity)}</div>
      <div class="row"><label class="field" style="margin:0">FC media${numW(i, 'hrAvg', w.hrAvg, '140')}</label><label class="field" style="margin:0">FC máxima${numW(i, 'hrMax', w.hrMax, '180')}</label></div>
      <label class="field" style="margin:0">Enlace de Garmin, Strava o Polar<input data-wtext="${i}" data-k="link" type="url" value="${esc(w.link)}" placeholder="https://…" autocomplete="off"></label>`;
    return `<div><div class="lbl">Repeticiones</div>${stepperW(i, 'reps', w.reps ?? 0)}</div>`;
  }

  function resourcesFold() {
    const r = ui.resDraft;
    const list = dog ? dogResources(dog) : settings.resources;
    const body = `
      ${session.resources.map((x, i) => `<div class="work">${resourceSummary(x)}<button type="button" class="btn small danger" data-delres="${i}" style="margin:0">Quitar</button></div>`).join('')}
      ${r ? `<div class="picker">
          <div class="lbl">Recurso</div><div class="chips">${list.map((x) => `<button type="button" class="chip" data-rname="${esc(x)}" aria-pressed="${r.name === x}">${esc(x)}</button>`).join('')}</div>
          <div class="lbl">Situación</div><div class="chips one-col">${settings.contexts.map((_, k) => `<button type="button" class="chip" data-rctx="${k}" aria-pressed="${r.ctx === k}">${esc(ctxLabel(k))}</button>`).join('')}</div>
          ${r.name && r.ctx != null ? (() => { const st = resourceLevel(dog, dogSessions, r.name, r.ctx); return `<div class="phase-line">${cell(st)} Ahora: ${LEVELS[st.level]}${st.tries ? ' (' + pctText(st) + ')' : ''}</div>`; })() : ''}
          <div class="row"><div><div class="lbl">Intentos</div><div class="stepper"><button type="button" data-rstep="tries" data-d="-1">−</button><output>${r.tries}</output><button type="button" data-rstep="tries" data-d="1">＋</button></div></div>
            <div><div class="lbl">Aciertos</div><div class="stepper"><button type="button" data-rstep="hits" data-d="-1">−</button><output>${r.hits}</output><button type="button" data-rstep="hits" data-d="1">＋</button></div></div></div>
          <div class="row"><button type="button" class="btn small" data-rcancel>Cancelar</button><button type="button" class="btn small primary" data-radd>Añadir recurso</button></div>
        </div>` : '<button type="button" class="btn small ghost" data-rnew>＋ Apuntar un recurso (intentos y aciertos)</button>'}`;
    return fold('res', 'pilares', 'Recursos', session.resources.length ? String(session.resources.length) : 'opcional', ui.open.res, body);
  }

  function teamFold() {
    const guides = settings.team.filter((p) => p.role === 'Guía').map((p) => p.name);
    const figs = settings.team.filter((p) => p.role !== 'Guía').map((p) => p.name);
    const sel = (k, names, cur) => {
      const all = cur && !names.includes(cur) ? [...names, cur] : names;
      return all.length
        ? `<select data-team="${k}"><option value="">—</option>${all.map((n) => `<option ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`
        : `<input data-team="${k}" value="${esc(cur)}" placeholder="Nombre" autocomplete="off">`;
    };
    const meta = [session.date === today() ? 'Hoy' : fmtDate(session.date), session.guide, session.figurant].filter(Boolean).join(' · ');
    return fold('team', 'equipo', 'Fecha y equipo', meta, ui.open.team, `
      <label class="field" style="margin:0">Fecha<input type="date" data-team="date" value="${esc(session.date)}"></label>
      <div class="row"><label class="field" style="margin:0">Guía${sel('guide', guides, session.guide)}</label><label class="field" style="margin:0">Figurante${sel('figurant', figs, session.figurant)}</label></div>
      ${settings.team.length ? '' : '<p class="hint">Añade a tu equipo en Ajustes para elegirlos de una lista.</p>'}
      ${!isNew ? '<button type="button" class="btn small danger" data-delsession>Borrar esta sesión</button>' : ''}`);
  }

  function render() {
    const y = window.scrollY;
    const marked = session.exercises.reduce((n, w) => n + Object.keys(w.checks || {}).length, 0);
    const total = session.exercises.reduce((n, w) => n + workCriteria(w).length, 0);
    setHeader(isNew ? '¿Qué habéis hecho?' : 'Editar sesión', !isNew, dog ? `Sesión · ${dog.name}` : 'Nueva sesión');
    document.body.classList.add('has-savebar');
    app.innerHTML = `
      <div class="who">${dogs.map((d) => `<button type="button" data-dog="${d.id}" aria-pressed="${session.dogId === d.id}"><i>${esc(d.name[0])}</i>${esc(d.name)}</button>`).join('')}</div>
      ${dog && (dog.redLines || []).length ? `<div class="strip-red">⛔ ${dog.redLines.map(esc).join(' · ')}</div>` : ''}
      <div class="acts">${settings.activities.map((a) => `<button type="button" class="act" data-act="${esc(a.name)}" aria-pressed="${session.activity === a.name}">${svgIcon(a.icon || 'mas')}${esc(a.name)}</button>`).join('')}
        <button type="button" class="act" data-newact>${svgIcon('mas')}Nueva</button></div>
      ${ui.newAct ? `<div class="addline" style="margin:-4px 0 12px"><input id="newAct" placeholder="Nombre de la actividad…" autocomplete="off"><button type="button" data-addact>Añadir</button></div>` : ''}
      <div class="dur"><span class="lbl" style="margin:0 4px 0 0">Duración</span>${[15, 30, 45, 60, 90].map((m) => `<button type="button" class="chip" data-min="${m}" aria-pressed="${+session.minutes === m}">${m}</button>`).join('')}
        <input id="minutes" inputmode="numeric" value="${esc(session.minutes ?? '')}" aria-label="Minutos"><span class="muted">min</span></div>

      ${fold('works', 'trabajo', 'Qué habéis trabajado', session.exercises.length ? `${session.exercises.length} · ${marked}/${total}` : 'opcional', ui.open.works, `
        ${session.exercises.map(workCard).join('')}
        ${ui.adding ? `<div class="picker">
            <div class="lbl">${session.activity ? `Trabajos de ${esc(session.activity.toLowerCase())}` : 'Trabajos'}</div>
            <div class="chips">${suggestedWorks().map((x) => `<button type="button" class="chip" data-pickwork="${esc(x)}">${esc(x)}</button>`).join('') || '<span class="hint">No hay más trabajos en esta lista.</span>'}</div>
            ${!ui.showAllWorks ? '<button type="button" class="btn small ghost" data-allworks style="margin:0">Ver todos los trabajos</button>' : ''}
            <div class="addline"><input id="newWork" placeholder="Nuevo trabajo… (ej.: morder piernas)" autocomplete="off"><button type="button" data-addwork>Crear</button></div>
            <button type="button" class="btn small" data-canceladd style="margin:0">Cerrar</button>
          </div>` : `<button type="button" class="btn small ghost" data-adding style="margin:0">＋ ${session.exercises.length ? 'Otro trabajo' : 'Añadir trabajo'}</button>`}`)}
      ${resourcesFold()}
      ${teamFold()}
      ${fold('note', 'nota', 'Nota de la sesión', session.note || session.audio ? '✎' : 'opcional', ui.open.note, `
        <textarea id="exNote" placeholder="Cómo ha ido en general…">${esc(session.note)}</textarea>
        <div class="row"><button type="button" class="btn small" id="dictate">🎙 Dictar</button><button type="button" class="btn small" id="record">⏺ Grabar audio</button></div>
        <div id="audioBox">${session.audio ? `<audio controls src="${session.audio}" style="width:100%"></audio><button type="button" class="btn small danger" id="delAudio">Borrar audio</button>` : ''}</div>`)}
      <div class="savebar"><button type="button" class="btn primary" data-save>${isNew ? 'Guardar sesión' : 'Guardar cambios'}</button></div>
    `;
    if (ui.open.note) setupVoice(app, session);
    window.scrollTo(0, y);
  }

  // ---------- acciones ----------
  app.oninput = (ev) => {
    const t = ev.target;
    if (t.id === 'minutes') { session.minutes = parseInt(t.value, 10) || ''; $$('[data-min]').forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.min === session.minutes))); }
    else if (t.id === 'exNote') session.note = t.value;
    else if (t.dataset.wnote) session.exercises[+t.dataset.wnote].note = t.value;
    else if (t.dataset.wnum) { const v = parseFloat(t.value.replace(',', '.')); session.exercises[+t.dataset.wnum][t.dataset.k] = Number.isFinite(v) ? v : ''; }
    else if (t.dataset.wtext) session.exercises[+t.dataset.wtext][t.dataset.k] = t.value.trim();
    else return;
    saveDraft();
  };
  app.onchange = (ev) => {
    const t = ev.target;
    if (!t.dataset.team) return;
    if (t.dataset.team === 'date') session.date = t.value || today();
    else session[t.dataset.team] = t.value.trim();
    saveDraft();
  };
  app.onkeydown = (ev) => {
    if (ev.key !== 'Enter' || ev.target.tagName !== 'INPUT') return;
    const map = { newWork: '[data-addwork]', newAct: '[data-addact]' };
    const id = ev.target.id;
    const btn = map[id] ? $(map[id]) : id.startsWith('nc') ? $(`[data-addcrit="${id.slice(2)}"]`) : id.startsWith('nm') ? $(`[data-addmat="${id.slice(2)}"]`) : null;
    if (btn) { ev.preventDefault(); btn.click(); }
  };

  app.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.dog) {
      if (d.dog === session.dogId) return;
      session.dogId = d.dog;
      dog = dogs.find((x) => x.id === d.dog);
      dogSessions = await DB.byDog(dog.id);
      // Los trabajos ya puestos cambian a la fase de este perro.
      for (const w of session.exercises) {
        const plan = getPlan(dog, w.exercise), ph = currentPhase(plan);
        w.phaseId = ph?.id || ''; w.phaseName = ph ? `Fase ${plan.current + 1}${ph.name ? ': ' + ph.name : ''}` : '';
      }
      if (isNew) { session.guide = ''; session.figurant = ''; prefillTeam(); }
    }
    else if (d.act) { session.activity = session.activity === d.act ? '' : d.act; if (session.activity && !session.exercises.length) { ui.open.works = true; } }
    else if ('newact' in d) ui.newAct = !ui.newAct;
    else if ('addact' in d) {
      const name = $('#newAct').value.trim();
      if (!name) return;
      if (!activityOf(name)) { settings.activities.push({ name, icon: 'mas', groups: [] }); await saveSettings(); }
      session.activity = name; ui.newAct = false;
    }
    else if (d.min) { session.minutes = +d.min; }
    else if (d.fold) {
      const k = d.fold;
      if (/^[pdn]\d+$/.test(k)) { const s = ui.sub[+k.slice(1)] || (ui.sub[+k.slice(1)] = {}); s[k[0]] = !s[k[0]]; }
      else ui.open[k] = !ui.open[k];
    }
    else if ('adding' in d) { if (!dog) { toast('Elige primero el perro'); return; } ui.adding = true; }
    else if ('canceladd' in d) { ui.adding = false; ui.showAllWorks = false; }
    else if ('allworks' in d) ui.showAllWorks = true;
    else if (d.pickwork) { addWork(d.pickwork); ui.adding = false; ui.showAllWorks = false; }
    else if ('addwork' in d) { await createWork($('#newWork').value); ui.adding = false; ui.showAllWorks = false; }
    else if (d.delwork) {
      if (!await ask(`¿Quitar «${session.exercises[+d.delwork].exercise}» de esta sesión?`)) return;
      session.exercises.splice(+d.delwork, 1);
      ui.sub = {};
    }
    else if (d.mat) { const w = session.exercises[+d.mat]; w.tool = w.tool === d.v ? '' : d.v; }
    else if (d.newmat) ui.newMat[d.newmat] = !ui.newMat[d.newmat];
    else if (d.addmat) {
      const name = $(`#nm${d.addmat}`).value.trim();
      if (!name) return;
      if (!settings.materials.includes(name)) { settings.materials.push(name); await saveSettings(); }
      session.exercises[+d.addmat].tool = name; ui.newMat[d.addmat] = false;
    }
    else if (d.crit) {
      const w = session.exercises[+d.crit];
      w.checks = { ...(w.checks || {}) };
      if (w.checks[d.c] === d.v) delete w.checks[d.c]; else w.checks[d.c] = d.v;
    }
    else if (d.addcrit) {
      const w = session.exercises[+d.addcrit];
      const name = $(`#nc${d.addcrit}`).value.trim();
      if (!name) return;
      dog.criteria = dog.criteria || {};
      dog.criteria[w.exercise] = [...new Set([...(dog.criteria[w.exercise] || []), name])];
      await DB.put('dogs', dog);
    }
    else if (d.pil) { const w = session.exercises[+d.pil]; w[d.k] = +w[d.k] === +d.n ? '' : +d.n; }
    else if (d.wset) { const w = session.exercises[+d.wset]; w[d.k] = w[d.k] === d.v ? '' : d.v; }
    else if (d.wstep) { const w = session.exercises[+d.wstep]; w[d.k] = Math.max(0, (+w[d.k] || 0) + +d.d); }
    else if ('rnew' in d) ui.resDraft = { tries: 5, hits: 0 };
    else if (d.rname) ui.resDraft.name = d.rname;
    else if (d.rctx) ui.resDraft.ctx = +d.rctx;
    else if (d.rstep) {
      const r = ui.resDraft;
      r[d.rstep] = Math.max(0, r[d.rstep] + +d.d);
      if (r.hits > r.tries) { if (d.rstep === 'hits') r.tries = r.hits; else r.hits = r.tries; }
    }
    else if ('rcancel' in d) ui.resDraft = null;
    else if ('radd' in d) {
      const r = ui.resDraft;
      if (!r.name || r.ctx == null) { toast('Elige el recurso y la situación'); return; }
      session.resources.push({ name: r.name, ctx: r.ctx, tries: r.tries, hits: r.hits });
      ui.resDraft = null;
    }
    else if (d.delres) session.resources.splice(+d.delres, 1);
    else if ('delsession' in d) {
      if (!await ask('¿Borrar la sesión entera? No se puede deshacer.')) return;
      await DB.del('sessions', session.id);
      toast('Sesión borrada');
      return go('#/perro/' + session.dogId);
    }
    else if ('save' in d) return save();
    else return;
    saveDraft();
    render();
  };

  async function save() {
    if (!session.dogId) { toast('Elige el perro'); window.scrollTo(0, 0); return; }
    if (!session.activity && !session.exercises.length && !session.resources.length) { toast('Elige la actividad'); return; }
    const noteEl = $('#exNote');
    if (noteEl) session.note = noteEl.value.trim();
    // Solo se guardan los datos que tocan a cada tipo de trabajo.
    for (const w of session.exercises) {
      const keep = new Set(['exercise', 'tool', 'checks', 'note', 'phaseId', 'phaseName', 'audio', ...WORK_DETAIL_FIELDS[exType(w.exercise)], ...(exType(w.exercise) === 'fisico' ? [] : PILLARS.map(([k]) => k))]);
      for (const k of Object.keys(w)) if (!keep.has(k) || w[k] === '' || w[k] == null) delete w[k];
      if (w.checks && !Object.keys(w.checks).length) delete w.checks;
    }
    if (!session.note) delete session.note;
    const now = new Date().toISOString();
    session.createdAt = session.createdAt || now;
    session.updatedAt = now;
    saved = true;
    clearTimeout(draftTimer);
    await DB.put('sessions', session);
    await DB.del('settings', DRAFT_KEY).catch(() => {});
    toast('Sesión guardada');
    dogTab[session.dogId] = 'historial';
    go('#/perro/' + session.dogId);
  }

  render();
}

// Resumen de una sesión para el historial.
function sessionCard(s) {
  const act = activityOf(s.activity);
  const who = [s.guide && 'Guía ' + s.guide, s.figurant && 'Fig. ' + s.figurant].filter(Boolean).join(' · ');
  return `<a class="card sess" href="#/sesion/${s.id}">
    <div class="sess-h"><span class="ico">${svgIcon(act?.icon || (s.activity ? 'mas' : 'trabajo'))}</span>
      <b>${esc(s.activity || 'Sesión')}${s.minutes ? ` · ${s.minutes} min` : ''}</b><span class="when">${fmtDate(s.date)}</span></div>
    ${who ? `<div class="hint">${esc(who)}</div>` : ''}
    ${(s.exercises || []).map((e) => exerciseSummary(e)).join('')}
    ${(s.resources || []).map(resourceSummary).join('')}
    ${s.note ? `<div class="hint" style="white-space:pre-wrap">📝 ${esc(s.note)}</div>` : ''}
  </a>`;
}

function exerciseSummary(e, linkable) {
  const phys = physicalLine(e);
  const extra = [e.tool, e.reps ? e.reps + ' rep.' : '', e.hides != null ? `${e.found ?? 0}/${e.hides} encontrados` : '', e.minutes ? e.minutes + ' min' : ''].filter(Boolean).join(' · ');
  const checks = Object.entries(e.checks || {}).map(([c, v]) => `<span class="tag ${v === 'Sí' ? 'ok' : v === 'No' ? 'bad' : ''}">${v === 'Sí' ? '✔' : v === 'No' ? '✘' : '½'} ${esc(c)}</span>`).join('');
  const tags = [e.mark, e.falses ? `${e.falses} falso${e.falses > 1 ? 's' : ''}` : '', e.entry, e.bite && e.bite !== 'No aplica' ? e.bite : '', e.cut && 'Corte: ' + e.cut]
    .filter(Boolean).map((t) => `<span class="tag${BAD.has(t.replace('Corte: ', '')) || /falsos?$/.test(t) ? ' bad' : ''}">${esc(t)}</span>`).join('');
  const pills = PILLARS.filter(([k]) => e[k]).map(([k, l]) => `${l[0]} ${e[k]}`).join(' · ');
  return `<div class="ex-line"><b>${esc(e.exercise)}</b>${extra ? ` <span class="muted">· ${esc(extra)}</span>` : ''}
    ${pills ? `<span class="muted" style="font:500 .72rem var(--label)"> · ${pills}</span>` : ''}
    ${phys ? `<div class="hint">${esc(phys)}</div>` : ''}
    ${checks || tags ? `<div>${checks}${tags}</div>` : ''}
    ${/^https?:\/\//i.test(e.link || '') && linkable ? `<a href="${esc(e.link)}" target="_blank" rel="noopener" class="ext-link">⌚ Ver actividad del reloj ↗</a>` : ''}
    ${e.note ? `<div class="hint" style="white-space:pre-wrap">📝 ${esc(e.note)}</div>` : ''}</div>`;
}
