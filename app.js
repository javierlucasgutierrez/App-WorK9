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
  dogTypes: ['Mascota', 'Ring francés', 'Seguridad y combate', 'Detección', 'C-IED', 'Rescate'],
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
const BAD = new Set(['Con choque', 'Se queda con la presa', 'Inestable', 'Marcaje activo (rasca o muerde)', 'Sin marcaje']);
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

function setHeader(title, showBack) {
  $('#title').textContent = title;
  $('#back').hidden = !showBack;
}

function photoHtml(dog, big) {
  return dog.photo
    ? `<img class="photo${big ? ' big' : ''}" src="${dog.photo}" alt="">`
    : `<div class="photo${big ? ' big' : ''}">${esc((dog.name || '?')[0].toUpperCase())}</div>`;
}

function redLinesHtml(dog, compact) {
  const rl = dog.redLines || [];
  if (!rl.length) return '';
  return `<div class="redlines${compact ? ' compact' : ''}">
    <div class="label">⛔ LÍNEAS ROJAS</div>
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

async function viewHome() {
  setHeader('Mis perros', false);
  const dogs = sortDogs(await DB.all('dogs'));
  const sessions = await DB.all('sessions');
  const last = {};
  for (const s of sessions) if (!last[s.dogId] || s.date > last[s.dogId]) last[s.dogId] = s.date;

  app.innerHTML = `
    ${backupBanner(sessions)}
    ${dogs.length ? '' : `<p class="muted">Todavía no hay perros.</p>
      <button class="btn primary" id="starter">Crear las fichas de Aston, Ares, Batman y Dardo</button>`}
    ${dogs.map((d) => `
      <a class="card dog-card" href="#/perro/${d.id}">
        ${photoHtml(d)}
        <div style="flex:1;min-width:0">
          <div class="name">${esc(d.name)}</div>
          <div class="muted">${esc([d.type, d.breed, age(d.birth), d.level].filter(Boolean).join(' · '))}</div>
          <div class="muted">${last[d.id] ? 'Última sesión: ' + fmtDate(last[d.id]) : 'Sin sesiones'}</div>
          ${(d.redLines || []).length ? `<div style="color:var(--red);font-weight:800">⛔ ${d.redLines.length} línea${d.redLines.length > 1 ? 's' : ''} roja${d.redLines.length > 1 ? 's' : ''}</div>` : ''}
        </div>
      </a>`).join('')}
    <a class="btn" href="#/perro/nuevo/editar">＋ Nuevo perro</a>
  `;
  const st = $('#starter');
  if (st) st.onclick = async () => {
    const now = new Date().toISOString();
    for (const d of STARTER_DOGS) await DB.put('dogs', { id: uid(), redLines: [], createdAt: now, updatedAt: now, ...d });
    toast('Fichas creadas. Complétalas cuando puedas.');
    viewHome();
  };
}

// Perros de Javier, para no tener que crearlos uno a uno.
const RING = ['Obediencia', 'Junto', 'Posiciones', 'Rechazo de comida', 'Envío', 'Salto de valla', 'Palizada', 'Salto de longitud',
  'Ataque frontal', 'Ataque con huida', 'Ataque detenido', 'Defensa del guía', 'Guarda de objeto', 'Búsqueda y ladrido', 'Conducción'];
const SECURITY = ['Marcaje', 'Ataque frontal', 'Ataque lanzado', 'Ataque con huida', 'Defensa del guía', 'Guarda', 'Búsqueda y ladrido',
  'Escolta', 'Conducción', 'Cacheo', 'Obediencia', 'Detección'];
const BASE = ['Foco activo', 'Frustración controlada', 'Autocontrol', 'Calentamiento', 'Carrera / resistencia', 'Fuerza', 'Propiocepción', 'Estiramientos'];
const STARTER_DOGS = [
  { name: 'Aston', type: 'Mascota', exercises: ['Obediencia', 'Posiciones', 'Junto', 'Juegos de olfato', 'Búsqueda de objetos', 'Discos', ...BASE] },
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
  return `<a class="banner card" href="#/ajustes" style="text-decoration:none">
    💾 ${lastB ? `Hace ${days} días que no guardas copia.` : 'Aún no has guardado ninguna copia.'} Toca aquí para guardarla.
  </a>`;
}

async function viewDog(id) {
  const dog = await DB.get('dogs', id);
  if (!dog) return go('#/');
  setHeader(dog.name, true);
  const sessions = sortSessions(await DB.byDog(id));
  app.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center">
      ${photoHtml(dog, true)}
      <div>
        <div style="font-size:1.6rem;font-weight:900">${esc(dog.name)}</div>
        <div>${esc([dog.type, dog.breed, age(dog.birth)].filter(Boolean).join(' · '))}</div>
        ${dog.level ? `<div><span class="tag">${esc(dog.level)}</span></div>` : ''}
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
      ${!dog.physical && !dog.weak && !dog.character && !dog.notes ? '<p class="muted">Sin datos de físico ni carácter todavía.</p>' : ''}
    </div>
    <a class="btn small" href="#/perro/${dog.id}/editar">✏️ Editar ficha</a>

    ${plansSection(dog, sessions)}

    <h2>Sesiones (${sessions.length})</h2>
    ${sessions.length ? sessions.map(sessionCard).join('') : '<p class="muted">Aún no hay sesiones.</p>'}
  `;
}

const fact = (label, value) => (value ? `<dt>${label}</dt><dd>${esc(value)}</dd>` : '');

function sessionCard(s) {
  const who = [s.guide && 'Guía: ' + s.guide, s.figurant && 'Figurante: ' + s.figurant].filter(Boolean).join(' · ');
  return `<a class="card" href="#/sesion/${s.id}">
    <div style="font-weight:800">${fmtDate(s.date)}</div>
    ${who ? `<div class="muted">${esc(who)}</div>` : ''}
    ${s.exercises.map(exerciseSummary).join('')}
  </a>`;
}

const num = (v) => String(v).replace('.', ',');

function physicalLine(e) {
  return [e.pmode,
    e.pmode === 'Series' && e.series ? `${e.series} × ${e.seriesTime ? e.seriesTime + ' s' : 'series'}${e.rest ? ', descanso ' + e.rest + ' s' : ''}` : '',
    e.speed ? num(e.speed) + ' km/h' : '',
    e.hrAvg ? 'FC media ' + e.hrAvg : '', e.hrMax ? 'FC máx. ' + e.hrMax : ''].filter(Boolean).join(' · ');
}

// linkable: false cuando el resumen va dentro de otro enlace (no se pueden anidar).
function exerciseSummary(e, linkable) {
  const phys = physicalLine(e);
  const tags = [e.mark, e.falses ? `${e.falses} falso${e.falses > 1 ? 's' : ''} marcaje${e.falses > 1 ? 's' : ''}` : '', e.entry, e.bite && e.bite !== 'No aplica' ? e.bite : '', e.cut && 'Corte: ' + e.cut]
    .filter(Boolean)
    .map((t) => `<span class="tag${BAD.has(t.replace('Corte: ', '')) || /falsos? marcaje/.test(t) ? ' bad' : ''}">${esc(t)}</span>`)
    .join('');
  return `<div class="ex-line">
    <div><b>${esc(e.exercise)}</b> <span class="muted">${esc([e.tool, e.reps ? e.reps + ' rep.' : '',
      e.hides != null ? `${e.found ?? 0} de ${e.hides} encontrados` : '', e.minutes ? e.minutes + ' min' : '', e.intensity && 'Intensidad ' + e.intensity.toLowerCase()].filter(Boolean).join(' · '))}</span></div>
    ${e.phaseName ? `<div class="muted" style="font-size:.85rem">${esc(e.phaseName)}</div>` : ''}
    ${phys ? `<div class="muted">${esc(phys)}</div>` : ''}
    ${/^https?:\/\//i.test(e.link || '') ? (linkable ? `<div><a href="${esc(e.link)}" target="_blank" rel="noopener" class="ext-link">⌚ Ver actividad del reloj ↗</a></div>` : '<div class="muted">⌚ Actividad del reloj vinculada</div>') : ''}
    ${exType(e.exercise) === 'fisico' && !e.intention ? '' : `<div class="pillars">${PILLARS.map(([k, l]) => `<div class="pill">${l}<b>${e[k] || '–'}</b></div>`).join('')}</div>`}
    ${tags ? `<div style="margin-top:6px">${tags}</div>` : ''}
    ${e.note ? `<div class="muted" style="margin-top:4px;white-space:pre-wrap">📝 ${esc(e.note)}</div>` : ''}
    ${e.audio ? `<div class="muted">🎙 Nota de voz</div>` : ''}
  </div>`;
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

async function viewPickDog() {
  setHeader('¿Qué perro?', false);
  const dogs = sortDogs(await DB.all('dogs'));
  if (dogs.length === 1) return go('#/registrar/' + dogs[0].id);
  app.innerHTML = dogs.length
    ? dogs.map((d) => `<a class="card dog-card" href="#/registrar/${d.id}">${photoHtml(d)}<div class="name">${esc(d.name)}</div></a>`).join('')
    : `<p>Primero crea la ficha de un perro.</p><a class="btn primary" href="#/perro/nuevo/editar">＋ Nuevo perro</a>`;
}

// ---------- registro de sesión ----------
async function viewSession({ dogId, sessionId }) {
  let session;
  if (sessionId) {
    session = await DB.get('sessions', sessionId);
    if (!session) return go('#/');
    dogId = session.dogId;
  }
  const dog = await DB.get('dogs', dogId);
  if (!dog) return go('#/');
  const isNew = !session;
  if (isNew) {
    // Guía y figurante de la última sesión de este perro, para no tener que elegirlos otra vez.
    const prev = sortSessions(await DB.byDog(dogId))[0];
    session = { id: uid(), dogId, date: today(), guide: prev?.guide || '', figurant: prev?.figurant || '', exercises: [] };
  }
  setHeader(isNew ? 'Sesión · ' + dog.name : 'Editar sesión', true);

  let editing = isNew ? -1 : null; // índice del ejercicio en edición; -1 = nuevo; null = ninguno

  const people = (filter) => {
    const names = settings.team.filter(filter).map((p) => p.name);
    return names;
  };

  async function persist() {
    const now = new Date().toISOString();
    session.createdAt = session.createdAt || now;
    session.updatedAt = now;
    await DB.put('sessions', session);
  }

  function render() {
    const guides = people((p) => p.role === 'Guía');
    const figs = people((p) => p.role !== 'Guía');
    app.innerHTML = `
      ${redLinesHtml(dog, true)}
      <div class="row">
        <label class="field">Fecha<input type="date" id="sDate" value="${esc(session.date)}"></label>
      </div>
      <div class="row">
        <label class="field">Guía${personSelect('sGuide', guides, session.guide)}</label>
        <label class="field">Figurante${personSelect('sFig', figs, session.figurant)}</label>
      </div>
      ${settings.team.length ? '' : '<p class="muted" style="font-size:.85rem">Puedes añadir a tu equipo en Ajustes para elegirlos aquí.</p>'}

      ${session.exercises.length ? `<h2>Ejercicios (${session.exercises.length})</h2>` : ''}
      ${session.exercises.map((e, i) => i === editing ? exerciseForm(pending || e) : `
        <div class="card">${exerciseSummary(e, true)}
          <div class="row"><button class="btn small" data-edit="${i}">✏️ Cambiar</button><button class="btn small danger" data-del="${i}">Quitar</button></div>
        </div>`).join('')}
      ${editing === -1 ? exerciseForm(pending || {}) : ''}
      ${editing === null ? `
        <button class="btn primary" id="addEx">＋ ${session.exercises.length ? 'Otro ejercicio' : 'Añadir ejercicio'}</button>
        ${session.exercises.length ? `<a class="btn" href="#/perro/${dog.id}" id="finish">✔ Terminar sesión</a>` : ''}
        ${!isNew ? '<button class="btn danger" id="delSession">Borrar sesión</button>' : ''}` : ''}
    `;
    bind();
  }

  function personSelect(id, names, current) {
    const all = current && !names.includes(current) ? [...names, current] : names;
    if (!all.length) return `<input id="${id}" value="${esc(current)}" placeholder="Nombre" autocomplete="off">`;
    return `<select id="${id}"><option value="">—</option>${all.map((n) => `<option ${n === current ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  }

  const phaseInfo = (e) => (e.phaseName ? `<div class="phase-info">▶ ${esc(e.phaseName)}</div>` : '');

  // Pasa al borrador lo escrito en contadores y casillas.
  function readFields(draft) {
    for (const k of ['reps', 'minutes', 'hides', 'found', 'falses', 'series']) draft[k] = +$('#' + k).textContent;
    for (const k of ['speed', 'seriesTime', 'rest', 'hrAvg', 'hrMax']) {
      const v = parseFloat($('#' + k).value.replace(',', '.'));
      draft[k] = Number.isFinite(v) ? v : '';
    }
    draft.link = $('#link').value.trim();
  }

  let showAll = false;
  let pending = null; // ejercicio a medio rellenar
  function exerciseForm(e) {
    const own = dog.exercises && dog.exercises.length && !showAll ? dog.exercises : allExercises();
    const exs = e.exercise && !own.includes(e.exercise) ? [...own, e.exercise] : own;
    const type = e.exercise ? exType(e.exercise) : '';
    return `<div class="card" id="exForm" data-type="${type}" data-pmode="${esc(e.pmode || '')}">
      <div class="group"><div class="glabel">Ejercicio</div>${exerciseChips('exercise', exs, e.exercise)}
        ${own !== allExercises() ? '<button type="button" class="btn small" id="showAll">Ver todos los ejercicios</button>' : ''}
        <div id="phaseInfo">${phaseInfo(e)}</div></div>
      <p class="muted only-none">Elige el ejercicio para ver el resto.</p>
      <div class="group only-mordida"><div class="glabel">Herramienta</div>${chips('tool', settings.tools, e.tool)}</div>
      <div class="group only-mordida only-tecnico"><div class="glabel">Repeticiones</div>
        <div class="stepper"><button type="button" data-step="-1" data-for="reps">−</button><output id="reps">${e.reps ?? 1}</output><button type="button" data-step="1" data-for="reps">＋</button></div>
      </div>
      <div class="group only-fisico"><div class="glabel">Tipo de trabajo</div>${chips('pmode', ['Continuo', 'Series'], e.pmode)}</div>
      <div class="group only-fisico"><div class="glabel">Minutos en total</div>
        <div class="stepper"><button type="button" data-step="-5" data-for="minutes">−</button><output id="minutes">${e.minutes ?? 10}</output><button type="button" data-step="5" data-for="minutes">＋</button></div>
      </div>
      ${[['hides', 'Escondites puestos', e.hides ?? 3], ['found', 'Encontrados', e.found ?? 0], ['falses', 'Falsos marcajes', e.falses ?? 0]].map(([k, l, v]) =>
        `<div class="group only-deteccion"><div class="glabel">${l}</div>
          <div class="stepper"><button type="button" data-step="-1" data-for="${k}">−</button><output id="${k}">${v}</output><button type="button" data-step="1" data-for="${k}">＋</button></div></div>`).join('')}
      <div class="group only-deteccion"><div class="glabel">Marcaje</div>${chips('mark', settings.marks, e.mark)}</div>
      <label class="field only-continuo">Velocidad media (km/h)${numInput('speed', e.speed, '12,5', true)}</label>
      <div class="group only-series"><div class="glabel">Número de series</div>
        <div class="stepper"><button type="button" data-step="-1" data-for="series">−</button><output id="series">${e.series ?? 4}</output><button type="button" data-step="1" data-for="series">＋</button></div>
      </div>
      <div class="row only-series">
        <label class="field">Cada serie (segundos)${numInput('seriesTime', e.seriesTime, '30')}</label>
        <label class="field">Descanso (segundos)${numInput('rest', e.rest, '60')}</label>
      </div>
      <div class="group only-fisico"><div class="glabel">Intensidad</div>${chips('intensity', settings.intensities, e.intensity)}</div>
      <div class="row only-fisico">
        <label class="field">FC media (ppm)${numInput('hrAvg', e.hrAvg, '140')}</label>
        <label class="field">FC máxima (ppm)${numInput('hrMax', e.hrMax, '180')}</label>
      </div>
      <label class="field only-fisico">Actividad de Garmin, Strava o Polar<span class="hint">Pega aquí el enlace de la actividad (opcional).</span>
        <input id="link" type="url" inputmode="url" value="${esc(e.link)}" placeholder="https://…" autocomplete="off"></label>
      ${PILLARS.map(([k, l]) => `<div class="group only-mordida only-tecnico only-deteccion"><div class="glabel">${l}</div>${chips(k, ['1', '2', '3', '4', '5'], e[k] ? String(e[k]) : '', 'scores')}</div>`).join('')}
      <div class="group only-mordida"><div class="glabel">Entrada</div>${chips('entry', settings.entries, e.entry)}</div>
      <div class="group only-mordida"><div class="glabel">Mordida</div>${chips('bite', settings.bites, e.bite)}</div>
      <div class="group only-mordida"><div class="glabel">Reacción al corte</div>${chips('cut', settings.cuts, e.cut)}</div>
      <div class="group"><div class="glabel">Nota</div>
        <textarea id="exNote" placeholder="Escribe o usa los botones de voz">${esc(e.note)}</textarea>
        <div class="row">
          <button type="button" class="btn small" id="dictate">🎙 Dictar</button>
          <button type="button" class="btn small" id="record">⏺ Grabar audio</button>
        </div>
        <div id="audioBox">${e.audio ? audioHtml(e.audio) : ''}</div>
      </div>
      <button type="button" class="btn primary" id="saveEx">Guardar ejercicio</button>
      <button type="button" class="btn small" id="cancelEx">Cancelar</button>
    </div>`;
  }

  const audioHtml = (src) => `<audio controls src="${src}" style="width:100%;margin-top:8px"></audio>
    <button type="button" class="btn small danger" id="delAudio">Borrar audio</button>`;

  function bind() {
    $('#sDate').onchange = (ev) => { session.date = ev.target.value || today(); if (session.exercises.length) persist(); };
    for (const [id, key] of [['sGuide', 'guide'], ['sFig', 'figurant']]) {
      $('#' + id).onchange = (ev) => { session[key] = ev.target.value.trim(); if (session.exercises.length) persist(); };
    }
    $$('[data-edit]').forEach((b) => (b.onclick = () => { editing = +b.dataset.edit; render(); scrollToForm(); }));
    $$('[data-del]').forEach((b) => (b.onclick = async () => {
      if (!await ask('¿Quitar este ejercicio?')) return;
      session.exercises.splice(+b.dataset.del, 1);
      if (session.exercises.length) await persist(); else await DB.del('sessions', session.id);
      render();
    }));
    const add = $('#addEx');
    if (add) add.onclick = () => { editing = -1; render(); scrollToForm(); };
    const delS = $('#delSession');
    if (delS) delS.onclick = async () => {
      if (!await ask('¿Borrar la sesión entera?')) return;
      await DB.del('sessions', session.id);
      toast('Sesión borrada');
      go('#/perro/' + dog.id);
    };
    const finish = $('#finish');
    if (finish) finish.onclick = () => toast('Sesión guardada');

    const form = $('#exForm');
    if (!form) return;
    const base = editing >= 0 ? session.exercises[editing] : {};
    const draft = pending || { ...base };
    pending = draft;

    $$('.chips', form).forEach((group) => {
      group.onclick = (ev) => {
        const b = ev.target.closest('.chip');
        if (!b) return;
        const key = group.dataset.group;
        const on = b.getAttribute('aria-pressed') !== 'true';
        $$('.chip', group).forEach((c) => c.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', String(on));
        draft[key] = on ? (group.classList.contains('scores') ? +b.dataset.value : b.dataset.value) : '';
        if (key === 'exercise') {
          if (on && editing === -1) prefillTool(draft, form);
          const ph = on ? currentPhase(getPlan(dog, draft.exercise)) : null;
          draft.phaseId = ph?.id || '';
          draft.phaseName = ph ? `Fase ${getPlan(dog, draft.exercise).current + 1}${ph.name ? ': ' + ph.name : ''}` : '';
          $('#phaseInfo').innerHTML = phaseInfo(draft);
          form.dataset.type = on ? exType(draft.exercise) : '';
        }
        if (key === 'pmode') {
          form.dataset.pmode = draft.pmode || '';
        }
      };
    });
    $$('[data-step]', form).forEach((b) => (b.onclick = () => {
      const out = $('#' + b.dataset.for);
      out.textContent = Math.max(0, +out.textContent + +b.dataset.step);
    }));
    const sa = $('#showAll', form);
    if (sa) sa.onclick = () => {
      showAll = true;
      draft.note = $('#exNote').value;
      readFields(draft);
      render(); // se redibuja con lo ya marcado (pending)
    };

    setupVoice(form, draft);

    $('#saveEx').onclick = async () => {
      if (!draft.exercise) { toast('Elige el ejercicio'); form.scrollIntoView({ behavior: 'smooth' }); return; }
      draft.note = $('#exNote').value.trim();
      // Solo se guarda lo que corresponde a este tipo de ejercicio.
      const type = exType(draft.exercise);
      const FIELDS = {
        mordida: ['tool', 'reps', 'intention', 'precision', 'control', 'entry', 'bite', 'cut'],
        tecnico: ['reps', 'intention', 'precision', 'control'],
        deteccion: ['hides', 'found', 'falses', 'mark', 'intention', 'precision', 'control'],
        fisico: ['minutes', 'intensity', 'pmode', 'hrAvg', 'hrMax', 'link'],
      }[type].slice();
      readFields(draft);
      if (type === 'fisico') FIELDS.push(...(draft.pmode === 'Series' ? ['series', 'seriesTime', 'rest'] : draft.pmode === 'Continuo' ? ['speed'] : []));
      for (const k of Object.keys(draft)) {
        if (ALL_FIELDS.includes(k) && (!FIELDS.includes(k) || draft[k] === '' || draft[k] == null)) delete draft[k];
      }
      if (editing === -1) session.exercises.push(draft); else session.exercises[editing] = draft;
      await persist();
      editing = null;
      pending = null;
      showAll = false;
      toast('Ejercicio guardado');
      render();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };
    $('#cancelEx').onclick = () => { stopRecording(); editing = null; pending = null; showAll = false; render(); };
  }

  // Al elegir ejercicio, propone la herramienta que usaste la última vez con este perro.
  async function prefillTool(draft, form) {
    if (draft.tool) return;
    const prev = sortSessions(await DB.byDog(dog.id));
    for (const s of prev) {
      const e = s.exercises.find((x) => x.exercise === draft.exercise && x.tool);
      if (e) {
        draft.tool = e.tool;
        $$('[data-group="tool"] .chip', form).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.value === e.tool)));
        return;
      }
    }
  }

  function scrollToForm() {
    const f = $('#exForm');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  render();
}

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
    ${listEditor('bites', 'Opciones de mordida')}
    ${listEditor('levels', 'Niveles del perro')}
    <p class="muted" style="font-size:.8rem;margin-top:30px">Impacto K9 · Pista — versión 5</p>
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
  const parts = currentPath().replace(/^#\/?/, '').split('/').filter(Boolean);
  const tab = parts[0] === 'registrar' || parts[0] === 'sesion' ? 'log' : parts[0] === 'ajustes' ? 'settings' : 'home';
  $$('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  window.scrollTo(0, 0);
  try {
    if (!parts.length) await viewHome();
    else if (parts[0] === 'perro' && parts[2] === 'editar') await viewDogEdit(parts[1]);
    else if (parts[0] === 'perro' && parts[2] === 'fases') await viewPlan(parts[1], parts[3]);
    else if (parts[0] === 'perro') await viewDog(parts[1]);
    else if (parts[0] === 'registrar' && parts[1]) await viewSession({ dogId: parts[1] });
    else if (parts[0] === 'registrar') await viewPickDog();
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
