// Recursos: lo que el perro sabe hacer y en qué situación lo sabe hacer.
// El nivel sale de los intentos y aciertos de las últimas sesiones; el guía puede corregirlo a mano.

const LEVELS = ['Sin trabajar', 'Aprendiendo', 'Con ayuda', 'Lo hace solo', 'Consolidado'];
const RES_WINDOW = 3; // sesiones que se miran
const CHECKS = ['Sí', 'A medias', 'No'];

const dogResources = (dog) => (dog.resources && dog.resources.length ? dog.resources : settings.resources);
const ctxName = (i) => settings.contexts[i] || `Situación ${i + 1}`;
const ctxLabel = (i) => `${i + 1}. ${ctxName(i)}`;
const criteriaList = (ph) => lines(ph && ph.criteria);

function resourceStat(sessions, res, ctx) {
  const recent = sortSessions([...sessions])
    .map((s) => (s.resources || []).filter((r) => r.name === res && r.ctx === ctx))
    .filter((a) => a.length)
    .slice(0, RES_WINDOW);
  let tries = 0, hits = 0;
  for (const r of recent.flat()) { tries += r.tries || 0; hits += r.hits || 0; }
  if (!tries) return { level: 0, tries: 0, hits: 0, sessions: 0 };
  const pct = hits / tries;
  // Menos de la mitad: aprendiendo. Hasta el 80 %: con ayuda. Desde el 80 %: lo hace solo,
  // y consolidado cuando lo mantiene en las últimas sesiones.
  const level = pct < 0.5 ? 1 : pct < 0.8 ? 2 : recent.length < RES_WINDOW ? 3 : 4;
  return { level, pct, tries, hits, sessions: recent.length };
}

function resourceLevel(dog, sessions, res, ctx) {
  const stat = resourceStat(sessions, res, ctx);
  const manual = dog.resLevels?.[res]?.[ctx];
  return manual != null ? { ...stat, level: manual, manual: true } : stat;
}

const pctText = (st) => (st.tries ? Math.round(st.pct * 100) + ' %' : '');

function cell(st) {
  return `<span class="cell l${st.level}" title="${esc(LEVELS[st.level])}">${st.manual ? '✎' : st.tries ? Math.round(st.pct * 100) : ''}</span>`;
}

function resourcesSection(dog, sessions) {
  const list = dogResources(dog);
  return `
    <h2>Recursos</h2>
    <p class="muted" style="font-size:.85rem;margin-top:0">Lo que sabe hacer en cada situación, de más fácil (1) a más difícil (${settings.contexts.length}).</p>
    <div class="res-head"><span></span>${settings.contexts.map((_, i) => `<span>${i + 1}</span>`).join('')}</div>
    ${list.map((res) => `<a class="res-row" href="#/perro/${dog.id}/recurso/${encodeURIComponent(res)}">
      <span class="res-name">${esc(res)}</span>${settings.contexts.map((_, i) => cell(resourceLevel(dog, sessions, res, i))).join('')}
    </a>`).join('')}
    <details class="legend"><summary>Qué significa cada color y número</summary>
      ${settings.contexts.map((c, i) => `<div><b>${i + 1}</b> ${esc(c)}</div>`).join('')}
      <div style="margin-top:8px">${LEVELS.map((l, i) => `<span class="cell l${i}"></span> ${l}`).join('<br>')}</div>
      <div class="muted" style="margin-top:8px">El número es el % de aciertos en sus últimas ${RES_WINDOW} sesiones. ✎ = nivel puesto a mano.</div>
    </details>
    <a class="btn small" href="#/perro/${dog.id}/recursos">Elegir qué recursos trabajo con ${esc(dog.name)}</a>
  `;
}

async function viewResource(dogId, resParam) {
  const dog = await DB.get('dogs', dogId);
  if (!dog) return go('#/');
  const res = decodeURIComponent(resParam);
  setHeader(res + ' · ' + dog.name, true);
  const sessions = await DB.byDog(dog.id);
  const history = sortSessions([...sessions]).flatMap((s) => (s.resources || []).filter((r) => r.name === res).map((r) => ({ ...r, date: s.date })));

  app.innerHTML = `
    ${settings.contexts.map((c, i) => {
      const st = resourceLevel(dog, sessions, res, i);
      const auto = resourceStat(sessions, res, i);
      return `<div class="card">
        <div style="display:flex;gap:12px;align-items:center">${cell(st)}
          <div style="flex:1;min-width:0"><div style="font-weight:800">${esc(ctxLabel(i))}</div>
          <div>${LEVELS[st.level]}${auto.tries ? ` · ${auto.hits} de ${auto.tries} (${pctText(auto)}) en ${auto.sessions} ses.` : ''}</div></div>
        </div>
        <div class="glabel" style="margin-top:10px;font-weight:700;font-size:.9rem">Nivel</div>
        ${chips('lvl:' + i, ['Automático', ...LEVELS], st.manual ? LEVELS[st.level] : 'Automático')}
      </div>`;
    }).join('')}
    <h3>Historial</h3>
    ${history.length ? history.map((h) => `<div class="muted">${fmtDate(h.date)} · ${h.ctx + 1}. ${esc(ctxName(h.ctx))}: <b>${h.hits} de ${h.tries}</b></div>`).join('') : '<p class="muted">Todavía no has registrado este recurso. Se apunta desde «＋ Sesión» → «＋ Recurso».</p>'}
  `;

  $$('[data-group^="lvl:"]').forEach((group) => (group.onclick = async (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const ctx = +group.dataset.group.split(':')[1];
    dog.resLevels = dog.resLevels || {};
    dog.resLevels[res] = dog.resLevels[res] || {};
    if (b.dataset.value === 'Automático') delete dog.resLevels[res][ctx];
    else dog.resLevels[res][ctx] = LEVELS.indexOf(b.dataset.value);
    dog.updatedAt = new Date().toISOString();
    await DB.put('dogs', dog);
    toast('Nivel guardado');
    viewResource(dogId, resParam);
  }));
}

async function viewResourcesPick(dogId) {
  const dog = await DB.get('dogs', dogId);
  if (!dog) return go('#/');
  setHeader('Recursos · ' + dog.name, true);
  const chosen = new Set(dogResources(dog));
  const all = [...new Set([...settings.resources, ...chosen])];
  app.innerHTML = `
    <p>Marca los recursos que trabajas con ${esc(dog.name)}. Puedes añadir más en Ajustes → Listas.</p>
    <div class="chips" data-group="pick">${all.map((r) => `<button type="button" class="chip" data-value="${esc(r)}" aria-pressed="${chosen.has(r)}">${esc(r)}</button>`).join('')}</div>
    <button class="btn primary" id="savePick">Guardar</button>
  `;
  $('[data-group="pick"]').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const v = b.dataset.value;
    if (chosen.has(v)) chosen.delete(v); else chosen.add(v);
    b.setAttribute('aria-pressed', String(chosen.has(v)));
  };
  $('#savePick').onclick = async () => {
    dog.resources = all.filter((r) => chosen.has(r));
    dog.updatedAt = new Date().toISOString();
    await DB.put('dogs', dog);
    toast('Recursos guardados');
    go('#/perro/' + dog.id);
  };
}

const resourceSummary = (r) => `<div class="ex-line"><b>${esc(r.name)}</b> <span class="muted">· ${esc(ctxLabel(r.ctx))}</span>
  <div style="font-size:1.1rem;font-weight:800">${r.hits} de ${r.tries} aciertos</div>${r.note ? `<div class="muted">📝 ${esc(r.note)}</div>` : ''}</div>`;

// Estado de los recursos que pide una fase.
function requirementsHtml(dog, sessions, reqs) {
  return `<div style="margin-top:6px"><div class="muted" style="font-size:.85rem">RECURSOS QUE NECESITA</div>${reqs.map((r) => {
    const st = resourceLevel(dog, sessions, r.res, r.ctx);
    return `<div style="display:flex;gap:8px;align-items:center;margin-top:4px">${cell(st)}<span>${esc(r.res)} · ${esc(ctxLabel(r.ctx))} <span class="muted">(${LEVELS[st.level]})</span></span></div>`;
  }).join('')}</div>`;
}
