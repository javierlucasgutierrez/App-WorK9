// Impacto K9 · Pista — etapa 1: fichas de perro, registro rápido de sesión y copia de seguridad.

const DEFAULTS = {
  // type: 'mordida' (entrada, mordida y corte), 'tecnico' (notas de los tres pilares),
  // 'deteccion' (escondites, encontrados, falsos marcajes y tipo de marcaje) o 'fisico' (minutos e intensidad).
  exGroups: [
    { name: 'Mordida y defensa', type: 'mordida', items: ['Marcaje', 'Ataque frontal', 'Ataque lanzado', 'Ataque con huida', 'Ataque detenido', 'Defensa del guía', 'Guarda', 'Guarda de objeto', 'Búsqueda y ladrido', 'Escolta', 'Conducción', 'Cacheo'] },
    { name: 'Obediencia', type: 'tecnico', items: ['Obediencia', 'Posiciones', 'Junto', 'Rechazo de comida', 'Envío'] },
    { name: 'Saltos', type: 'tecnico', items: ['Salto de valla', 'Palizada', 'Salto de longitud'] },
    { name: 'Detección', type: 'deteccion', items: ['Detección', 'Búsqueda en vehículos', 'Búsqueda en inmuebles', 'Búsqueda en equipajes', 'Búsqueda en personas', 'Discriminación de distractores'] },
    { name: 'C-IED', type: 'deteccion', items: ['Búsqueda en ruta', 'Búsqueda en área abierta', 'Búsqueda en zona urbana', 'Trabajo a distancia', 'Dirección a distancia', 'Marcaje pasivo a distancia'] },
    { name: 'Rescate', type: 'deteccion', items: ['Búsqueda en grandes áreas', 'Búsqueda en escombros', 'Venteo', 'Rastreo de persona', 'Ladrido de aviso', 'Superficies inestables'] },
    { name: 'Olfato', type: 'tecnico', items: ['Rastreo', 'Búsqueda de objetos'] },
    { name: 'Trabajo mental', type: 'tecnico', items: ['Foco activo', 'Frustración controlada', 'Autocontrol', 'Juegos de olfato'] },
    { name: 'Otras actividades', type: 'tecnico', items: ['Discos', 'Agility'] },
    { name: 'Trabajo físico', type: 'fisico', items: ['Calentamiento', 'Carrera / resistencia', 'Fuerza', 'Propiocepción', 'Natación', 'Estiramientos'] },
  ],
  activities: [
    { name: 'Paseo', icon: 'paseo', groups: ['Trabajo mental', 'Olfato', 'Obediencia'] },
    { name: 'Obediencia', icon: 'obediencia', groups: ['Obediencia', 'Saltos', 'Trabajo mental'] },
    { name: 'Defensa', icon: 'defensa', groups: ['Mordida y defensa'] },
    { name: 'Ataque', icon: 'ataque', groups: ['Mordida y defensa'] },
    { name: 'Ring', icon: 'ring', groups: ['Obediencia', 'Saltos', 'Mordida y defensa'] },
    { name: 'Detección', icon: 'deteccion', groups: ['Detección', 'C-IED', 'Rescate', 'Olfato'] },
    { name: 'Físico', icon: 'fisico', groups: ['Trabajo físico'] },
  ],
  materials: ['Manga', 'Jambier', 'Sin jambier', 'Traje', 'Bocado', 'Piquete móvil', 'Piquete fijo', 'Trabajo con elástico', 'Libre'],
  dogTypes: ['Mascota', 'Ring francés', 'Seguridad y combate', 'Detección', 'C-IED', 'Rescate'],
  resources: ['Sentarse', 'Tumbarse', 'De pie', 'Venir (llamada)', 'Junto', 'Quieto (permanencia)', 'Soltar', 'Vuelta al guía',
    'Foco activo', 'Morder arriba', 'Mordida profunda y estable', 'Cambio de presa', 'Ladrido en marcaje'],
  contexts: ['Con el guía, sin distracciones', 'En pista, sin figurante', 'Figurante a distancia', 'Delante del figurante (presa a la vista)', 'Figurante activo / con presión'],
  marks: ['Marcaje pasivo limpio', 'Marcaje dudoso', 'Marcaje activo (rasca o muerde)', 'Ladrido de aviso', 'Sin marcaje'],
  intensities: ['Suave', 'Media', 'Alta'],
  tools: ['Piquete móvil', 'Piquete fijo', 'Trabajo con elástico', 'Libre'],
  entries: ['Entrada limpia', 'Con rebote', 'Con choque'],
  bites: ['Mordida profunda y estable', 'Superficial', 'Remordida', 'Inestable', 'No aplica'],
  cuts: ['Limpia', 'Con conflicto', 'Se queda con la presa'],
  levels: ['Iniciación', 'En formación', 'Avanzado', 'Competición'],
  roles: ['Guía', 'Figurante constructor', 'Figurante de competición'],
  team: [],
  lastBackup: null,
};
// Respuestas que se marcan en rojo en el historial.
const BAD = new Set(['No', 'Con choque', 'Se queda con la presa', 'Inestable', 'Marcaje activo (rasca o muerde)', 'Sin marcaje']);
const ALL_FIELDS = ['tool', 'reps', 'minutes', 'intensity', 'pmode', 'speed', 'series', 'seriesTime', 'rest', 'hrAvg', 'hrMax', 'link',
  'hides', 'found', 'falses', 'mark', 'intention', 'precision', 'control', 'entry', 'bite', 'cut'];
const numInput = (id, value, placeholder, decimal) =>
  `<input id="${id}" type="text" inputmode="${decimal ? 'decimal' : 'numeric'}" value="${value != null && value !== '' ? esc(num(value)) : ''}" placeholder="${placeholder}" autocomplete="off">`;
const PILLARS = [['intention', 'Intención'], ['precision', 'Precisión'], ['control', 'Control']];

let settings = { ...DEFAULTS };

const allExercises = () => settings.exGroups.flatMap((g) => g.items);
const exType = (name) => (settings.exGroups.find((g) => g.items.includes(name)) || { type: 'tecnico' }).type;

// Botones de ejercicios agrupados por tipo de trabajo. Solo muestra los de la lista "names".
function exerciseChips(group, names, selected, multi) {
  const known = new Set(allExercises());
  const groups = [...settings.exGroups.map((g) => ({ name: g.name, items: g.items.filter((i) => names.includes(i)) })),
    { name: 'Otros', items: names.filter((n) => !known.has(n)) }];
  const isOn = (o) => (multi ? selected.includes(o) : o === selected);
  return `<div class="chips" data-group="${group}"${multi ? ' data-multi="1"' : ''}>${groups.filter((g) => g.items.length).map((g) =>
    `<div class="chip-head">${esc(g.name)}</div>${g.items.map((o) => `<button type="button" class="chip" data-value="${esc(o)}" aria-pressed="${isOn(o)}">${esc(o)}</button>`).join('')}`).join('')}</div>`;
}

// ---------- utilidades ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const today = () => new Date().toLocaleDateString('sv'); // AAAA-MM-DD en hora local
const lines = (txt) => String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean);

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function age(birth) {
  if (!birth) return '';
  const b = new Date(birth), n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) months--;
  if (months < 0) return '';
  if (months < 24) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const y = Math.floor(months / 12);
  return `${y} años`;
}

// ---------- navegación ----------
// En el móvil se usa la dirección (#/...) para que funcione el botón atrás del teléfono.
// Dentro del chat de Claude eso no se puede, así que se lleva la cuenta aquí.
const IN_CHAT = !!window.IMPACTO_ARTIFACT;
let stack = ['#/'];
const currentPath = () => (IN_CHAT ? stack[stack.length - 1] : location.hash || '#/');

// Ir a otra pantalla sustituyendo la actual (tras guardar o borrar).
function go(path) {
  if (IN_CHAT) { stack[stack.length - 1] = path; route(); }
  else if (location.hash === path) route();
  else location.replace(path);
}
function goBack() {
  if (IN_CHAT) {
    if (stack.length > 1) { stack.pop(); route(); } else go('#/');
  } else if (history.length > 1) history.back();
  else go('#/');
}
if (IN_CHAT) {
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#/"]');
    if (!a) return;
    ev.preventDefault();
    const href = a.getAttribute('href');
    if (a.dataset.tab) stack = [href]; else stack.push(href);
    route();
  });
}

// ---------- avisos propios (sustituyen a las ventanas del navegador) ----------
function dialog(message, buttons) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
      <p class="modal-msg"></p>
      <div class="row">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>
    </div>`;
    $('.modal-msg', wrap).textContent = message;
    wrap.onclick = (ev) => {
      const b = ev.target.closest('[data-i]');
      if (!b) return;
      wrap.remove();
      resolve(buttons[+b.dataset.i].value);
    };
    document.body.appendChild(wrap);
    $$('button', wrap).at(-1).focus();
  });
}
const ask = (message, ok = 'Sí') => dialog(message, [{ label: 'Cancelar', value: false }, { label: ok, value: true, cls: 'primary' }]);
const notify = (message) => dialog(message, [{ label: 'Vale', value: true, cls: 'primary' }]);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function setHeader(title, showBack, eyebrow = '') {
  $('#title').textContent = title;
  $('#eyebrow').textContent = eyebrow;
  $('#eyebrow').hidden = !eyebrow;
  $('#back').hidden = !showBack;
}

const ICONS = {
  paseo: '<path d="M7 20l2-6 3 2v4M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 14l1-5 4 2 2 3M14 11l3-1"/>',
  obediencia: '<path d="M6 20v-5l3-3V7a3 3 0 0 1 6 0v3l3 3v7M9 20v-3M15 20v-3"/>',
  defensa: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
  ataque: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ring: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  deteccion: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  fisico: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  trabajo: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  pilares: '<path d="M6 20V10M12 20V4M18 20v-7"/>',
  equipo: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M16 11a3 3 0 1 0 0-6M21 20c0-3-2-5-4-5.5"/>',
  nota: '<path d="M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5"/>',
};
const svgIcon = (k) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.mas}</svg>`;

function photoHtml(dog, big) {
  return dog.photo
    ? `<img class="photo${big ? ' big' : ''}" src="${dog.photo}" alt="">`
    : `<div class="photo${big ? ' big' : ''}">${esc((dog.name || '?')[0].toUpperCase())}</div>`;
}

function redLinesHtml(dog, compact) {
  const rl = dog.redLines || [];
  if (!rl.length) return '';
  return `<div class="redlines${compact ? ' compact' : ''}">
    <div class="label">⛔ Líneas rojas</div>
    <ul>${rl.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  </div>`;
}

function chips(group, options, selected, extraClass = '') {
  return `<div class="chips ${extraClass}" data-group="${group}">${options
    .map((o) => `<button type="button" class="chip${BAD.has(o) ? ' bad' : ''}" data-value="${esc(o)}" aria-pressed="${o == selected}">${esc(o)}</button>`)
    .join('')}</div>`;
}

async function saveSettings() {
  await DB.put('settings', { key: 'main', ...settings });
}

const sortDogs = (dogs) => dogs.sort((a, b) => a.name.localeCompare(b.name, 'es'));
const sortSessions = (s) => s.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));

// ---------- pantallas ----------
const app = $('#app');

// Color de cada perro según el peor semáforo de sus fases.
function dogStatus(dog, sessions) {
  const rank = { red: 3, yellow: 2, green: 1, grey: 0 };
  let worst = 'grey';
  for (const [ex, plan] of Object.entries(dog.plans || {})) {
    const c = semaphore(plan, sessions, ex, dog).color;
    if (rank[c] > rank[worst]) worst = c;
  }
  return { red: 'var(--bad)', yellow: 'var(--warn)', green: 'var(--ok)', grey: 'var(--line)' }[worst];
}

async function viewHome() {
  setHeader('Mis perros', false, new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }));
  const dogs = sortDogs(await DB.all('dogs'));
  const sessions = sortSessions(await DB.all('sessions'));
  const byDog = {};
  for (const s of sessions) (byDog[s.dogId] = byDog[s.dogId] || []).push(s);
  const names = Object.fromEntries(dogs.map((d) => [d.id, d.name]));

  app.innerHTML = `
    ${backupBanner(sessions)}
    ${dogs.length ? '' : `<div class="empty">Todavía no hay perros.</div>
      <button class="btn primary" id="starter">Crear las fichas de Aston, Ares, Batman y Dardo</button>`}
    <div class="dogs">${dogs.map((d) => {
      const last = (byDog[d.id] || [])[0];
      return `<a class="dog" href="#/perro/${d.id}" style="--ring:${dogStatus(d, byDog[d.id] || [])}">
        ${photoHtml(d)}
        <div class="name">${esc(d.name)}</div>
        <div class="sub">${esc([d.type, d.breed].filter(Boolean).join(' · ') || 'Sin datos')}</div>
        <div class="last"><span class="light"></span>${last ? `${esc(fmtShort(last.date))}${last.activity ? ' · ' + esc(last.activity) : ''}` : 'Sin sesiones'}</div>
        ${(d.redLines || []).length ? `<div class="reds">⛔ ${d.redLines.length} línea${d.redLines.length > 1 ? 's' : ''} roja${d.redLines.length > 1 ? 's' : ''}</div>` : ''}
      </a>`;
    }).join('')}</div>
    ${sessions.length ? `<div class="panel"><h3>Últimas sesiones</h3><div class="feed">${sessions.slice(0, 5).map((s) => {
      const act = activityOf(s.activity);
      const works = (s.exercises || []).map((e) => e.exercise);
      return `<a href="#/sesion/${s.id}"><span class="ico">${svgIcon(act?.icon || 'trabajo')}</span>
        <span style="min-width:0">${esc(names[s.dogId] || '¿?')} · ${esc(s.activity || 'Sesión')}${s.minutes ? ` ${s.minutes} min` : ''}
        <small>${esc(fmtShort(s.date))}${works.length ? ' · ' + esc(works.slice(0, 2).join(', ')) + (works.length > 2 ? '…' : '') : ''}</small></span></a>`;
    }).join('')}</div></div>` : ''}
    <a class="btn ghost" href="#/perro/nuevo/editar">＋ Nuevo perro</a>
  `;
  const st = $('#starter');
  if (st) st.onclick = async () => {
    const now = new Date().toISOString();
    for (const d of STARTER_DOGS) await DB.put('dogs', { id: uid(), redLines: [], createdAt: now, updatedAt: now, ...d });
    toast('Fichas creadas. Complétalas cuando puedas.');
    viewHome();
  };
}

// Fecha corta: hoy, ayer, o día y mes.
function fmtShort(iso) {
  const t = today();
  if (iso === t) return 'Hoy';
  const y = new Date(Date.now() - 86400000).toLocaleDateString('sv');
  if (iso === y) return 'Ayer';
  const [yy, m, d] = iso.split('-').map(Number);
  return new Date(yy, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Perros de Javier, para no tener que crearlos uno a uno.
const RING = ['Obediencia', 'Junto', 'Posiciones', 'Rechazo de comida', 'Envío', 'Salto de valla', 'Palizada', 'Salto de longitud',
  'Ataque frontal', 'Ataque con huida', 'Ataque detenido', 'Defensa del guía', 'Guarda de objeto', 'Búsqueda y ladrido', 'Conducción'];
const SECURITY = ['Marcaje', 'Ataque frontal', 'Ataque lanzado', 'Ataque con huida', 'Defensa del guía', 'Guarda', 'Búsqueda y ladrido',
  'Escolta', 'Conducción', 'Cacheo', 'Obediencia', 'Detección'];
const BASE = ['Foco activo', 'Frustración controlada', 'Autocontrol', 'Calentamiento', 'Carrera / resistencia', 'Fuerza', 'Propiocepción', 'Estiramientos'];
const STARTER_DOGS = [
  { name: 'Aston', type: 'Mascota', resources: ['Sentarse', 'Tumbarse', 'De pie', 'Venir (llamada)', 'Junto', 'Quieto (permanencia)', 'Soltar', 'Foco activo'], exercises: ['Obediencia', 'Posiciones', 'Junto', 'Juegos de olfato', 'Búsqueda de objetos', 'Discos', ...BASE] },
  { name: 'Ares', type: 'Ring francés', exercises: [...RING, ...BASE] },
  { name: 'Batman', type: 'Seguridad y combate', exercises: [...SECURITY, ...BASE] },
  { name: 'Dardo', type: 'Seguridad y combate', exercises: [...SECURITY, ...BASE] },
];

function backupBanner(sessions) {
  if (!sessions.length) return '';
  const lastB = settings.lastBackup ? new Date(settings.lastBackup) : null;
  const days = lastB ? Math.floor((Date.now() - lastB) / 86400000) : null;
  const pending = !lastB || sessions.some((s) => (s.updatedAt || s.createdAt) > settings.lastBackup);
  if (!pending || (days !== null && days < 7)) return '';
  return `<a class="banner" href="#/ajustes">
    💾 ${lastB ? `Hace ${days} días que no guardas copia.` : 'Aún no has guardado ninguna copia.'} Toca aquí para guardarla.
  </a>`;
}

const dogTab = {}; // pestaña abierta de cada perro, para volver a la misma
const DOG_TABS = [['resumen', 'Resumen'], ['avance', 'Avance'], ['fases', 'Fases'], ['recursos', 'Recursos'], ['historial', 'Historial']];

async function viewDog(id) {
  const dog = await DB.get('dogs', id);
  if (!dog) return go('#/');
  setHeader(dog.name, true, [dog.type, dog.breed, age(dog.birth)].filter(Boolean).join(' · ') || 'Ficha');
  const sessions = sortSessions(await DB.byDog(id));
  const tab = DOG_TABS.some(([k]) => k === dogTab[id]) ? dogTab[id] : 'resumen';
  const panes = {
    resumen: () => `
      <div class="dog-head">
        ${photoHtml(dog, true)}
        <div style="min-width:0">
          <div class="dog-name">${esc(dog.name)}</div>
          <div>${esc([dog.type, dog.breed, age(dog.birth)].filter(Boolean).join(' · '))}</div>
          ${dog.level ? `<span class="tag">${esc(dog.level)}</span>` : ''}
        </div>
      </div>
      ${redLinesHtml(dog)}
      <a class="btn primary" href="#/registrar/${dog.id}">＋ Registrar sesión</a>
      <div class="card">
        <dl class="facts">
          ${fact('Físico', dog.physical)}
          ${fact('Puntos débiles', dog.weak)}
          ${fact('Carácter', dog.character)}
          ${fact('Notas', dog.notes)}
        </dl>
        ${!dog.physical && !dog.weak && !dog.character && !dog.notes ? '<p class="muted" style="margin:0">Sin datos de físico ni carácter todavía.</p>' : ''}
      </div>
      <a class="btn small" href="#/perro/${dog.id}/editar">✏️ Editar ficha</a>`,
    fases: () => plansSection(dog, sessions),
    recursos: () => resourcesSection(dog, sessions),
    avance: () => progressHtml(dog, sessions),
    historial: () => sessions.length ? sessions.map(sessionCard).join('') : '<div class="empty">Aún no hay sesiones.</div>',
  };
  app.innerHTML = `
    <div class="seg" role="tablist">${DOG_TABS.map(([k, l]) =>
      `<button type="button" role="tab" data-tab-id="${k}" aria-selected="${k === tab}">${l}${k === 'historial' && sessions.length ? ` <span class="count">${sessions.length}</span>` : ''}</button>`).join('')}</div>
    <div class="tabpane">${panes[tab]()}</div>
  `;
  $$('[data-tab-id]').forEach((b) => (b.onclick = () => { dogTab[id] = b.dataset.tabId; viewDog(id); }));
}

const fact = (label, value) => (value ? `<dt>${label}</dt><dd>${esc(value)}</dd>` : '');

const num = (v) => String(v).replace('.', ',');

function physicalLine(e) {
  return [e.pmode,
    e.pmode === 'Series' && e.series ? `${e.series} × ${e.seriesTime ? e.seriesTime + ' s' : 'series'}${e.rest ? ', descanso ' + e.rest + ' s' : ''}` : '',
    e.speed ? num(e.speed) + ' km/h' : '',
    e.hrAvg ? 'FC media ' + e.hrAvg : '', e.hrMax ? 'FC máx. ' + e.hrMax : ''].filter(Boolean).join(' · ');
}

async function viewDogEdit(id) {
  const isNew = id === 'nuevo';
  const dog = isNew ? { id: uid(), redLines: [] } : await DB.get('dogs', id);
  if (!dog) return go('#/');
  setHeader(isNew ? 'Nuevo perro' : 'Editar ficha', true);
  const levels = settings.levels.includes(dog.level) || !dog.level ? settings.levels : [...settings.levels, dog.level];

  app.innerHTML = `
    <form id="dogForm">
      <div style="display:flex;gap:16px;align-items:center">
        <div id="photoPrev">${photoHtml(dog, true)}</div>
        <label class="btn small" style="flex:1">📷 Foto
          <input type="file" accept="image/*" id="photoIn" hidden>
        </label>
      </div>
      <label class="field">Nombre *<input name="name" required value="${esc(dog.name)}" autocomplete="off"></label>
      <label class="field">Raza<input name="breed" value="${esc(dog.breed)}" autocomplete="off"></label>
      <label class="field">Fecha de nacimiento<span class="hint">La edad se calcula sola. Si no la sabes exacta, pon una aproximada.</span>
        <input name="birth" type="date" value="${esc(dog.birth)}"></label>
      <div class="group"><div class="glabel">Tipo de perro</div>${chips('dogType', settings.dogTypes, dog.type)}</div>
      <label class="field">Nivel actual
        <select name="level"><option value="">—</option>${levels.map((l) => `<option ${l === dog.level ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      </label>
      <label class="field" style="color:var(--red)">⛔ Líneas rojas<span class="hint">Una por línea. Se verán siempre en grande.</span>
        <textarea name="redLines" placeholder="Ej.: No trabajar con más de 25 °C">${esc((dog.redLines || []).join('\n'))}</textarea></label>
      <div class="group"><div class="glabel">Ejercicios que hace</div>
        <p class="muted" style="font-size:.85rem;margin-top:0">Al registrar solo saldrán estos. Si no marcas ninguno, salen todos.</p>
        ${exerciseChips('dogEx', allExercises().concat((dog.exercises || []).filter((x) => !allExercises().includes(x))), dog.exercises || [], true)}
      </div>
      <label class="field">Físico<textarea name="physical" placeholder="Peso, constitución, estado…">${esc(dog.physical)}</textarea></label>
      <label class="field">Puntos débiles<textarea name="weak" placeholder="Lesiones, zonas a cuidar…">${esc(dog.weak)}</textarea></label>
      <label class="field">Carácter<textarea name="character">${esc(dog.character)}</textarea></label>
      <label class="field">Notas<textarea name="notes">${esc(dog.notes)}</textarea></label>
      <button class="btn primary" type="submit">Guardar ficha</button>
      ${isNew ? '' : '<button class="btn danger" type="button" id="delDog">Borrar perro</button>'}
    </form>`;

  let photo = dog.photo;
  let dogType = dog.type || '';
  const dogEx = new Set(dog.exercises || []);
  $('[data-group="dogType"]').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    $$('[data-group="dogType"] .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    dogType = on ? b.dataset.value : '';
  };
  $('[data-group="dogEx"]').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const v = b.dataset.value;
    if (dogEx.has(v)) dogEx.delete(v); else dogEx.add(v);
    b.setAttribute('aria-pressed', String(dogEx.has(v)));
  };
  $('#photoIn').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    photo = await resizeImage(f, 480);
    $('#photoPrev').innerHTML = photoHtml({ ...dog, photo }, true);
  };

  $('#dogForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const now = new Date().toISOString();
    const saved = {
      ...dog,
      name: fd.get('name').trim(),
      breed: fd.get('breed').trim(),
      birth: fd.get('birth'),
      level: fd.get('level'),
      type: dogType,
      exercises: allExercises().concat(dog.exercises || []).filter((x, i, a) => dogEx.has(x) && a.indexOf(x) === i),
      redLines: lines(fd.get('redLines')),
      physical: fd.get('physical').trim(),
      weak: fd.get('weak').trim(),
      character: fd.get('character').trim(),
      notes: fd.get('notes').trim(),
      photo,
      createdAt: dog.createdAt || now,
      updatedAt: now,
    };
    await DB.put('dogs', saved);
    toast('Ficha guardada');
    go('#/perro/' + saved.id);
  };

  const del = $('#delDog');
  if (del) del.onclick = async () => {
    const sessions = await DB.byDog(dog.id);
    if (!await ask(`¿Borrar a ${dog.name} y sus ${sessions.length} sesiones? No se puede deshacer.`)) return;
    for (const s of sessions) await DB.del('sessions', s.id);
    await DB.del('dogs', dog.id);
    toast('Perro borrado');
    go('#/');
  };
}

function resizeImage(file, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const audioHtml = (src) => `<audio controls src="${src}" style="width:100%;margin-top:8px"></audio>
    <button type="button" class="btn small danger" id="delAudio">Borrar audio</button>`;

// ---------- voz ----------
let recorder = null;
function stopRecording() {
  if (recorder && recorder.state === 'recording') recorder.stop();
}

function setupVoice(form, draft) {
  const note = $('#exNote', form);
  const audioBox = $('#audioBox', form);
  const bindDelAudio = () => {
    const d = $('#delAudio', form);
    if (d) d.onclick = () => { draft.audio = ''; audioBox.innerHTML = ''; };
  };
  bindDelAudio();

  // Dictado: convierte voz en texto (normalmente necesita cobertura).
  const dictateBtn = $('#dictate', form);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || IN_CHAT) dictateBtn.hidden = true;
  let rec = null;
  dictateBtn.onclick = () => {
    if (rec) { rec.stop(); return; }
    if (!navigator.onLine) { toast('Sin cobertura no se puede dictar. Usa «Grabar audio».'); return; }
    rec = new SR();
    rec.lang = 'es-ES';
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          const t = ev.results[i][0].transcript.trim();
          note.value = (note.value ? note.value.trimEnd() + ' ' : '') + t;
          note.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };
    rec.onerror = (ev) => {
      if (ev.error === 'network') toast('Sin cobertura no se puede dictar. Usa «Grabar audio».');
      else if (ev.error === 'not-allowed') toast('Hay que dar permiso al micrófono.');
    };
    rec.onend = () => { rec = null; dictateBtn.textContent = '🎙 Dictar'; };
    rec.start();
    dictateBtn.textContent = '⏹ Parar dictado';
  };

  // Grabación de audio: funciona siempre, también sin cobertura.
  const recordBtn = $('#record', form);
  if (!window.MediaRecorder || !navigator.mediaDevices || IN_CHAT) recordBtn.hidden = true;
  recordBtn.onclick = async () => {
    if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast('Hay que dar permiso al micrófono.');
      return;
    }
    const chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(recorder.limit);
      recordBtn.textContent = '⏺ Grabar audio';
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const r = new FileReader();
      r.onload = () => {
        draft.audio = r.result;
        audioBox.innerHTML = audioHtml(draft.audio);
        bindDelAudio();
      };
      r.readAsDataURL(blob);
    };
    recorder.start();
    recorder.limit = setTimeout(stopRecording, 120000); // máximo 2 minutos
    recordBtn.textContent = '⏹ Parar (grabando…)';
  };
}

// ---------- ajustes y copia de seguridad ----------
async function viewSettings() {
  setHeader('Ajustes', false);
  const [dogs, sessions] = await Promise.all([DB.all('dogs'), DB.all('sessions')]);
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;

  app.innerHTML = `
    <h2>💾 Copia de seguridad</h2>
    <p>${dogs.length} perros y ${sessions.length} sesiones guardados en este móvil.</p>
    <p class="muted">${settings.lastBackup ? 'Última copia: ' + new Date(settings.lastBackup).toLocaleString('es-ES') : 'Todavía no has guardado ninguna copia.'}</p>
    <button class="btn primary" id="doBackup">Guardar copia</button>
    <p class="muted" style="font-size:.85rem">Crea un archivo con todos tus datos. Mándatelo por WhatsApp o correo, o guárdalo en Drive.</p>
    <label class="btn">Recuperar copia<input type="file" id="restore" accept=".json,application/json" hidden></label>
    <p class="muted" style="font-size:.85rem">Sustituye lo que hay en el móvil por lo que haya en el archivo.</p>
    <p class="muted" style="font-size:.85rem">${DB.kind === 'claude' ? 'Los datos se guardan en tu cuenta de Claude: los verás igual desde el móvil o el ordenador.' : IN_CHAT ? 'Los datos se guardan solo en este navegador.' : ''}</p>
    ${persisted === false && !IN_CHAT ? '<p class="muted" style="font-size:.85rem">Consejo: instala la app en la pantalla de inicio para que el móvil no borre los datos.</p>' : ''}

    <h2>Aspecto</h2>
    ${chips('theme', ['Automático', 'Claro (sol)', 'Oscuro'], themeLabel())}

    <h2>Equipo</h2>
    <p class="muted" style="font-size:.85rem">Para elegirlos rápido al registrar.</p>
    <div id="team">${settings.team.map((p, i) => teamRow(p, i)).join('')}</div>
    <button class="btn small" id="addPerson">＋ Añadir persona</button>

    <h2>Listas</h2>
    <p class="muted" style="font-size:.85rem">Una opción por línea. Se guardan al salir del cuadro.</p>
    ${settings.exGroups.map((g, i) => `<label class="field">${esc(g.name)}<textarea data-exgroup="${i}" rows="5">${esc(g.items.join('\n'))}</textarea></label>`).join('')}
    ${listEditor('dogTypes', 'Tipos de perro')}
    <label class="field">Actividades<span class="hint">Una por línea. Las nuevas aparecen con el icono «＋».</span>
      <textarea data-acts rows="6">${esc(settings.activities.map((a) => a.name).join('\n'))}</textarea></label>
    ${listEditor('materials', 'Materiales')}
    ${listEditor('resources', 'Recursos')}
    <label class="field">Situaciones, de más fácil a más difícil<span class="hint">Los registros guardan el número de la situación: si cambias el orden, cambia también en los registros antiguos.</span>
      <textarea data-list="contexts" rows="5">${esc(settings.contexts.join('\n'))}</textarea></label>
    ${listEditor('bites', 'Opciones de mordida')}
    ${listEditor('levels', 'Niveles del perro')}
    <p class="muted" style="font-size:.8rem;margin-top:30px">Impacto K9 · Pista — versión 8</p>
  `;

  $('#doBackup').onclick = doBackup;
  $('#restore').onchange = doRestore;

  $('[data-group="theme"]').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const map = { 'Automático': 'auto', 'Claro (sol)': 'light', 'Oscuro': 'dark' };
    setTheme(map[b.dataset.value]);
    $$('[data-group="theme"] .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  };

  const bindTeam = () => {
    $$('#team [data-person]').forEach((row) => {
      const i = +row.dataset.person;
      $('input', row).onchange = async (ev) => { settings.team[i].name = ev.target.value.trim(); await saveSettings(); };
      $('select', row).onchange = async (ev) => { settings.team[i].role = ev.target.value; await saveSettings(); };
      $('button', row).onclick = async () => { settings.team.splice(i, 1); await saveSettings(); viewSettings(); };
    });
  };
  bindTeam();
  $('#addPerson').onclick = async () => {
    settings.team.push({ name: '', role: 'Guía' });
    await saveSettings();
    $('#team').innerHTML = settings.team.map((p, i) => teamRow(p, i)).join('');
    bindTeam();
    $$('#team input').at(-1).focus();
  };

  $('[data-acts]').onchange = async (ev) => {
    const names = lines(ev.target.value);
    if (!names.length) return;
    settings.activities = names.map((n) => settings.activities.find((a) => a.name === n) || DEFAULTS.activities.find((a) => a.name === n) || { name: n, icon: 'mas', groups: [] });
    await saveSettings();
    toast('Lista guardada');
  };
  $$('[data-exgroup]').forEach((ta) => (ta.onchange = async () => {
    settings.exGroups[+ta.dataset.exgroup].items = lines(ta.value);
    await saveSettings();
    toast('Lista guardada');
  }));
  $$('[data-list]').forEach((ta) => (ta.onchange = async () => {
    const vals = lines(ta.value);
    settings[ta.dataset.list] = vals.length ? vals : [...DEFAULTS[ta.dataset.list]];
    await saveSettings();
    toast('Lista guardada');
  }));
}

const teamRow = (p, i) => `<div class="card" data-person="${i}">
  <div class="list-edit"><input value="${esc(p.name)}" placeholder="Nombre" autocomplete="off"><button type="button" aria-label="Quitar">✕</button></div>
  <select>${settings.roles.map((r) => `<option ${r === p.role ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
</div>`;

const listEditor = (key, label) => `<label class="field">${label}<textarea data-list="${key}" rows="6">${esc(settings[key].join('\n'))}</textarea></label>`;

async function doBackup() {
  const previous = settings.lastBackup;
  settings.lastBackup = new Date().toISOString();
  await saveSettings();
  const data = await DB.exportAll();
  const name = `impacto-k9-copia-${today()}.json`;
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  let done = false;
  if (IN_CHAT) {
    const downloads = window.claude ? await window.claude.use('downloads') : null;
    try {
      if (!downloads) throw { code: 'unavailable' };
      await downloads.save({ filename: name, data: blob });
    } catch (e) {
      settings.lastBackup = previous;
      await saveSettings();
      if (e.code !== 'declined') notify('Aquí no se puede guardar el archivo. Prueba desde claude.ai en el navegador.');
      return;
    }
    done = true;
  }
  if (!done && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia Impacto K9' });
      done = true;
    } catch (e) {
      if (e.name === 'AbortError') { // el usuario canceló
        settings.lastBackup = previous;
        await saveSettings();
        return;
      }
    }
  }
  if (!done) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  toast('Copia guardada');
  viewSettings();
}

async function doRestore(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'impacto-k9') throw new Error('Este archivo no es una copia de Impacto K9.');
    const msg = `La copia tiene ${(data.dogs || []).length} perros y ${(data.sessions || []).length} sesiones (del ${new Date(data.exportedAt).toLocaleDateString('es-ES')}).\n\nSe sustituirá todo lo que hay ahora en la app. ¿Seguir?`;
    if (!await ask(msg)) return;
    await DB.importAll(data);
    await loadSettings();
    toast('Copia recuperada');
    go('#/');
  } catch (e) {
    notify(e.message.includes('Impacto') ? e.message : 'No se ha podido leer el archivo.');
  }
}

// ---------- tema ----------
function themeLabel() {
  const t = localStorage.getItem('theme') || 'auto';
  return { auto: 'Automático', light: 'Claro (sol)', dark: 'Oscuro' }[t];
}
function setTheme(t) {
  try { localStorage.setItem('theme', t); } catch {}
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
function currentDark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

// ---------- arranque ----------
async function loadSettings() {
  const saved = await DB.get('settings', 'main');
  settings = { ...DEFAULTS, ...(saved || {}) };
  delete settings.key;
  delete settings.exercises; // lista antigua sin grupos
  // Añade los grupos y opciones nuevos a ajustes guardados con versiones anteriores.
  const old = settings.exGroups.find((g) => g.name === 'Detección y olfato');
  if (old) { old.name = 'Olfato'; old.items = old.items.filter((i) => i !== 'Detección'); }
  for (const g of DEFAULTS.exGroups) if (!settings.exGroups.some((x) => x.name === g.name)) settings.exGroups.push(g);
  for (const t of DEFAULTS.dogTypes) if (!settings.dogTypes.includes(t)) settings.dogTypes.push(t);
  settings.exGroups = JSON.parse(JSON.stringify(settings.exGroups));
}

async function route() {
  stopRecording();
  document.body.classList.remove('focus');
  const parts = currentPath().replace(/^#\/?/, '').split('/').filter(Boolean);
  document.body.classList.remove('focus', 'has-savebar');
  app.oninput = app.onchange = app.onclick = app.onkeydown = null;
  const tab = parts[0] === 'registrar' || parts[0] === 'sesion' ? 'log' : parts[0] === 'ajustes' ? 'settings' : parts[0] === 'avance' ? 'progress' : 'home';
  $$('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  window.scrollTo(0, 0);
  try {
    if (!parts.length) await viewHome();
    else if (parts[0] === 'perro' && parts[2] === 'editar') await viewDogEdit(parts[1]);
    else if (parts[0] === 'perro' && parts[2] === 'fases') await viewPlan(parts[1], parts[3]);
    else if (parts[0] === 'perro' && parts[2] === 'recurso') await viewResource(parts[1], parts[3]);
    else if (parts[0] === 'perro' && parts[2] === 'recursos') await viewResourcesPick(parts[1]);
    else if (parts[0] === 'perro') await viewDog(parts[1]);
    else if (parts[0] === 'registrar' && parts[1]) await viewSession({ dogId: parts[1] });
    else if (parts[0] === 'registrar') await viewSession({});
    else if (parts[0] === 'avance') await viewProgress(parts[1]);
    else if (parts[0] === 'sesion') await viewSession({ sessionId: parts[1] });
    else if (parts[0] === 'ajustes') await viewSettings();
    else go('#/');
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p>Ha habido un problema: ${esc(e.message)}</p><a class="btn" href="#/">Volver al inicio</a>`;
  }
}

(async function start() {
  try { const t = localStorage.getItem('theme'); if (t && t !== 'auto') setTheme(t); } catch {}
  $('#theme').onclick = () => setTheme(currentDark() ? 'light' : 'dark');
  $('#back').onclick = goBack;
  if (!IN_CHAT && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  await DB.ready();
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  await loadSettings();
  if (!IN_CHAT) window.addEventListener('hashchange', route);
  route();
})();
