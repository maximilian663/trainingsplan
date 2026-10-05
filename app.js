'use strict';

/* ================= Speicher ================= */

const STORE_KEY = 'trainingsplan.v1';
const UI_KEY = 'trainingsplan.ui';
const FIELDS = ['saetze', 'wdh', 'kg', 'e1', 'e2', 'puls'];
const COLORS = ['red', 'blue', 'green'];

let db = load();

function seed() {
  return { version: 1, custom: [], plans: structuredClone(DEFAULT_PLANS), sessions: [], draft: null };
}
function migrate(d) {
  d.version ||= 1;
  d.custom ||= [];
  d.plans ||= structuredClone(DEFAULT_PLANS);
  d.sessions ||= [];
  if (d.draft === undefined) d.draft = null;
  return d;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* fällt auf Startdaten zurück */ }
  return seed();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch (e) { toast('Speichern fehlgeschlagen'); }
}
function uiGet(k) { try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}')[k]; } catch (e) { return undefined; } }
function uiSet(k, v) {
  try { const o = JSON.parse(localStorage.getItem(UI_KEY) || '{}'); o[k] = v; localStorage.setItem(UI_KEY, JSON.stringify(o)); } catch (e) { /* egal */ }
}

/* ================= Helfer ================= */

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fmtDate = iso => new Date(iso + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtShort = iso => new Date(iso + 'T12:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtNum = n => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function allExercises() { return BUILTIN_EXERCISES.concat(db.custom); }
function exById(id) {
  return allExercises().find(e => e.id === id) || { id, name: 'Unbekannte Übung', geraet: '', nr: '', group: '' };
}
function exMeta(ex) { return [ex.nr && `Nr. ${ex.nr}`, ex.geraet].filter(Boolean).join(' · '); }
function planById(id) { return db.plans.find(p => p.id === id); }
function planBadge(plan) {
  if (!plan) return '<span class="badge">Freies Training</span>';
  return `<span class="badge colored c-${plan.color}">${esc(plan.name)}</span>`;
}

function sessionsSorted() {
  return [...db.sessions].sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
}
function isBefore(s, ref) {
  if (!ref) return true;
  if (s.id === ref.id) return false;
  return s.date < ref.date || (s.date === ref.date && (s.created || 0) < (ref.created || 0));
}
function lastEntry(exId, beforeSession) {
  for (const s of sessionsSorted()) {
    if (!isBefore(s, beforeSession)) continue;
    const row = s.rows.find(r => r.exId === exId);
    if (row) return { session: s, row };
  }
  return null;
}
function rowSummary(r) {
  const parts = [];
  if (r.saetze || r.wdh) parts.push(`${r.saetze || '–'}×${r.wdh || '–'}`);
  if (r.kg) parts.push(`${r.kg} kg`);
  if (r.e1) parts.push(r.e1);
  if (r.e2) parts.push(r.e2);
  if (r.puls) parts.push(`Puls ${r.puls}`);
  return parts.join(' · ') || 'keine Werte';
}
function rowFromItem(item) {
  const last = lastEntry(item.exId)?.row;
  return {
    exId: item.exId,
    saetze: item.saetze || '',
    wdh: item.wdh || '',
    kg: last?.kg || item.kg || '',
    e1: last?.e1 || item.e1 || '',
    e2: last?.e2 || item.e2 || '',
    puls: '',
    done: false,
  };
}
function nextPlanId() {
  const last = sessionsSorted().find(s => planById(s.planId));
  if (!last) return db.plans[0]?.id;
  const i = db.plans.findIndex(p => p.id === last.planId);
  return db.plans[(i + 1) % db.plans.length]?.id;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

/* ================= Navigation ================= */

let stack = [{ tab: 'training' }];
const cur = () => stack[stack.length - 1];
function goTab(tab) { stack = [{ tab }]; render(); window.scrollTo(0, 0); }
function push(route) { stack.push({ tab: cur().tab, ...route }); render(); window.scrollTo(0, 0); }
function back() { if (stack.length > 1) stack.pop(); render(); }

function render() {
  const r = cur();
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === r.tab));
  const view = VIEWS[r.view || r.tab];
  const out = view(r);
  if (!out) { back(); return; }
  $('#title').textContent = out.title;
  $('#topActions').innerHTML = out.actions || '';
  $('#backBtn').hidden = stack.length <= 1;
  $('#view').innerHTML = out.html;
  out.after?.();
}

/* ================= Ansichten ================= */

const VIEWS = {};

/* ----- Training ----- */
VIEWS.training = () => {
  if (db.draft) return workoutView(db.draft, true);

  const nextId = nextPlanId();
  const showHint = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone && !uiGet('hintClosed');
  const hint = showHint ? `
    <div class="card" style="padding:14px 14px 10px;margin-bottom:14px">
      <div style="font-weight:600;margin-bottom:4px">Als App installieren</div>
      <div class="small muted">In Safari unten auf <b>Teilen</b> tippen und <b>„Zum Home-Bildschirm“</b> wählen. Danach startet der Trainingsplan wie eine App und funktioniert offline.</div>
      <button class="btn ghost small" data-action="close-hint" style="padding-left:0">Verstanden</button>
    </div>` : '';

  const cards = db.plans.map(p => {
    const last = sessionsSorted().find(s => s.planId === p.id);
    const names = p.items.map(it => esc(exById(it.exId).name)).join(' · ');
    return `
      <button class="plan-card c-${p.color}" data-action="start" data-id="${p.id}">
        <div class="head">
          <span class="name">${esc(p.name)}</span>
          ${p.id === nextId ? '<span class="badge colored">Als Nächstes</span>' : ''}
        </div>
        <div class="ex">${names || '<i>Noch keine Übungen</i>'}</div>
        <div class="foot">${p.items.length} Übungen · ${last ? `zuletzt ${fmtDate(last.date)}` : 'noch nicht trainiert'}</div>
      </button>`;
  }).join('');

  return {
    title: 'Training',
    html: `${hint}
      <div class="section-title">Training starten</div>
      ${cards || '<div class="empty">Noch kein Plan angelegt.</div>'}
      <button class="btn block" data-action="start-free" style="margin-top:4px">Freies Training ohne Plan</button>`,
  };
};

function workoutTarget() {
  const r = cur();
  if (r.view === 'session') return db.sessions.find(s => s.id === r.id);
  return db.draft;
}

function cell(field, cls, mode, value, ph = '') {
  return `<input class="cell ${cls}" data-field="${field}" inputmode="${mode}" enterkeyhint="next" autocomplete="off" value="${esc(value)}" placeholder="${esc(ph)}">`;
}

function trackRowHTML(r, i, ref) {
  const ex = exById(r.exId);
  const last = lastEntry(r.exId, ref);
  const lastTxt = last ? `Zuletzt ${fmtShort(last.session.date)}: ${rowSummary(last.row)}` : 'Noch kein Eintrag';
  return `
    <div class="track-row${r.done ? ' done' : ''}" data-row="${i}">
      <div class="ex">
        <button class="ex-name" data-action="row-menu" data-i="${i}">${esc(ex.name)}</button>
        <div class="ex-meta">${esc(exMeta(ex))}</div>
        <div class="ex-last">${esc(lastTxt)}</div>
      </div>
      ${cell('saetze', 'f-s', 'numeric', r.saetze, '–')}
      ${cell('wdh', 'f-w', 'numeric', r.wdh, '–')}
      ${cell('kg', 'f-kg', 'decimal', r.kg, 'kg')}
      ${cell('e1', 'f-e1', 'text', r.e1, '–')}
      ${cell('e2', 'f-e2', 'text', r.e2, '–')}
      ${cell('puls', 'f-p', 'numeric', r.puls, '–')}
      <button class="chk" data-action="toggle-done" data-i="${i}" aria-label="Erledigt">${CHECK_SVG}</button>
    </div>`;
}

function cardioRowHTML(c, i) {
  const opts = (list, val) => list.map(o => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('');
  return `
    <div class="cardio-row" data-cardio="${i}">
      <select class="field" data-cfield="geraet">${opts(CARDIO_DEVICES, c.geraet)}</select>
      <select class="field" data-cfield="programm">${opts(CARDIO_PROGRAMS, c.programm)}</select>
      <div class="nums">
        <div><div class="mini">Min</div><input class="cell" data-cfield="min" inputmode="numeric" value="${esc(c.min)}" placeholder="–"></div>
        <div><div class="mini">Puls</div><input class="cell" data-cfield="puls" inputmode="numeric" value="${esc(c.puls)}" placeholder="–"></div>
        <div><div class="mini">Stufe</div><input class="cell" data-cfield="stufe" inputmode="decimal" value="${esc(c.stufe)}" placeholder="–"></div>
        <button class="icon-btn" data-action="cardio-remove" data-i="${i}" aria-label="Entfernen">✕</button>
      </div>
    </div>`;
}

function workoutView(t, isDraft) {
  const plan = planById(t.planId);
  const ref = isDraft ? null : t;
  const doneCount = t.rows.filter(r => r.done).length;
  const rows = t.rows.map((r, i) => trackRowHTML(r, i, ref)).join('');
  const cardio = t.cardio.length ? `
      <div class="section-title">Cardio</div>
      <div class="track">${t.cardio.map(cardioRowHTML).join('')}</div>` : '';

  return {
    title: isDraft ? (plan ? plan.name : 'Freies Training') : 'Training bearbeiten',
    actions: isDraft ? `<span class="badge" id="doneCount">${doneCount}/${t.rows.length}</span>` : '',
    html: `
      <div class="workout-head">
        ${planBadge(plan)}
        <input type="date" class="field" data-action-input="date" value="${esc(t.date)}" style="margin-left:auto">
      </div>
      <div class="track">
        <div class="track-row header">
          <div class="h-ex">Übung</div><div class="f-s">Sätze</div><div class="f-w">Wdh</div><div class="f-kg">kg</div>
          <div class="f-e1">Einst. 1</div><div class="f-e2">Einst. 2</div><div class="f-p">Puls</div><div class="h-chk"></div>
        </div>
        ${rows || '<div class="empty">Noch keine Übungen – füge unten welche hinzu.</div>'}
      </div>
      ${cardio}
      <div class="btn-row">
        <button class="btn" data-action="workout-add-ex">+ Übung</button>
        <button class="btn" data-action="cardio-add">+ Cardio</button>
      </div>
      ${isDraft ? `
        <button class="btn primary block" data-action="finish" style="margin-top:22px">Training speichern</button>
        <button class="btn danger block" data-action="discard" style="margin-top:6px">Training verwerfen</button>`
      : `
        <button class="btn primary block" data-action="back" style="margin-top:22px">Fertig</button>
        <button class="btn danger block" data-action="session-delete" style="margin-top:6px">Training löschen</button>`}
      <p class="small muted" style="text-align:center;margin-top:14px">Alle Eingaben werden sofort auf dem Gerät gespeichert.</p>`,
  };
}

VIEWS.session = r => {
  const s = db.sessions.find(x => x.id === r.id);
  return s ? workoutView(s, false) : null;
};

/* ----- Pläne ----- */
VIEWS.plans = () => {
  const items = db.plans.map(p => `
    <button class="list-item c-${p.color}" data-action="plan-open" data-id="${p.id}">
      <span class="dot"></span>
      <div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${p.items.length} Übungen</div></div>
      <span class="chev">›</span>
    </button>`).join('');
  return {
    title: 'Pläne',
    actions: '<button class="btn ghost small" data-action="plan-new">+ Neu</button>',
    html: `
      <div class="section-title">Deine Pläne</div>
      <div class="list">${items || '<div class="empty">Noch keine Pläne.</div>'}</div>
      <p class="small muted" style="margin:14px 4px">Tippe auf einen Plan, um Übungen, Sätze und Wiederholungen anzupassen.</p>`,
  };
};

VIEWS.planEdit = r => {
  const p = planById(r.id);
  if (!p) return null;
  const mini = (label, field, mode, val) =>
    `<div><div class="mini">${label}</div><input class="cell" data-pfield="${field}" inputmode="${mode}" value="${esc(val)}" placeholder="–"></div>`;
  const rows = p.items.map((it, i) => {
    const ex = exById(it.exId);
    return `
      <div class="edit-row" data-item="${i}">
        <div class="top">
          <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(ex.name)}</div><div class="ex-meta">${esc(exMeta(ex))}</div></div>
          <button class="icon-btn" data-action="item-up" data-i="${i}" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>↑</button>
          <button class="icon-btn" data-action="item-down" data-i="${i}" aria-label="Nach unten"${i === p.items.length - 1 ? ' disabled' : ''}>↓</button>
          <button class="icon-btn" data-action="item-remove" data-i="${i}" aria-label="Entfernen">✕</button>
        </div>
        <div class="grid">
          ${mini('Sätze', 'saetze', 'numeric', it.saetze)}
          ${mini('Wdh', 'wdh', 'numeric', it.wdh)}
          ${mini('kg', 'kg', 'decimal', it.kg)}
          ${mini('Einst. 1', 'e1', 'text', it.e1)}
          ${mini('Einst. 2', 'e2', 'text', it.e2)}
        </div>
      </div>`;
  }).join('');
  return {
    title: p.name || 'Plan',
    html: `
      <label class="lbl">Name</label>
      <input class="field" data-action-input="plan-name" value="${esc(p.name)}">
      <label class="lbl">Farbe</label>
      <div class="color-pick">
        ${COLORS.map(c => `<button class="c-${c}${p.color === c ? ' sel' : ''}" data-action="plan-color" data-c="${c}" aria-label="${c}"></button>`).join('')}
      </div>
      <div class="section-title">Übungen</div>
      <div class="list">${rows || '<div class="empty">Noch keine Übungen.</div>'}</div>
      <button class="btn block" data-action="plan-add-ex" style="margin-top:12px">+ Übung hinzufügen</button>
      <p class="small muted" style="margin:12px 4px">kg und Einstellungen sind nur Startwerte. Im Training werden automatisch die Werte vom letzten Mal übernommen.</p>
      <button class="btn danger block" data-action="plan-delete" style="margin-top:10px">Plan löschen</button>`,
  };
};

/* ----- Übungen ----- */
function plansContaining(exId) { return db.plans.filter(p => p.items.some(it => it.exId === exId)); }

function libraryListHTML(query) {
  const q = query.trim().toLowerCase();
  const list = allExercises().filter(e => !q || `${e.name} ${e.geraet} ${e.nr}`.toLowerCase().includes(q));
  const html = GROUPS.map(g => {
    const items = list.filter(e => e.group === g.id);
    if (!items.length) return '';
    return `
      <div class="section-title">${esc(g.name)}</div>
      <div class="list">${items.map(e => `
        <button class="list-item" data-action="ex-open" data-id="${e.id}">
          <div class="grow">
            <div class="t">${esc(e.name)}</div>
            <div class="s">${esc(exMeta(e))}${e.custom ? ' · eigene' : e.extra ? ' · ergänzt' : ''}</div>
          </div>
          ${plansContaining(e.id).map(p => `<span class="badge colored c-${p.color}">${esc(p.name)}</span>`).join(' ')}
          <span class="chev">›</span>
        </button>`).join('')}
      </div>`;
  }).join('');
  return html || '<div class="empty">Keine Übung gefunden.</div>';
}

const SEARCH_SVG = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';

VIEWS.library = r => ({
  title: 'Übungen',
  actions: '<button class="btn ghost small" data-action="custom-new">+ Eigene</button>',
  html: `
    <div class="search">${SEARCH_SVG}<input class="field" type="search" placeholder="Übung oder Gerät suchen" data-action-input="lib-search" value="${esc(r.q || '')}"></div>
    <div id="libList">${libraryListHTML(r.q || '')}</div>`,
});

function exerciseHistory(exId) {
  return sessionsSorted().reverse()
    .map(s => ({ s, row: s.rows.find(x => x.exId === exId) }))
    .filter(x => x.row);
}

VIEWS.exercise = r => {
  const ex = exById(r.id);
  const hist = exerciseHistory(ex.id);
  const group = GROUPS.find(g => g.id === ex.group);
  const pts = hist.map(h => ({ date: h.s.date, v: num(h.row.kg) })).filter(p => p.v !== null);
  const inPlans = plansContaining(ex.id);

  const table = hist.length ? `
    <div class="card table-wrap"><table class="hist-table">
      <thead><tr><th>Datum</th><th>Sätze</th><th>Wdh</th><th>kg</th><th>Einst. 1</th><th>Einst. 2</th><th>Puls</th></tr></thead>
      <tbody>${[...hist].reverse().map(h => `
        <tr><td>${fmtShort(h.s.date)}${h.s.date.slice(2, 4)}</td><td>${esc(h.row.saetze)}</td><td>${esc(h.row.wdh)}</td><td>${esc(h.row.kg)}</td>
        <td>${esc(h.row.e1)}</td><td>${esc(h.row.e2)}</td><td>${esc(h.row.puls)}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="card empty">Noch keine Einträge für diese Übung.</div>';

  const chart = pts.length >= 2 ? `
    <div class="section-title">Gewichtsverlauf</div>
    <div class="card">
      <div class="chart-title">Gewicht (kg)</div>
      <div class="chart-sub">${pts.length} Trainings · zuletzt ${fmtNum(pts[pts.length - 1].v)} kg · max. ${fmtNum(Math.max(...pts.map(p => p.v)))} kg</div>
      <div class="chart" id="chart"></div>
    </div>` : '';

  return {
    title: ex.name,
    html: `
      <div class="card" style="padding:14px">
        <div style="font-weight:700;font-size:18px">${esc(ex.name)}</div>
        <div class="muted small">${esc(exMeta(ex))}</div>
        <div class="muted small">${esc(group?.name || '')}</div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
          ${inPlans.map(p => `<span class="badge colored c-${p.color}">in ${esc(p.name)}</span>`).join('')}
        </div>
        <div class="btn-row" style="flex-wrap:wrap">
          ${db.plans.filter(p => !inPlans.includes(p)).map(p =>
            `<button class="btn small" data-action="ex-to-plan" data-plan="${p.id}" data-id="${ex.id}">+ zu ${esc(p.name)}</button>`).join('')}
        </div>
        ${ex.custom ? `<button class="btn danger small" data-action="custom-delete" data-id="${ex.id}" style="margin-top:8px;padding-left:0">Eigene Übung löschen</button>` : ''}
      </div>
      ${chart}
      <div class="section-title">Alle Einträge</div>
      ${table}`,
    after: () => { if (pts.length >= 2) drawChart($('#chart'), pts); },
  };
};

/* ----- Verlauf ----- */
VIEWS.history = () => {
  const list = sessionsSorted();
  const byMonth = {};
  for (const s of list) {
    const key = new Date(s.date + 'T12:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    (byMonth[key] ||= []).push(s);
  }
  const html = Object.entries(byMonth).map(([month, items]) => `
    <div class="section-title">${esc(month)} · ${items.length}×</div>
    <div class="list">${items.map(s => {
      const plan = planById(s.planId);
      const done = s.rows.filter(r => r.done).length;
      const cardio = s.cardio?.length ? ` · Cardio ${s.cardio.map(c => c.min ? c.min + ' min' : c.geraet).join(', ')}` : '';
      return `
        <button class="list-item" data-action="session-open" data-id="${s.id}">
          <div class="grow">
            <div class="t">${fmtDate(s.date)}</div>
            <div class="s">${done}/${s.rows.length} Übungen erledigt${esc(cardio)}</div>
          </div>
          ${planBadge(plan)}
          <span class="chev">›</span>
        </button>`;
    }).join('')}</div>`).join('');

  return {
    title: 'Verlauf',
    html: `
      ${html || '<div class="empty">Noch keine Trainings gespeichert.</div>'}
      <div class="section-title">Datensicherung</div>
      <div class="list">
        <button class="list-item" data-action="export"><div class="grow"><div class="t">Daten exportieren</div><div class="s">Sicherungsdatei speichern oder teilen</div></div><span class="chev">›</span></button>
        <button class="list-item" data-action="import"><div class="grow"><div class="t">Daten importieren</div><div class="s">Sicherungsdatei wiederherstellen</div></div><span class="chev">›</span></button>
      </div>
      <p class="small muted" style="margin:10px 4px">Deine Daten liegen nur auf diesem Gerät. Exportiere ab und zu eine Sicherung, z.&nbsp;B. in die Dateien-App oder iCloud Drive.</p>
      <input type="file" id="importFile" accept="application/json,.json" hidden>`,
  };
};

/* ================= Diagramm ================= */

function drawChart(el, pts) {
  const W = el.clientWidth - 24 || 300, H = 180;
  const pad = { l: 34, r: 10, t: 10, b: 22 };
  const vals = pts.map(p => p.v);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 5; hi += 5; }
  const step = niceStep((hi - lo) / 3);
  lo = Math.max(0, Math.floor(lo / step) * step);
  hi = Math.ceil(hi / step) * step;
  const x = i => pad.l + (pts.length === 1 ? 0 : i * (W - pad.l - pad.r) / (pts.length - 1));
  const y = v => pad.t + (hi - v) * (H - pad.t - pad.b) / (hi - lo);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gewichtsverlauf">
      <g class="grid">${ticks.map(v => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g class="axis">
        ${ticks.map(v => `<text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmtNum(v)}</text>`).join('')}
        <text x="${x(0)}" y="${H - 4}" text-anchor="start">${fmtShort(pts[0].date)}</text>
        <text x="${x(pts.length - 1)}" y="${H - 4}" text-anchor="end">${fmtShort(pts[pts.length - 1].date)}</text>
      </g>
      <line class="cross" id="cross" y1="${pad.t}" y2="${H - pad.b}" visibility="hidden"/>
      <polyline class="series" points="${pts.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}"/>
      ${pts.map((p, i) => `<circle class="pt" r="4.5" cx="${x(i)}" cy="${y(p.v)}" data-i="${i}"/>`).join('')}
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" id="hit"/>
    </svg>
    <div class="chart-tip" hidden></div>`;

  const svg = el.querySelector('svg'), tip = el.querySelector('.chart-tip'), cross = el.querySelector('#cross');
  const circles = [...el.querySelectorAll('.pt')];
  const show = evt => {
    const box = svg.getBoundingClientRect();
    const px = (evt.clientX - box.left) * (W / box.width);
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    circles.forEach((c, i) => c.classList.toggle('active', i === best));
    cross.setAttribute('x1', x(best)); cross.setAttribute('x2', x(best)); cross.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.textContent = `${fmtDate(pts[best].date)}: ${fmtNum(pts[best].v)} kg`;
    tip.style.left = `${12 + x(best) * box.width / W}px`;
    tip.style.top = `${14 + y(pts[best].v) * box.height / H}px`;
  };
  const hide = () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); circles.forEach(c => c.classList.remove('active')); };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', hide);
}
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/* ================= Bottom Sheet ================= */

let sheetPick = null;
function openSheet(html) {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-grip"></div>${html}`;
  sh.hidden = false; $('#sheetBackdrop').hidden = false;
  sh.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true;
  document.body.style.overflow = '';
  sheetPick = null;
}

function pickerListHTML(q) {
  return libraryListHTML(q).replaceAll('data-action="ex-open"', 'data-action="pick"');
}
function openPicker(title, onPick) {
  openSheet(`
    <div class="sheet-head"><h2>${esc(title)}</h2><button class="btn ghost small" data-action="sheet-close">Fertig</button></div>
    <div class="search">${SEARCH_SVG}<input class="field" type="search" placeholder="Übung oder Gerät suchen" data-action-input="pick-search"></div>
    <div id="pickList">${pickerListHTML('')}</div>`);
  sheetPick = onPick;
}

function openCustomForm() {
  openSheet(`
    <div class="sheet-head"><h2>Eigene Übung</h2><button class="btn ghost small" data-action="sheet-close">Abbrechen</button></div>
    <label class="lbl">Übung</label><input class="field" id="cName" placeholder="z. B. Kabelrudern einarmig">
    <label class="lbl">Trainingsgerät</label><input class="field" id="cGeraet" placeholder="z. B. Kabelzugstation">
    <label class="lbl">Gerätenummer</label><input class="field" id="cNr" placeholder="optional">
    <label class="lbl">Muskelgruppe</label>
    <select class="field" id="cGroup">${GROUPS.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select>
    <button class="btn primary block" data-action="custom-save" style="margin-top:18px">Speichern</button>`);
  setTimeout(() => $('#cName')?.focus(), 250);
}

function openRowMenu(i) {
  const t = workoutTarget();
  const r = t.rows[i];
  const ex = exById(r.exId);
  const hist = exerciseHistory(r.exId).reverse().slice(0, 3);
  openSheet(`
    <div class="sheet-head"><h2>${esc(ex.name)}</h2><button class="btn ghost small" data-action="sheet-close">Schließen</button></div>
    <div class="small muted" style="margin:-6px 2px 12px">${esc(exMeta(ex))}</div>
    ${hist.length ? `<div class="list" style="margin-bottom:14px">${hist.map(h => `
      <div class="list-item"><div class="grow"><div class="s">${fmtDate(h.s.date)}</div><div class="t">${esc(rowSummary(h.row))}</div></div></div>`).join('')}</div>` : ''}
    <div class="list">
      <button class="list-item" data-action="row-history" data-i="${i}"><div class="grow t">Verlauf &amp; Diagramm</div><span class="chev">›</span></button>
      <button class="list-item" data-action="row-up" data-i="${i}"${i === 0 ? ' disabled' : ''}><div class="grow t">Nach oben</div></button>
      <button class="list-item" data-action="row-down" data-i="${i}"${i === t.rows.length - 1 ? ' disabled' : ''}><div class="grow t">Nach unten</div></button>
      <button class="list-item" data-action="row-remove" data-i="${i}"><div class="grow t" style="color:var(--danger)">Aus diesem Training entfernen</div></button>
    </div>`);
}

/* ================= Aktionen ================= */

function swap(arr, i, j) { if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }

const ACTIONS = {
  'back': () => back(),
  'close-hint': () => { uiSet('hintClosed', true); render(); },
  'sheet-close': () => closeSheet(),

  'start': el => {
    const plan = planById(el.dataset.id);
    db.draft = { id: uid(), planId: plan.id, date: todayISO(), created: Date.now(), rows: plan.items.map(rowFromItem), cardio: [] };
    save(); render(); window.scrollTo(0, 0);
  },
  'start-free': () => {
    db.draft = { id: uid(), planId: null, date: todayISO(), created: Date.now(), rows: [], cardio: [] };
    save(); render();
  },
  'toggle-done': el => {
    const t = workoutTarget(); const i = +el.dataset.i;
    t.rows[i].done = !t.rows[i].done; save();
    el.closest('.track-row').classList.toggle('done', t.rows[i].done);
    const dc = $('#doneCount'); if (dc) dc.textContent = `${t.rows.filter(r => r.done).length}/${t.rows.length}`;
  },
  'finish': () => {
    const t = db.draft;
    if (!t.rows.length && !t.cardio.length) { toast('Noch nichts eingetragen'); return; }
    if (!t.rows.some(r => r.done) && !confirm('Keine Übung abgehakt. Trotzdem speichern?')) return;
    db.sessions.push(t); db.draft = null; save();
    render(); window.scrollTo(0, 0);
    toast('Training gespeichert 💪');
  },
  'discard': () => {
    if (!confirm('Dieses Training wirklich verwerfen? Die Eingaben gehen verloren.')) return;
    db.draft = null; save(); render();
  },
  'session-open': el => push({ view: 'session', id: el.dataset.id }),
  'session-delete': () => {
    const t = workoutTarget();
    if (!confirm(`Training vom ${fmtDate(t.date)} löschen?`)) return;
    db.sessions = db.sessions.filter(s => s.id !== t.id); save(); back();
  },
  'workout-add-ex': () => openPicker('Übung hinzufügen', id => {
    const t = workoutTarget();
    const item = planById(t.planId)?.items.find(it => it.exId === id) || { exId: id };
    t.rows.push(rowFromItem(item)); save(); closeSheet(); render();
    toast(`${exById(id).name} hinzugefügt`);
  }),
  'row-menu': el => openRowMenu(+el.dataset.i),
  'row-history': el => { const id = workoutTarget().rows[+el.dataset.i].exId; closeSheet(); push({ view: 'exercise', id }); },
  'row-up': el => { const i = +el.dataset.i; swap(workoutTarget().rows, i, i - 1); save(); closeSheet(); render(); },
  'row-down': el => { const i = +el.dataset.i; swap(workoutTarget().rows, i, i + 1); save(); closeSheet(); render(); },
  'row-remove': el => { workoutTarget().rows.splice(+el.dataset.i, 1); save(); closeSheet(); render(); },
  'cardio-add': () => {
    workoutTarget().cardio.push({ geraet: CARDIO_DEVICES[0], programm: CARDIO_PROGRAMS[4], min: '', puls: '', stufe: '' });
    save(); render();
  },
  'cardio-remove': el => { workoutTarget().cardio.splice(+el.dataset.i, 1); save(); render(); },

  'plan-open': el => push({ view: 'planEdit', id: el.dataset.id }),
  'plan-new': () => {
    const used = new Set(db.plans.map(p => p.color));
    const p = { id: uid(), name: `Tag ${String.fromCharCode(65 + db.plans.length)}`, color: COLORS.find(c => !used.has(c)) || 'green', items: [] };
    db.plans.push(p); save(); push({ view: 'planEdit', id: p.id });
  },
  'plan-color': el => { planById(cur().id).color = el.dataset.c; save(); render(); },
  'plan-delete': () => {
    const p = planById(cur().id);
    if (!confirm(`Plan „${p.name}“ löschen? Gespeicherte Trainings bleiben erhalten.`)) return;
    db.plans = db.plans.filter(x => x.id !== p.id); save(); back();
  },
  'plan-add-ex': () => openPicker('Zum Plan hinzufügen', id => {
    const p = planById(cur().id);
    p.items.push({ exId: id, saetze: '3', wdh: '12', kg: '', e1: '', e2: '' });
    save(); render(); toast(`${exById(id).name} hinzugefügt`);
  }),
  'item-up': el => { const i = +el.dataset.i; swap(planById(cur().id).items, i, i - 1); save(); render(); },
  'item-down': el => { const i = +el.dataset.i; swap(planById(cur().id).items, i, i + 1); save(); render(); },
  'item-remove': el => { planById(cur().id).items.splice(+el.dataset.i, 1); save(); render(); },

  'ex-open': el => push({ view: 'exercise', id: el.dataset.id }),
  'ex-to-plan': el => {
    const p = planById(el.dataset.plan);
    p.items.push({ exId: el.dataset.id, saetze: '3', wdh: '12', kg: '', e1: '', e2: '' });
    save(); render(); toast(`Zu ${p.name} hinzugefügt`);
  },
  'pick': el => sheetPick?.(el.dataset.id),
  'custom-new': () => openCustomForm(),
  'custom-save': () => {
    const name = $('#cName').value.trim();
    if (!name) { toast('Bitte einen Namen eingeben'); return; }
    db.custom.push({ id: 'c-' + uid(), group: $('#cGroup').value, nr: $('#cNr').value.trim(), geraet: $('#cGeraet').value.trim(), name, custom: true });
    save(); closeSheet(); render(); toast('Übung angelegt');
  },
  'custom-delete': el => {
    const id = el.dataset.id;
    if (plansContaining(id).length) { toast('Erst aus allen Plänen entfernen'); return; }
    if (!confirm('Eigene Übung löschen? Einträge im Verlauf bleiben erhalten.')) return;
    db.custom = db.custom.filter(e => e.id !== id); save(); back();
  },

  'export': async () => {
    const data = JSON.stringify({ app: 'trainingsplan', exported: new Date().toISOString(), ...db }, null, 1);
    const name = `trainingsplan-${todayISO()}.json`;
    const file = new File([data], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Trainingsplan Sicherung' }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  'import': () => $('#importFile').click(),
};

document.addEventListener('click', e => {
  const tab = e.target.closest('#tabbar button');
  if (tab) { goTab(tab.dataset.tab); return; }
  if (e.target.closest('#backBtn')) { back(); return; }
  if (e.target.id === 'sheetBackdrop') { closeSheet(); return; }
  const el = e.target.closest('[data-action]');
  if (el && !el.disabled && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el, e);
});

document.addEventListener('input', e => {
  const el = e.target;
  // Tracking-Zellen
  if (el.dataset.field) {
    const t = workoutTarget(); const i = +el.closest('[data-row]').dataset.row;
    t.rows[i][el.dataset.field] = el.value; save(); return;
  }
  if (el.dataset.cfield) {
    const t = workoutTarget(); const i = +el.closest('[data-cardio]').dataset.cardio;
    t.cardio[i][el.dataset.cfield] = el.value; save(); return;
  }
  if (el.dataset.pfield) {
    const i = +el.closest('[data-item]').dataset.item;
    planById(cur().id).items[i][el.dataset.pfield] = el.value; save(); return;
  }
  switch (el.dataset.actionInput) {
    case 'date': if (el.value) { workoutTarget().date = el.value; save(); } break;
    case 'plan-name': planById(cur().id).name = el.value; $('#title').textContent = el.value || 'Plan'; save(); break;
    case 'lib-search': cur().q = el.value; $('#libList').innerHTML = libraryListHTML(el.value); break;
    case 'pick-search': $('#pickList').innerHTML = pickerListHTML(el.value); break;
  }
});

document.addEventListener('change', async e => {
  if (e.target.id !== 'importFile') return;
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.sessions) || !Array.isArray(data.plans)) throw new Error('Format');
    if (!confirm(`Sicherung mit ${data.sessions.length} Trainings laden? Die aktuellen Daten werden ersetzt.`)) return;
    delete data.app; delete data.exported;
    db = migrate(data); save(); render(); toast('Daten wiederhergestellt');
  } catch (err) {
    toast('Datei konnte nicht gelesen werden');
  }
  e.target.value = '';
});

// Enter springt im Tracking zum nächsten Feld
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.classList.contains('cell')) return;
  e.preventDefault();
  const cells = [...document.querySelectorAll('#view .cell')];
  const next = cells[cells.indexOf(e.target) + 1];
  if (next) next.focus(); else e.target.blur();
});

/* ================= Start ================= */

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
navigator.storage?.persist?.().catch(() => {});
