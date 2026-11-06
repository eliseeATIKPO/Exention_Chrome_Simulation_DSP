/* ============================ INTERFACE ============================ */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EXO = id => EXOS.find(e => e.id === id) || EXOS[0];
const perf = () => performance.now();
const fr = n => String(n).replace('.', ',');

/* ---------- icônes ---------- */
const IC = {
  chip: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1" fill="#2B2F33"/><rect x="5.5" y="5.5" width="5" height="5" fill="#59616A"/><path d="M5 1v2M8 1v2M11 1v2M5 13v2M8 13v2M11 13v2M1 5h2M1 8h2M1 11h2M13 5h2M13 8h2M13 11h2" stroke="#B08A3E" stroke-width="1.2"/></svg>',
  newf: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 1.5h6l4 4v9H3z" fill="#FFF" stroke="#6B7280"/><path d="M9 1.5v4h4" fill="none" stroke="#6B7280"/><path d="M11.5 9v5M9 11.5h5" stroke="#2E9D3A" stroke-width="1.8"/></svg>',
  build: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1.8 13.2l6.4-6.4 1.7 1.7-6.4 6.4z" fill="#A0703A"/><path d="M6.6 3.4l3.1-1.9 4.6 4.6-1.8 3.1-1.6-1.6-1.4 1.4-2.9-2.9 1.4-1.4z" fill="#7B8591"/></svg>',
  debug: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><ellipse cx="8" cy="9.6" rx="4" ry="4.9" fill="#3A9A3A"/><circle cx="8" cy="4.2" r="2.2" fill="#2F7D2F"/><path d="M1.5 7h3M11.5 7h3M1.5 10.5h3M11.5 10.5h3M2.5 14l2.6-1.6M13.5 14l-2.6-1.6" stroke="#2F7D2F" stroke-width="1.3"/><path d="M8 6.2v8" stroke="#1C501C" stroke-width="1"/></svg>',
  resume: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="2" y="3" width="2.6" height="10" fill="#D9A400"/><path d="M6.2 3l8 5-8 5z" fill="#2E9D3A"/></svg>',
  suspend: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" fill="#D9A400"/><rect x="9.5" y="3" width="3" height="10" fill="#D9A400"/></svg>',
  term: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1" fill="#D63B30"/></svg>',
  into: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.8v8.4" stroke="#D9A400" stroke-width="2"/><path d="M4.4 7.2L8 10.8l3.6-3.6" fill="none" stroke="#D9A400" stroke-width="2"/><rect x="4.5" y="12.6" width="7" height="2" fill="#7B8591"/></svg>',
  over: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2.6 9.4a5.4 5.4 0 0 1 10.2-2.6" fill="none" stroke="#D9A400" stroke-width="2"/><path d="M14.2 3.2l-.3 4.8-4.4-1.6z" fill="#D9A400"/><rect x="4.5" y="12.6" width="7" height="2" fill="#7B8591"/></svg>',
  ret: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 14.2V5.8" stroke="#D9A400" stroke-width="2"/><path d="M4.4 8.8L8 5.2l3.6 3.6" fill="none" stroke="#D9A400" stroke-width="2"/><rect x="4.5" y="1.4" width="7" height="2" fill="#7B8591"/></svg>',
  restart: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M12.6 8.4a4.6 4.6 0 1 1-1.4-3.6" fill="none" stroke="#2E9D3A" stroke-width="2"/><path d="M13.6 2.2v4.6H9z" fill="#2E9D3A"/></svg>',
  copy: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="4.5" width="8" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 11.5V2.6a1 1 0 0 1 1-1h7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  proj: '<svg class="ficon" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5h5l1.5 1.5h6.5v8.5h-13z" fill="#E8B54A" stroke="#9C7420"/><rect x="9" y="8.5" width="5" height="4" rx=".5" fill="#2B2F33"/></svg>',
  cfile: '<svg class="ficon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6.5l3.5 3.5v9.5H3z" fill="#FFF" stroke="#7B8591"/><text x="8" y="12.4" text-anchor="middle" font-size="7.5" font-weight="700" fill="#2F6FB5" font-family="Arial">c</text></svg>',
  hfile: '<svg class="ficon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6.5l3.5 3.5v9.5H3z" fill="#FFF" stroke="#7B8591"/><text x="8" y="12.4" text-anchor="middle" font-size="7.5" font-weight="700" fill="#7F3FA0" font-family="Arial">h</text></svg>',
  deco: '<svg class="ficon" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5h5l1.5 1.5h6.5v8.5h-13z" fill="#C9CED6" stroke="#8A929C"/></svg>'
};

/* ---------- état sauvegardé ---------- */
const LS_KEY = 'f28335-sim-v1';
const lsGet = k => (k === LS_KEY ? BRIDGE.state : null);
const lsSet = (k, v) => { if (k === LS_KEY) { BRIDGE.state = v; BRIDGE.save(k, v); } return true; };
function initProject(s, ex) {
  const p = s.projects[ex.id] || (s.projects[ex.id] = {});
  p.files = Array.isArray(p.files) ? p.files.filter(f => f && typeof f.name === 'string' && typeof f.code === 'string' && typeof f.id === 'string') : [];
  if (!p.init) { if (!p.files.length) p.files.push({ id: 'main', name: 'main.c', code: ex.starter, updated: 0 }); p.init = true; }
  p.open = (Array.isArray(p.open) ? p.open : []).filter(id => p.files.some(f => f.id === id));
  if (!p.open.length && p.files.length) p.open = [p.files[0].id];
  if (!p.files.some(f => f.id === p.cur)) p.cur = p.open[0] || null;
  if (!p.bps || typeof p.bps !== 'object') p.bps = {};
  if (!Array.isArray(p.expr)) p.expr = ex.expr.slice();
  if (typeof p.expanded !== 'boolean') p.expanded = ex.id === s.active;
  if (!Array.isArray(p.sensors) || p.sensors.length !== 16) p.sensors = defaultSensors(ex);
}
function loadState() {
  let s = null; try { s = JSON.parse(lsGet(LS_KEY) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') s = {};
  s.active = EXOS.some(e => e.id === s.active) ? s.active : 'libre';
  s.projects = s.projects && typeof s.projects === 'object' ? s.projects : {};
  s.tomb = s.tomb && typeof s.tomb === 'object' ? s.tomb : {};
  s.ui = s.ui && typeof s.ui === 'object' ? s.ui : {};
  for (const ex of EXOS) initProject(s, ex);
  return s;
}
const S = loadState();

/* ---------- préférences (réglables dans Fenêtre ▸ Préférences) ---------- */
const PREF_KEY = 'f28335-sim-prefs';
const PREF_DEF = {
  ac: true, acAuto: true, acMin: 2, acProject: true, acRegs: true,
  autoClose: true, autoIndent: true, tabSize: 4, fontSize: 13, highlight: true,
  theme: 'auto', speed: 1, openIn: 'tab', hints: true, sensorsAll: false, verifyTol: 3,
  adc: { vref: 3, rounding: 'round', noiseLsb: 0, offsetLsb: 0, convScale: 1, floating: 'noise', clockFromInit: false, needPower: false, socaHz: 1000, socbHz: 1000 }
};
function readPrefs(txt) {
  let o = null; try { o = JSON.parse(txt || 'null'); } catch (e) { o = null; }
  const p = JSON.parse(JSON.stringify(PREF_DEF));
  if (o && typeof o === 'object') {
    for (const k of Object.keys(PREF_DEF)) if (k !== 'adc' && typeof o[k] === typeof PREF_DEF[k]) p[k] = o[k];
    if (o.adc && typeof o.adc === 'object') for (const k of Object.keys(PREF_DEF.adc)) if (typeof o.adc[k] === typeof PREF_DEF.adc[k]) p.adc[k] = o.adc[k];
  }
  p.acMin = Math.max(1, Math.min(4, p.acMin | 0 || 2));
  p.tabSize = [2, 3, 4, 8].includes(p.tabSize) ? p.tabSize : 4;
  p.fontSize = Math.max(10, Math.min(22, p.fontSize | 0 || 13));
  return p;
}
const P = readPrefs(BRIDGE.prefs);
let LH = Math.round(P.fontSize * 1.46);
const IND = () => ' '.repeat(P.tabSize);
function savePrefs() { const txt = JSON.stringify(P); BRIDGE.prefs = txt; BRIDGE.save(PREF_KEY, txt); }
async function copyText(text) {
  if (BRIDGE.embedded) return BRIDGE.copy(text);   // page sandbox : le presse-papiers passe par l'extension
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}
let saveTimer = null;
function saveLocal() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { const ok = lsSet(LS_KEY, JSON.stringify(S)); if (!ok && saveMode !== 'cloud') setSave('none'); }, 300);
}

/* ---------- état de la sauvegarde ---------- */
let DBC = null, saveMode = 'local';
const pend = new Map();
const docId = (exId, fid) => `${exId}--${fid}`;
function setSave(mode) {
  if (mode === 'cloud' || mode === 'local' || mode === 'none') saveMode = mode === 'none' ? saveMode : mode;
  const el = $('st-save'); if (!el) return;
  const txt = { cloud: 'Enregistré dans ton compte', pending: 'Enregistrement…', local: BRIDGE.embedded ? 'Enregistré dans l\'extension' : 'Non enregistré (ouvert hors de l\'extension)', fail: 'En ligne indisponible : gardé dans ce navigateur', none: 'Non enregistré (stockage bloqué)' }[mode] || '';
  el.textContent = txt;
}
function queueRemote() {}
function initCloud() { setSave('local'); }

/* ---------- carte simulée ---------- */
const hw = new Sim.HW();
const inp = { PB1: false, PB2: false, hex: 0, keys: new Set(), g1: 0, sw: [1, 0, 0, 1, 1, 0, 1, 1] };
const KEYPOS = { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2], 7: [2, 0], 8: [2, 1], 9: [2, 2], 0: [3, 1] };
function ext(n) {
  if (n === 17) return inp.PB1 ? 0 : 'PU';
  if (n === 48) return inp.PB2 ? 0 : 'PU';
  if (n >= 12 && n <= 15) return ((inp.hex >> (n - 12)) & 1) ? 1 : 'PD';
  if (cur.modules.includes('keypad') && n <= 6) {
    for (const k of inp.keys) { const [r, c] = KEYPOS[k]; if ((n < 4 && n === r) || (n >= 4 && n - 4 === c)) return 0; }
    return undefined;
  }
  if (cur.modules.includes('portb')) { if (n === 1) return inp.g1; if (n >= 32 && n <= 39) return inp.sw[n - 32]; }
  return undefined;
}
hw.ext = ext;

/* ---------- horloge ---------- */
const clock = { base: 0, at: perf() };
let M = null, prog = null, progEx = null, progStale = false;
const active = () => M && (M.state === 'running' || M.state === 'suspended');
function now() { if (active()) return M.vt; return clock.base + (perf() - clock.at) * 1000; }
hw.now = now;
function freezeClock() { clock.base = M ? M.vt : now(); clock.at = perf(); }

/* ---------- console ---------- */
const warned = new Set();
const cons = () => $('console');
function stamp() { const t = now() / 1e6; return (t < 100 ? t.toFixed(3) : t.toFixed(1)).replace('.', ',') + ' s'; }
function log(kind, msg, opt = {}) {
  const c = cons(); const d = document.createElement('div'); d.className = 'l ' + kind + (opt.go ? ' link' : '');
  const t = document.createElement('span'); t.className = 't'; t.textContent = opt.not ? '' : stamp();
  const m = document.createElement('span'); m.className = 'msg'; m.textContent = msg;
  d.append(t, m);
  if (opt.go) d.addEventListener('click', () => gotoLine(opt.go.file, opt.go.line));
  c.append(d);
  while (c.children.length > 600) c.firstChild.remove();
  const pane = $('bp-console'); pane.scrollTop = pane.scrollHeight;
}
function where() {
  if (!active() || !prog) return null;
  const fr = M.top; const f = prog.files[fr.file];
  return f && fr.line ? { file: f.name, line: fr.line } : null;
}
function warnOnce(key, msg, kind = 'warn') {
  if (warned.has(key)) return; warned.add(key);
  const w = where();
  log(kind, (w ? `${w.file}, ligne ${w.line} : ` : '') + msg, w ? { go: w } : {});
}
hw.warn = (k, m) => warnOnce(k, m);
hw.note = (k, m) => { if (P.hints) warnOnce(k, m, 'info'); };
if (hw.adc) hw.adc.input = (ch, t) => sensorVolt(ch, t);

/* ---------- projet courant ---------- */
let cur = EXO(S.active);
const proj = () => S.projects[cur.id];
const curFile = () => { const p = proj(); return p.files.find(f => f.id === p.cur) || null; };

/* ====================== ÉDITEUR ====================== */
const src = $('src'), hl = $('hl'), gin = $('gin'), lay = $('lay'), codebox = $('codebox');
let marks = { file: null, map: new Map() };   // repères de compilation
let execMark = null;                          // ligne d'exécution courante
const HL_RE = new RegExp([
  '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',
  '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')',
  '(^[ \\t]*#[ \\t]*\\w+)',
  '(\\b0[xX][0-9A-Fa-f]+[uUlL]*\\b|\\b\\d+(?:\\.\\d+)?[uUlLfF]*\\b)',
  '(\\b(?:void|int|char|short|long|float|double|signed|unsigned|const|volatile|static|extern|register|interrupt|if|else|while|for|do|switch|case|default|break|continue|return|sizeof|goto|struct|union|enum|typedef|asm|__asm|Uint16|Uint32|Uint8|Uint64|int16|int32|int64|float32|float64|bool)\\b)',
  '(\\b(?:EALLOW|EDIS|DELAY_US|ESTOP0|EINT|DINT|ERTM|DRTM|TRUE|FALSE|NULL|InitAdc|initADC|InitSysCtrl)\\b)',
  '(\\b(?:GpioCtrlRegs|GpioDataRegs|GP[ABC](?:MUX[12]|DIR|PUD|QSEL[12]|CTRL|DAT|SET|CLEAR|TOGGLE)|AdcRegs|AdcMirror|SysCtrlRegs|PCLKCR0|ADC(?:TRL[123]|MAXCONV|CHSELSEQ[1-4]|ASEQSR|RESULT\\d{1,2}|ST|REFSEL|OFFTRIM))\\b)'
].join('|'), 'gm');
function highlight(t) {
  if (!P.highlight) return esc(t);
  let out = '', last = 0; HL_RE.lastIndex = 0; let m;
  while ((m = HL_RE.exec(t))) {
    out += esc(t.slice(last, m.index));
    const cls = m[1] ? 'cm' : m[2] ? 's' : m[3] ? 'pp' : m[4] ? 'n' : m[5] ? 'k' : m[6] ? 'm' : 'r';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
    if (m[0].length === 0) HL_RE.lastIndex++;
  }
  return out + esc(t.slice(last));
}
function fileMarks(f) {
  const res = new Map();
  if (!f) return res;
  for (const pr of problems) if (pr.file === f.name && pr.line) { const prev = res.get(pr.line); if (prev !== 'err') res.set(pr.line, pr.sev === 'e' ? 'err' : 'warn'); }
  if (runErr && runErr.file === f.name) res.set(runErr.line, 'err');
  return res;
}
function renderEditor() {
  const f = curFile();
  $('emptyed').hidden = !!f; src.hidden = !f; hl.hidden = !f;
  if (!f) { gin.innerHTML = ''; lay.innerHTML = ''; return; }
  hl.innerHTML = highlight(src.value) + '\n ';
  renderGutter();
}
function renderGutter() {
  const f = curFile(); if (!f) return;
  const n = src.value.split('\n').length;
  const bps = new Set(proj().bps[f.id] || []);
  const mk = fileMarks(f);
  const ex = execMark && execMark.file === f.name ? execMark : null;
  let g = '', l = '';
  for (let i = 1; i <= n; i++) {
    const c = ['gl']; if (bps.has(i)) c.push('bp'); const m = mk.get(i); if (m) c.push(m); if (ex && ex.line === i && ex.top) c.push('cur');
    g += `<div class="${c.join(' ')}" data-l="${i}" title="Ligne ${i} : clic pour ${bps.has(i) ? 'enlever le' : 'poser un'} point d'arrêt"><i></i><span>${i}</span></div>`;
    if (ex && ex.line === i) l += `<div class="${ex.top ? 'cur' : 'cur2'}" style="top:${6 + (i - 1) * LH}px"></div>`;
    else if (m) l += `<div class="${m}" style="top:${6 + (i - 1) * LH}px"></div>`;
  }
  gin.innerHTML = g + '<div style="height:40px"></div>';
  lay.innerHTML = l;
  syncScroll();
}
const gutterEl = $('gutter');
gutterEl.addEventListener('scroll', () => { if (gutterEl.scrollTop) gutterEl.scrollTop = 0; });
function syncScroll() {
  if (gutterEl.scrollTop) gutterEl.scrollTop = 0;
  hl.scrollTop = src.scrollTop; hl.scrollLeft = src.scrollLeft;
  gin.style.transform = `translateY(${-src.scrollTop}px)`;
  lay.style.transform = `translate(${-src.scrollLeft}px,${-src.scrollTop}px)`;
}
function loadEditorText() {
  const f = curFile();
  src.value = f ? f.code : '';
  src.scrollTop = 0; src.scrollLeft = 0;
  renderEditor(); updateStatus();
}
$('gutter').addEventListener('click', e => { const d = e.target.closest('.gl'); if (d) toggleBp(+d.dataset.l); });
src.addEventListener('scroll', () => { syncScroll(); acClose(); });
src.addEventListener('input', e => {
  const f = curFile(); if (!f) return;
  f.code = src.value; f.updated = Date.now();
  if (runErr && runErr.file === f.name) runErr = null;
  renderEditor(); saveLocal(); queueRemote(cur.id, f);
  if (prog && progEx === cur.id && !progStale) { progStale = true; updateStatus(); }
  acOnInput(e);
});
src.addEventListener('keyup', updateCaret); src.addEventListener('click', updateCaret);
function updateCaret() { const v = src.value.slice(0, src.selectionStart); const ln = v.split('\n').length; const col = v.length - v.lastIndexOf('\n'); $('st-pos').textContent = `${ln} : ${col}`; }
src.addEventListener('keydown', e => {
  if (acKey(e)) return;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runNow(); return; }
  if (e.key === '/' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggleComment(); return; }
  if (e.key === 'Tab') {
    e.preventDefault();
    const a = src.selectionStart, b = src.selectionEnd, v = src.value;
    if (a !== b && v.slice(a, b).includes('\n')) {
      const ls = v.lastIndexOf('\n', a - 1) + 1; const block = v.slice(ls, b);
      const nb = e.shiftKey ? block.replace(new RegExp(`^( {1,${IND().length}}|\\t)`, 'gm'), '') : block.replace(/^/gm, IND());
      edit(ls, b, nb); src.setSelectionRange(ls, ls + nb.length); return;
    }
    if (e.shiftKey) { const ls = v.lastIndexOf('\n', a - 1) + 1; const m = new RegExp(`^ {1,${IND().length}}`).exec(v.slice(ls)); if (m) edit(ls, ls + m[0].length, '', Math.max(ls, a - m[0].length)); return; }
    edit(a, b, IND()); return;
  }
  pairKey(e);
});
function edit(a, b, text, caret) {
  src.focus(); src.setSelectionRange(a, b); let ok = false;
  try { ok = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text); } catch (_) { ok = false; }
  if (!ok) { src.setRangeText(text, a, b, 'end'); src.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text })); }
  if (caret != null) src.setSelectionRange(caret, caret);
}
function toggleComment() {
  const v = src.value, a = src.selectionStart, b = src.selectionEnd;
  const ls = v.lastIndexOf('\n', a - 1) + 1; let le = v.indexOf('\n', Math.max(b - (b > a && v[b - 1] === '\n' ? 1 : 0), a)); if (le < 0) le = v.length;
  const block = v.slice(ls, le); const lines = block.split('\n');
  const all = lines.filter(l => l.trim()).every(l => /^\s*\/\//.test(l));
  const nb = lines.map(l => all ? l.replace(/^(\s*)\/\/ ?/, '$1') : (l.trim() ? l.replace(/^(\s*)/, '$1// ') : l)).join('\n');
  edit(ls, le, nb); src.setSelectionRange(ls, ls + nb.length);
}
const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }; const CLOSERS = new Set([')', ']', '}', '"', "'"]);
function pairKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return false;
  const a = src.selectionStart, b = src.selectionEnd, v = src.value, next = v[b] || '', prev = v[a - 1] || '', k = e.key;
  if (k === 'Enter' && !e.shiftKey && !P.autoIndent) return false;
  if (k !== 'Enter' && !P.autoClose) return false;
  const U = IND();
  if (PAIRS[k] && a !== b && !v.slice(a, b).includes('\n')) { e.preventDefault(); edit(a, b, k + v.slice(a, b) + PAIRS[k]); src.setSelectionRange(a + 1, b + 1); return true; }
  if (CLOSERS.has(k) && a === b && next === k) { e.preventDefault(); src.setSelectionRange(a + 1, a + 1); return true; }
  if (k === '"' || k === "'") { if (a === b && !/\w/.test(prev) && !/\w/.test(next)) { e.preventDefault(); edit(a, b, k + k, a + 1); return true; } return false; }
  if (k === '(' || k === '[' || k === '{') { if (a === b && (next === '' || /[\s)\]};,]/.test(next))) { e.preventDefault(); edit(a, b, k + PAIRS[k], a + 1); return true; } return false; }
  if (k === '}' && a === b) { const ls = v.lastIndexOf('\n', a - 1) + 1, lead = v.slice(ls, a); if (/^ +$/.test(lead) && lead.length >= U.length) { e.preventDefault(); edit(a - U.length, a, '}'); return true; } return false; }
  if (k === 'Backspace' && a === b && a > 0 && PAIRS[prev] && next === PAIRS[prev]) { e.preventDefault(); edit(a - 1, a + 1, ''); return true; }
  if (k === 'Enter' && !e.shiftKey) {
    const ls = v.lastIndexOf('\n', a - 1) + 1, indent = /^[ \t]*/.exec(v.slice(ls, a))[0]; e.preventDefault();
    if (prev === '{' && next === '}' && a === b && P.autoClose) { edit(a, b, '\n' + indent + U + '\n' + indent, a + 1 + indent.length + U.length); return true; }
    edit(a, b, '\n' + indent + (prev === '{' ? U : '')); return true;
  }
  return false;
}

/* ---------- autocomplétion ---------- */
const REG_DESC = { MUX1: 'fonction de la broche, 0 = GPIO', MUX2: 'fonction de la broche, 0 = GPIO', DIR: '0 = entrée, 1 = sortie', PUD: '0 = pull-up activée, 1 = désactivée', QSEL1: 'filtrage des entrées', QSEL2: 'filtrage des entrées', CTRL: 'période de filtrage', DAT: 'lire ou écrire le niveau', SET: 'écrire 1 → met à 1', CLEAR: 'écrire 1 → met à 0', TOGGLE: 'écrire 1 → inverse' };
const CTRL_KINDS = ['MUX1', 'MUX2', 'DIR', 'PUD', 'QSEL1', 'QSEL2', 'CTRL'], DATA_KINDS = ['DAT', 'SET', 'CLEAR', 'TOGGLE'];
const ac = document.createElement('div'); ac.className = 'ac'; ac.hidden = true;
ac.innerHTML = '<ul role="listbox" id="aclist" aria-label="Suggestions"></ul><div class="ft">↑ ↓ choisir · Entrée ou Tab valider · Échap fermer</div>';
codebox.append(ac);
const acList = ac.querySelector('ul');
ac.addEventListener('mousedown', e => e.preventDefault());
const meas = document.createElement('span'); meas.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-family:var(--f-mono);font-size:var(--cfs,13px)'; meas.textContent = '0000000000'; codebox.append(meas);
let acItems = [], acSel = 0, acStart = 0, acSuppress = false;
const KW = [['void', 'type sans valeur'], ['Uint16', 'entier non signé 16 bits'], ['Uint32', 'entier non signé 32 bits'], ['int', 'entier 16 bits sur C28x'], ['long', 'entier 32 bits'], ['char', 'caractère (16 bits sur C28x)'], ['float', 'réel'], ['unsigned', 'non signé'],
  ['if', 'condition'], ['else', 'sinon'], ['while', 'boucle tant que'], ['for', 'boucle compteur'], ['do', 'faire… tant que'], ['switch', 'choix multiple'], ['case', 'cas du switch'], ['default', 'cas par défaut'], ['break', 'sortir'], ['continue', 'tour suivant'], ['return', 'renvoyer'], ['const', 'constante'], ['volatile', 'modifiable par le matériel'], ['static', 'durée de vie du programme']];
const MACROS = [
  { label: 'EALLOW;', insert: 'EALLOW;', desc: 'déverrouille GpioCtrlRegs', kind: 'M' },
  { label: 'EDIS;', insert: 'EDIS;', desc: 'reverrouille', kind: 'M' },
  { label: 'DELAY_US()', insert: 'DELAY_US(|);', desc: 'attente en µs', kind: 'M' },
  { label: 'InitSysCtrl()', insert: 'InitSysCtrl();', desc: 'init. horloge du DSP', kind: 'M' },
  { label: 'GpioCtrlRegs', insert: 'GpioCtrlRegs.', desc: 'registres de configuration', kind: 'R', reopen: true },
  { label: 'GpioDataRegs', insert: 'GpioDataRegs.', desc: 'registres de données', kind: 'R', reopen: true },
  { label: 'AdcRegs', insert: 'AdcRegs.', desc: 'registres du convertisseur A/N', kind: 'R', reopen: true },
  { label: 'AdcMirror', insert: 'AdcMirror.', desc: 'résultats justifiés à droite (0–4095)', kind: 'R', reopen: true },
  { label: 'SysCtrlRegs', insert: 'SysCtrlRegs.', desc: 'contrôle système (PCLKCR0 : horloges)', kind: 'R', reopen: true },
  { label: 'ADCENCLK = 1 (horloge ADC)', insert: 'EALLOW;\nSysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1;   // horloge de l\'ADC\nEDIS;', desc: 'active l\'horloge du module ADC', kind: 'M', key: 'adcenclk' },
  { label: 'initADC()', insert: 'initADC();', desc: 'mise sous tension + calibration (étape 3)', kind: 'M' },
  { label: 'InitAdc()', insert: 'InitAdc();', desc: 'nom TI de la même fonction', kind: 'M' },
  { label: 'asm(" NOP")', insert: 'asm(" NOP");', desc: 'attendre un cycle (après RESET)', kind: 'M', key: 'nop' },
  { label: 'RST_SEQ1 + SOC_SEQ1', insert: 'AdcRegs.ADCTRL2.bit.RST_SEQ1 = 1;   // séquenceur au début\nAdcRegs.ADCTRL2.bit.SOC_SEQ1 = 1;   // déclenchement logiciel', desc: 'lancer une séquence', kind: 'M', key: 'soc' },
  { label: 'attente SEQ1_BSY', insert: 'while (AdcRegs.ADCST.bit.SEQ1_BSY == 1);   // fin de séquence', desc: 'attendre la fin de conversion', kind: 'M', key: 'seq1_bsy' },
  { label: 'attente INT_SEQ1', insert: 'while (AdcRegs.ADCST.bit.INT_SEQ1 == 0);\nAdcRegs.ADCST.bit.INT_SEQ1_CLR = 1;', desc: 'drapeau de fin de séquence', kind: 'M', key: 'int_seq1' },
  { label: 'printf()', insert: 'printf("|\\n");', desc: 'affiche dans la console', kind: 'M' },
  { label: 'while (1) { … }', insert: 'while (1)\n{\n    |\n}', desc: 'boucle infinie du main', kind: 'K', key: 'while' },
  { label: 'for (…) { … }', insert: 'for (i = 0; i < |; i++)\n{\n    \n}', desc: 'boucle compteur', kind: 'K', key: 'for' },
  { label: '#define', insert: '#define |', desc: 'constante', kind: 'M', key: 'define' },
  { label: '#include', insert: '#include "DSP28x_Project.h"', desc: 'en-tête du DSP', kind: 'M', key: 'include' }];
function rangeOf(P, kind) { const B = { A: 0, B: 32, C: 64 }[P], E = { A: 31, B: 63, C: 87 }[P]; if (/^(MUX|QSEL)/.test(kind)) { const lo = B + (kind.endsWith('2') ? 16 : 0); return [lo, Math.min(lo + 15, E)]; } return [B, E]; }
function pinLabel(n) {
  const board = { 9: 'LD1', 11: 'LD2', 34: 'LD3', 49: 'LD4', 17: 'PB1', 48: 'PB2', 12: 'roue bit 0', 13: 'roue bit 1', 14: 'roue bit 2', 15: 'roue bit 3' };
  const c = cur.comps.find(x => x.pin === n);
  return c ? c.name : board[n] || null;
}
function userWords(text) {
  const set = new Map(); const re = /\b(?:void|Uint16|Uint32|Uint8|int16|int32|int|long|char|float|double|unsigned|short)\s+([A-Za-z_]\w*)\s*(\()?/g; let m;
  const clean = text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ' ');
  while ((m = re.exec(clean))) if (!set.has(m[1])) set.set(m[1], m[2] ? 'fonction' : 'variable');
  const d = /#\s*define\s+(\w+)/g; while ((m = d.exec(clean))) set.set(m[1], 'constante');
  return set;
}
function acContext(force) {
  const pos = src.selectionStart; if (pos !== src.selectionEnd) return null;
  const before = src.value.slice(0, pos); const lineTxt = before.slice(before.lastIndexOf('\n') + 1);
  if (/\/\//.test(lineTxt) && !/"[^"]*$/.test(lineTxt)) return null;
  let m;
  if (P.acRegs && (m = /\b(AdcRegs|AdcMirror|SysCtrlRegs)((?:\s*\.\s*\w+)*)\s*\.\s*(\w*)$/.exec(before))) {
    const path = m[2].split('.').map(x => x.trim()).filter(Boolean), pre = m[3];
    const items = AdcSim.completions(m[1], path);
    if (items) return { start: pos - pre.length, pre, items };
    if (m[1] !== 'SysCtrlRegs') return null;
  }
  if (!P.acRegs && /\b(Gpio(Ctrl|Data)Regs|AdcRegs|AdcMirror|SysCtrlRegs)[\w.\s]*\.\s*\w*$/.test(before)) return null;
  if ((m = /Gpio(Ctrl|Data)Regs\s*\.\s*GP([ABC])(MUX1|MUX2|DIR|PUD|QSEL1|QSEL2|CTRL|DAT|SET|CLEAR|TOGGLE)\s*\.\s*bit\s*\.\s*(\w*)$/.exec(before))) {
    const [, , P, kind, pre] = m; let items;
    if (kind === 'CTRL') items = [0, 1, 2, 3].map(i => ({ label: `QUALPRD${i}`, insert: `QUALPRD${i} = `, desc: 'période de filtrage', kind: 'b' }));
    else {
      const [lo, hi] = rangeOf(P, kind); items = [];
      for (let n = lo; n <= hi; n++) { const comp = pinLabel(n); items.push({ label: `GPIO${n}`, insert: `GPIO${n}${/^(SET|CLEAR|TOGGLE)$/.test(kind) ? ' = 1;' : ' = '}`, desc: comp ? comp : `port ${P}`, kind: 'P', star: !!comp }); }
      items.sort((a, b) => (b.star - a.star));
    }
    return { start: pos - pre.length, pre, items };
  }
  if ((m = /Gpio(Ctrl|Data)Regs\s*\.\s*GP([ABC])(\w+)\s*\.\s*(\w*)$/.exec(before))) {
    const pre = m[4]; return { start: pos - pre.length, pre, items: [{ label: 'bit', insert: 'bit.', desc: 'une broche : .bit.GPIOxx', kind: 'b', reopen: true }, { label: 'all', insert: 'all', desc: 'tout le registre (32 bits)', kind: 'b' }] };
  }
  if ((m = /Gpio(Ctrl|Data)Regs\s*\.\s*(\w*)$/.exec(before))) {
    const ctrl = m[1] === 'Ctrl', pre = m[2]; const kinds = ctrl ? CTRL_KINDS : DATA_KINDS; const items = [];
    for (const P of ['A', 'B', 'C']) for (const k of kinds) { if (P === 'C' && /QSEL|CTRL/.test(k)) continue; const [lo, hi] = rangeOf(P, k); items.push({ label: `GP${P}${k}`, insert: `GP${P}${k}.`, desc: `${REG_DESC[k]} · GPIO${lo}–${hi}`, kind: 'R', reopen: true }); }
    return { start: pos - pre.length, pre, items };
  }
  if ((m = /(?:^|[^\w.#])(#?[A-Za-z_]\w*)$/.exec(before)) || (force && (m = [, '']))) {
    const pre = m[1] || ''; if (!force && pre.length < P.acMin) return null;
    const items = [...MACROS];
    for (const [w, d] of KW) items.push({ label: w, insert: w, desc: d, kind: 'K' });
    const all = proj().files.map(f => f.code).join('\n');
    if (P.acProject) for (const [w, d] of userWords(all)) if (w !== pre) items.push({ label: w, insert: w + (d === 'fonction' ? '();' : ''), desc: `${d} de ton projet`, kind: 'F' });
    return { start: pos - pre.length, pre, items };
  }
  return null;
}
function acFilter(ctx) {
  const p = ctx.pre.toLowerCase(); if (!p) return ctx.items;
  const key = i => (i.key || i.label).toLowerCase();
  const a = ctx.items.filter(i => key(i).startsWith(p) || i.label.toLowerCase().startsWith(p));
  const b = p.length >= 2 ? ctx.items.filter(i => !a.includes(i) && i.label.toLowerCase().includes(p)) : [];
  const r = a.concat(b); return r.length === 1 && r[0].insert === ctx.pre ? [] : r;
}
function acOpen(force) {
  const ctx = acContext(force); if (!ctx) { acClose(); return; }
  acItems = acFilter(ctx); if (!acItems.length) { acClose(); return; }
  acStart = ctx.start; acSel = 0;
  acList.innerHTML = acItems.map((it, i) => {
    let lb = esc(it.label); const p = ctx.pre;
    if (p && it.label.toLowerCase().startsWith(p.toLowerCase())) lb = `<mark>${esc(it.label.slice(0, p.length))}</mark>${esc(it.label.slice(p.length))}`;
    return `<li role="option" id="aco-${i}" data-i="${i}"${i === 0 ? ' class="sel" aria-selected="true"' : ''}><span class="ik ${it.kind}">${it.kind === 'b' ? '·' : it.kind}</span><span class="lb">${lb}</span><span class="ds">${esc(it.desc || '')}</span></li>`;
  }).join('');
  acList.querySelectorAll('li').forEach(li => li.addEventListener('click', () => acAccept(+li.dataset.i)));
  ac.hidden = false; src.setAttribute('aria-activedescendant', 'aco-0'); acPlace();
}
function acPlace() {
  const pos = src.selectionStart, before = src.value.slice(0, pos), lines = before.split('\n'), last = lines[lines.length - 1];
  let col = 0; for (const c of last) col = c === '\t' ? (Math.floor(col / 4) + 1) * 4 : col + 1;
  const cw = meas.getBoundingClientRect().width / 10 || 7.2; const box = codebox.getBoundingClientRect();
  const w = ac.offsetWidth, h = ac.offsetHeight;
  let x = 12 + col * cw - src.scrollLeft, y = 6 + lines.length * LH - src.scrollTop + 2;
  x = Math.max(4, Math.min(x, box.width - w - 4)); if (y + h > box.height - 2) y = Math.max(2, y - 21 - h);
  ac.style.left = x + 'px'; ac.style.top = y + 'px';
}
function acClose() { if (!ac.hidden) { ac.hidden = true; src.removeAttribute('aria-activedescendant'); } }
function acMove(d) {
  if (!acItems.length) return; const lis = acList.children; lis[acSel].classList.remove('sel'); lis[acSel].removeAttribute('aria-selected');
  acSel = (acSel + d + acItems.length) % acItems.length; lis[acSel].classList.add('sel'); lis[acSel].setAttribute('aria-selected', 'true');
  lis[acSel].scrollIntoView({ block: 'nearest' }); src.setAttribute('aria-activedescendant', 'aco-' + acSel);
}
function acAccept(i) {
  const it = acItems[i]; if (!it) return; const pos = src.selectionStart;
  const lineStart = src.value.lastIndexOf('\n', acStart - 1) + 1; const indent = (/^[ \t]*/.exec(src.value.slice(lineStart)) || [''])[0];
  let ins = it.insert.replace(/\n/g, '\n' + indent); let c = ins.indexOf('|'); if (c >= 0) ins = ins.replace('|', ''); else c = ins.length;
  acSuppress = true; edit(acStart, pos, ins, acStart + c); acSuppress = false;
  acClose(); if (it.reopen) setTimeout(() => acOpen(false), 0);
}
function acKey(e) {
  if (e.key === ' ' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); toggleAc(); return true; }
  if (e.key === ' ' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (P.ac) acOpen(true); else toast('Autocomplétion désactivée : Ctrl+Maj+Espace (ou Édition ▸ Autocomplétion) pour la réactiver'); return true; }
  if (ac.hidden) return false;
  if (e.key === 'ArrowDown') { e.preventDefault(); acMove(1); return true; }
  if (e.key === 'ArrowUp') { e.preventDefault(); acMove(-1); return true; }
  if ((e.key === 'Enter' && !e.ctrlKey && !e.metaKey) || e.key === 'Tab') { e.preventDefault(); acAccept(acSel); return true; }
  if (e.key === 'Escape') { e.preventDefault(); acClose(); return true; }
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { acClose(); return false; }
  return false;
}
function acOnInput(e) {
  if (acSuppress || !e || !e.inputType) return;
  if (!P.ac || !P.acAuto) { acClose(); return; }
  if (e.inputType === 'insertText' && e.data && /[\w.#]/.test(e.data)) acOpen(false);
  else if (e.inputType.startsWith('delete') && !ac.hidden) acOpen(false);
  else acClose();
}
src.addEventListener('blur', acClose);

/* ---------- onglets de fichiers ---------- */
function renderFileTabs() {
  const p = proj(); const el = $('ftabs');
  el.innerHTML = p.open.map(id => { const f = p.files.find(x => x.id === id); if (!f) return ''; return `<div class="ftab" role="tab" aria-selected="${id === p.cur}" data-id="${id}" tabindex="0">${/\.h$/i.test(f.name) ? IC.hfile : IC.cfile}<span>${esc(f.name)}</span><button class="x" data-x="${id}" aria-label="Fermer ${esc(f.name)}" title="Fermer">×</button></div>`; }).join('')
    + `<span class="grow"></span><button class="copy" id="copybtn" title="Copier tout le fichier dans le presse-papiers">${IC.copy}Copier le fichier</button>`;
  el.querySelectorAll('.ftab').forEach(t => {
    t.addEventListener('click', e => { if (e.target.closest('.x')) return; openFile(t.dataset.id); });
    t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFile(t.dataset.id); } });
  });
  el.querySelectorAll('.x').forEach(b => b.addEventListener('click', () => closeFile(b.dataset.x)));
  $('copybtn').addEventListener('click', copyFile);
}
function openFile(id, keepScroll) {
  const p = proj(); if (!p.files.some(f => f.id === id)) return;
  if (!p.open.includes(id)) p.open.push(id);
  if (p.cur !== id) { p.cur = id; loadEditorText(); } else if (!keepScroll) renderEditor();
  renderFileTabs(); renderTree(); saveLocal();
}
function closeFile(id) {
  const p = proj(); const i = p.open.indexOf(id); if (i < 0) return;
  p.open.splice(i, 1);
  if (p.cur === id) { p.cur = p.open[Math.max(0, i - 1)] || null; loadEditorText(); }
  renderFileTabs(); renderTree(); saveLocal();
}
async function copyFile() {
  const f = curFile(); if (!f) return;
  if (await copyText(f.code)) toast(`${f.name} copié dans le presse-papiers`);
  else { src.focus(); src.select(); toast('Copie automatique refusée : le texte est sélectionné, fais Ctrl+C'); }
}
function gotoLine(fileName, line) {
  const p = proj(); const f = p.files.find(x => x.name === fileName);
  if (!f) return;
  openFile(f.id, true);
  const lines = src.value.split('\n'); let pos = 0; for (let i = 0; i < Math.min(line - 1, lines.length); i++) pos += lines[i].length + 1;
  src.focus(); src.setSelectionRange(pos, pos);
  const want = (line - 1) * LH - src.clientHeight / 3; src.scrollTop = Math.max(0, want); syncScroll(); updateCaret();
}
function scrollToLine(line) { const top = (line - 1) * LH, h = src.clientHeight; if (top < src.scrollTop + LH || top > src.scrollTop + h - 3 * LH) src.scrollTop = Math.max(0, top - h / 3); syncScroll(); }

/* ---------- explorateur de projets ---------- */
function renderTree() {
  const el = $('tree');
  el.innerHTML = EXOS.map(ex => {
    const p = S.projects[ex.id]; const isAct = ex.id === cur.id; const open = p.expanded;
    const files = p.files.slice().sort((a, b) => a.name.localeCompare(b.name));
    return `<li><div class="trow proj${isAct ? ' active' : ''}" data-p="${ex.id}" role="treeitem" aria-expanded="${open}" tabindex="0" title="${esc(ex.title)}"><span class="tw">${open ? '▾' : '▸'}</span>${IC.proj}<span class="nm">${esc(ex.proj)}</span>${isAct ? '<span class="act">[Active]</span>' : ''}<span class="acts"><button data-newin="${ex.id}" title="Nouveau fichier dans ${esc(ex.proj)}" aria-label="Nouveau fichier">+</button></span></div>
    ${open ? `<ul role="group">
      <li><div class="trow deco" title="En-têtes du DSP, fournis par le simulateur">${IC.deco}<span class="nm">Includes</span></div></li>
      ${files.map(f => `<li><div class="trow file${isAct && p.cur === f.id ? ' sel' : ''}" data-f="${f.id}" data-in="${ex.id}" role="treeitem" tabindex="0">${/\.h$/i.test(f.name) ? IC.hfile : IC.cfile}<span class="nm">${esc(f.name)}</span><span class="acts"><button data-ren="${f.id}" data-in="${ex.id}" title="Renommer" aria-label="Renommer ${esc(f.name)}">✎</button><button data-del="${f.id}" data-in="${ex.id}" title="Supprimer" aria-label="Supprimer ${esc(f.name)}">×</button></span></div></li>`).join('')}
      ${files.length ? '' : '<li><div class="trow deco"><span class="nm">aucun fichier — clique sur +</span></div></li>'}
    </ul>` : ''}</li>`;
  }).join('');
  el.querySelectorAll('.trow.proj').forEach(r => {
    const go = e => {
      if (e.target.closest('[data-newin]')) return;
      const id = r.dataset.p; const p = S.projects[id];
      if (id === cur.id) { p.expanded = !p.expanded; renderTree(); saveLocal(); }
      else { p.expanded = true; selectExercise(id); }
    };
    r.addEventListener('click', go);
    r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  });
  el.querySelectorAll('.trow.file').forEach(r => {
    const go = e => { if (e.target.closest('button')) return; const exId = r.dataset.in; if (exId !== cur.id) selectExercise(exId); openFile(r.dataset.f); src.focus(); };
    r.addEventListener('click', go);
    r.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(e); } });
  });
  el.querySelectorAll('[data-newin]').forEach(b => b.addEventListener('click', () => { if (b.dataset.newin !== cur.id) selectExercise(b.dataset.newin); newFileDlg(); }));
  el.querySelectorAll('[data-ren]').forEach(b => b.addEventListener('click', () => { if (b.dataset.in !== cur.id) selectExercise(b.dataset.in); renameDlg(b.dataset.ren); }));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (b.dataset.in !== cur.id) selectExercise(b.dataset.in); deleteDlg(b.dataset.del); }));
}

/* ---------- boîtes de dialogue ---------- */
function dialog({ title, body, okLabel, cancelLabel = 'Annuler', onOk, wide, input, danger }) {
  const back = document.createElement('div'); back.className = 'dlg-back';
  back.innerHTML = `<div class="dlg${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><h3 id="dlg-t">${esc(title)}</h3><div class="db">${body || ''}${input ? `<input id="dlg-in" type="text" value="${esc(input.value || '')}" aria-label="${esc(input.label)}" spellcheck="false" autocomplete="off"><p class="derr" id="dlg-err"></p>` : ''}</div><div class="df">${cancelLabel ? `<button class="btn" id="dlg-c">${esc(cancelLabel)}</button>` : ''}${okLabel ? `<button class="btn primary" id="dlg-ok"${danger ? ' style="background:var(--err);border-color:var(--err)"' : ''}>${esc(okLabel)}</button>` : ''}</div></div>`;
  document.body.append(back);
  const prevFocus = document.activeElement;
  const close = () => { back.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
  const ok = () => { const v = input ? $('dlg-in').value.trim() : null; const err = onOk ? onOk(v) : null; if (err) { $('dlg-err').textContent = err; return; } close(); };
  if ($('dlg-c')) $('dlg-c').addEventListener('click', close);
  if ($('dlg-ok')) $('dlg-ok').addEventListener('click', ok);
  back.addEventListener('mousedown', e => { if (e.target === back) close(); });
  back.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } if (e.key === 'Enter' && input) { e.preventDefault(); ok(); } });
  const inEl = $('dlg-in'); if (inEl) { inEl.focus(); const dot = inEl.value.lastIndexOf('.'); inEl.setSelectionRange(0, dot > 0 ? dot : inEl.value.length); }
  else ($('dlg-ok') || $('dlg-c')).focus();
}
function checkName(n, exceptId) {
  if (!n) return 'Donne un nom au fichier.';
  if (!/^[A-Za-z_][\w-]*\.(c|h)$/.test(n)) return 'Nom valide : lettres, chiffres, _ ou -, et l\'extension .c ou .h (ex. cas.c, cas.h).';
  if (proj().files.some(f => f.name.toLowerCase() === n.toLowerCase() && f.id !== exceptId)) return 'Un fichier porte déjà ce nom dans ce projet.';
  return null;
}
function newFileDlg() {
  dialog({
    title: `Nouveau fichier dans ${cur.proj}`, okLabel: 'Créer', input: { label: 'Nom du fichier', value: proj().files.some(f => f.name === 'main.c') ? 'fonctions.c' : 'main.c' },
    body: '<p class="hint">Un .c contient des fonctions ; un .h contient des prototypes et des #define, à inclure avec #include "nom.h". Tous les .c du projet sont compilés ensemble, comme dans Code Composer.</p>',
    onOk: n => {
      const err = checkName(n); if (err) return err;
      const isH = /\.h$/i.test(n); const guard = n.replace(/\W/g, '_').toUpperCase();
      const code = isH ? `#ifndef ${guard}\n#define ${guard}\n\n// prototypes et #define\n\n#endif\n` : `#include "DSP28x_Project.h"\n\n`;
      const f = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: n, code, updated: Date.now() };
      proj().files.push(f); proj().expanded = true; saveLocal(); queueRemote(cur.id, f); openFile(f.id); src.focus();
      return null;
    }
  });
}
function renameDlg(id) {
  const f = proj().files.find(x => x.id === id); if (!f) return;
  dialog({
    title: `Renommer ${f.name}`, okLabel: 'Renommer', input: { label: 'Nouveau nom', value: f.name },
    onOk: n => { const err = checkName(n, f.id); if (err) return err; f.name = n; f.updated = Date.now(); saveLocal(); queueRemote(cur.id, f); renderTree(); renderFileTabs(); return null; }
  });
}
function deleteDlg(id) {
  const f = proj().files.find(x => x.id === id); if (!f) return;
  dialog({
    title: `Supprimer ${f.name} ?`, okLabel: 'Supprimer', danger: true,
    body: `<p>Le fichier <b>${esc(f.name)}</b> du projet ${esc(cur.proj)} sera supprimé définitivement. Pense à copier son contenu si tu en as besoin.</p>`,
    onOk: () => {
      const p = proj(); p.files = p.files.filter(x => x.id !== id); delete p.bps[id];
      const i = p.open.indexOf(id); if (i >= 0) p.open.splice(i, 1);
      if (p.cur === id) { p.cur = p.open[0] || null; loadEditorText(); }
      if (DBC || f.updated > 0) { S.tomb[docId(cur.id, id)] = Date.now(); }
      saveLocal(); renderTree(); renderFileTabs(); return null;
    }
  });
}
function resetDlg() {
  const f = curFile();
  dialog({
    title: 'Revenir au modèle de départ ?', okLabel: 'Remplacer main.c', danger: true,
    body: `<p>Le fichier <b>main.c</b> du projet ${esc(cur.proj)} sera remplacé par le modèle de départ du projet. Ton code actuel sera perdu : copie-le d'abord si tu veux le garder.</p>`,
    onOk: () => {
      const p = proj(); let m = p.files.find(x => x.name === 'main.c');
      if (!m) { m = { id: 'main', name: 'main.c', code: '', updated: 0 }; if (p.files.some(x => x.id === 'main')) m.id = 'm' + Date.now().toString(36); p.files.push(m); }
      m.code = cur.starter; m.updated = Date.now(); saveLocal(); queueRemote(cur.id, m);
      openFile(m.id); loadEditorText(); renderTree(); return null;
    }
  });
  return f;
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

/* ====================== COMPILATION ET EXÉCUTION ====================== */
let problems = [], runErr = null;
function projFiles() {
  return proj().files.slice().sort((a, b) => a.name === 'main.c' ? -1 : b.name === 'main.c' ? 1 : a.name.localeCompare(b.name)).map(f => ({ name: f.name, code: f.code, id: f.id }));
}
function doBuild() {
  const files = projFiles();
  const pn = cur.proj;
  log('build', `**** Build of configuration Debug for project ${pn} ****`, { not: true });
  let res;
  try { res = Sim.compile(files); }
  catch (e) { res = { ok: false, errors: [{ fr: 'Erreur interne du simulateur : ' + e.message, file: files[0] ? files[0].name : '', line: 0 }], warns: [] }; }
  runErr = null;
  problems = res.errors.map(e => Object.assign({ sev: 'e' }, e)).concat(res.warns.map(w => Object.assign({ sev: 'w' }, w)));
  const diag = (d, kind) => {
    const ccs = `"../${d.file}", line ${d.line}: ${kind}${d.code ? ' ' + d.code : ''}: ${d.ccs || d.fr}`;
    log(kind === 'error' ? 'err' : 'warn', ccs, { not: true, go: d.line ? { file: d.file, line: d.line } : null });
    if (d.ccs) log('fr', '→ ' + d.fr, { not: true });
  };
  const cfiles = files.filter(f => /\.c$/i.test(f.name));
  for (const f of cfiles) {
    log('build', `Building file: "../${f.name}"`, { not: true });
    log('build', 'Invoking: C2000 Compiler', { not: true });
    const errs = res.errors.filter(e => !e.link && (e.tu === f.name || (!e.tu && e.file === f.name)));
    const ws = res.warns.filter(w => w.file === f.name);
    ws.forEach(w => diag(w, 'warning')); errs.forEach(e => diag(e, 'error'));
    if (errs.length) log('err', `${errs.length} error${errs.length > 1 ? 's' : ''} detected in the compilation of "../${f.name}".`, { not: true });
    else log('build', `Finished building: "../${f.name}"`, { not: true });
  }
  const otherErrs = res.errors.filter(e => !e.link && !cfiles.some(f => e.tu === f.name || (!e.tu && e.file === f.name)));
  otherErrs.forEach(e => diag(e, 'error'));
  const compErr = res.errors.some(e => !e.link);
  if (!compErr) {
    log('build', `Building target: "${pn}.out"`, { not: true });
    log('build', 'Invoking: C2000 Linker', { not: true });
    const le = res.errors.filter(e => e.link);
    le.forEach(e => diag(e, 'error'));
    if (!le.length) log('build', `Finished building target: "${pn}.out"`, { not: true });
  }
  const ne = res.errors.length, nw = res.warns.length;
  log(ne ? 'err' : 'ok', `**** Build Finished **** ${ne} erreur${ne > 1 ? 's' : ''}, ${nw} avertissement${nw > 1 ? 's' : ''}`, { not: true });
  renderProblems(); renderEditor();
  if (ne) { showBottom('problems'); const e = problems.find(p => p.sev === 'e' && p.line); if (e) gotoLine(e.file, e.line); }
  return res.ok ? res : null;
}
const host = {
  print: s => { s.replace(/\n$/, '').split('\n').forEach(l => log('out', l)); },
  state: (s, why) => onState(s, why),
  error: (msg, line, fi) => {
    const f = prog && prog.files[fi];
    runErr = f && line ? { file: f.name, line } : null;
    log('err', (runErr ? `${f.name}, ligne ${line} : ` : '') + 'Erreur à l\'exécution : ' + msg, runErr ? { go: runErr } : {});
    problems.unshift({ sev: 'e', fr: 'Erreur à l\'exécution : ' + msg, file: runErr ? runErr.file : '', line: runErr ? runErr.line : 0, ccs: null });
    renderProblems();
    if (runErr) gotoLine(runErr.file, runErr.line);
    renderEditor();
  },
  info: (k, m) => warnOnce(k, m, 'info')
};
let progId = 0;
function load(p, halt) {
  if (M) { M.host = Object.assign({}, host, { state() {} }); M.terminate(); }
  p._id = ++progId;
  hw.reset(); warned.clear(); runErr = null; execMark = null;
  clock.base = 0; clock.at = perf();
  prog = p; progEx = cur.id; progStale = false;
  M = new Sim.Machine(p, hw, host);
  hw.clearLogs(0);
  resetModules(); scopeReset();
  M.setBreakpoints(bpSet());
  log('info', `Chargement de ${cur.proj}.out sur la cible simulée (reset du DSP : toutes les broches en entrée).`);
  selFrame = -1;
  if (halt) setPersp('debug');
  M.start(halt);
  renderExpr(true);
}
function debugCmd() { const p = doBuild(); if (p) load(p, true); }
function runNow() { const p = doBuild(); if (p) load(p, false); }
function resumeCmd() {
  if (M && M.state === 'suspended') { M.resume(); return; }
  if (!active()) runNow();
}
function suspendCmd() { if (M && M.state === 'running') M.requestPause(); }
function terminateCmd() { if (active()) { M.terminate(); } }
function stepCmd(kind) { if (M && M.state === 'suspended') M.stepCmd(kind); }
function restartCmd() { if (prog && progEx === cur.id) load(prog, true); else debugCmd(); }
let selFrame = -1;
function onState(s, why) {
  if (s === 'running') { execMark = null; renderGutter(); }
  if (s === 'suspended') {
    selFrame = M.stack.length - 1;
    const label = { bp: 'point d\'arrêt', step: M._halting ? 'début de main()' : 'pas à pas', user: 'suspendu', estop: 'ESTOP0' }[why] || 'suspendu';
    stateWhy = why === 'step' && firstHalt ? 'début de main()' : label;
    firstHalt = false;
    showFrame();
    if (persp === 'debug' && bottomTab !== 'vars' && bottomTab !== 'expr' && bottomTab !== 'regs' && bottomTab !== 'scope') showBottom('vars');
    renderVars(true); renderExpr(true);
  }
  if (s === 'finished') {
    freezeClock(); execMark = null; renderGutter();
    log('ok', `main() s'est terminée après ${fr((M.vt / 1e6).toFixed(3))} s. Sur le DSP, main() tourne normalement sans fin dans une boucle while(1) : ici les broches restent dans leur dernier état.`);
    if (hw.eallow) log('warn', 'EALLOW est encore actif à la fin : il manque un EDIS quelque part.');
  }
  if (s === 'terminated') { freezeClock(); execMark = null; renderGutter(); log('info', 'Exécution arrêtée (Terminate). La carte garde l\'état de ses broches.'); }
  if (s === 'error') { freezeClock(); execMark = null; }
  if (s === 'running') stateWhy = '';
  updateToolbar(); updateStatus(); renderDebug();
  if (s !== 'running') { varsSig = ''; renderVars(true); exprSig = ''; renderExpr(true); }
}
let stateWhy = '', firstHalt = false;
const _start = Sim.Machine.prototype.start;
Sim.Machine.prototype.start = function (h) { firstHalt = !!h; return _start.call(this, h); };
function showFrame() {
  if (!M || !prog) return;
  const fr2 = selFrame >= 0 ? M.stack[selFrame] : M.top;
  if (!fr2) return;
  const f = prog.files[fr2.file];
  if (!f || !fr2.line) return;
  execMark = { file: f.name, line: fr2.line, top: selFrame === M.stack.length - 1 };
  const pf = proj().files.find(x => x.name === f.name);
  if (pf) { if (proj().cur !== pf.id) openFile(pf.id, true); else renderGutter(); scrollToLine(fr2.line); }
  renderDebug(); renderVars(true); renderExpr(true);
}
function toggleBp(line) {
  const f = curFile(); if (!f) return;
  const p = proj(); const arr = p.bps[f.id] || (p.bps[f.id] = []); const i = arr.indexOf(line);
  if (i >= 0) arr.splice(i, 1); else arr.push(line);
  saveLocal(); renderGutter();
  if (M && progEx === cur.id) M.setBreakpoints(bpSet());
}
function bpSet() {
  const set = new Set(); if (!prog) return set;
  const p = S.projects[progEx];
  prog.files.forEach((pf, fi) => { const f = p.files.find(x => x.id === pf.id) || p.files.find(x => x.name === pf.name); if (f) (p.bps[f.id] || []).forEach(l => set.add(fi * 100000 + l)); });
  return set;
}
function clearBps() { proj().bps = {}; saveLocal(); renderGutter(); if (M && progEx === cur.id) M.setBreakpoints(bpSet()); toast('Tous les points d\'arrêt sont supprimés'); }

/* ---------- barre d'outils ---------- */
function updateToolbar() {
  const st = M ? M.state : 'none';
  const mine = progEx === cur.id;
  $('tb-resume').disabled = st === 'running';
  $('tb-suspend').disabled = st !== 'running';
  $('tb-term').disabled = !(st === 'running' || st === 'suspended');
  ['tb-into', 'tb-over', 'tb-ret'].forEach(id => $(id).disabled = st !== 'suspended');
  $('tb-restart').disabled = !prog || !mine;
  $('tb-resume').title = st === 'suspended' ? 'Reprendre (F8)' : 'Compiler, charger et lancer sans s\'arrêter (F8 ou Ctrl+Entrée)';
}
let persp = S.ui.persp === 'debug' ? 'debug' : 'edit';
function setPersp(p) {
  persp = p; S.ui.persp = p; saveLocal();
  $('pp-edit').setAttribute('aria-pressed', String(p === 'edit')); $('pp-debug').setAttribute('aria-pressed', String(p === 'debug'));
  setDebugOpen(p === 'debug');
}
function setDebugOpen(o) { $('v-debug').classList.toggle('open', o); $('dbg-tog').setAttribute('aria-expanded', String(o)); $('dbg-tog').textContent = o ? '▾' : '▸'; }

/* ====================== VUES DU BAS ====================== */
let bottomTab = S.ui.btab || 'console';
function showBottom(v) {
  bottomTab = v; S.ui.btab = v; saveLocal();
  document.querySelectorAll('.btab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === v)));
  ['console', 'problems', 'vars', 'expr', 'regs', 'scope', 'adc'].forEach(k => { $('bp-' + k).hidden = k !== v; });
  $('btools').innerHTML = '';
  if (v === 'console') { $('btools').innerHTML = '<button class="btn" id="clrcons">Effacer</button>'; $('clrcons').addEventListener('click', () => { cons().innerHTML = ''; }); }
  if (v === 'vars' || v === 'expr') { $('btools').innerHTML = `<label class="hint" for="fmtsel">Format</label><select class="sm" id="fmtsel"><option value="dec">Décimal</option><option value="hex">Hexadécimal</option><option value="bin">Binaire</option></select>`; $('fmtsel').value = fmt; $('fmtsel').addEventListener('change', e => { fmt = e.target.value; S.ui.fmt = fmt; saveLocal(); renderVars(true); renderExpr(true); }); }
  if (v === 'vars') renderVars(true);
  if (v === 'expr') renderExpr(true);
  if (v === 'regs') renderRegs(true);
  if (v === 'scope') drawScope();
  if (v === 'adc') { adcSig = ''; renderAdc(true); }
}
document.querySelectorAll('.btab').forEach(b => b.addEventListener('click', () => showBottom(b.dataset.v)));
let fmt = S.ui.fmt || 'dec';

/* problèmes */
function renderProblems() {
  const ne = problems.filter(p => p.sev === 'e').length, nw = problems.length - ne;
  $('cnt-pb').textContent = String(problems.length); $('cnt-pb').className = 'cnt' + (ne ? ' e' : '');
  if (!problems.length) { $('bp-problems').innerHTML = '<p class="pad hint">Aucun problème. Compile avec Build (Ctrl+B) pour vérifier ton code.</p>'; return; }
  $('bp-problems').innerHTML = `<table class="grid"><thead><tr><th>Description (${ne} erreur${ne > 1 ? 's' : ''}, ${nw} avertissement${nw > 1 ? 's' : ''})</th><th>Ressource</th><th>Ligne</th></tr></thead><tbody>${problems.map((p, i) => `<tr class="click" data-i="${i}" tabindex="0"><td><span class="sev ${p.sev}">${p.sev === 'e' ? '✕ Erreur' : '▲ Avertissement'}</span> ${esc(p.fr)}${p.ccs ? `<span class="ccs">${p.sev === 'e' ? 'error' : 'warning'}${p.code ? ' ' + esc(p.code) : ''}: ${esc(p.ccs)}</span>` : ''}</td><td class="mono">${esc(p.file || '')}</td><td class="mono">${p.line || ''}</td></tr>`).join('')}</tbody></table>`;
  $('bp-problems').querySelectorAll('tr.click').forEach(r => { const go = () => { const p = problems[+r.dataset.i]; if (p && p.line) gotoLine(p.file, p.line); }; r.addEventListener('click', go); r.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
}

/* variables */
const expandedVars = new Set();
function valCell(v, t) {
  if (Array.isArray(v)) return null;
  if (v === undefined) return '—';
  return Sim.fmtVal(v, t, fmt);
}
function arrPreview(a, t) {
  const el = []; const base = t.elem;
  for (let i = 0; i < Math.min(a.length, 8); i++) el.push(Array.isArray(a[i]) ? '{…}' : Sim.fmtVal(a[i], base, fmt));
  return `{${el.join(', ')}${a.length > 8 ? ', …' : ''}}`;
}
function varRows(name, v, t, key, depth) {
  let h = '';
  const pad = `style="padding-left:${8 + depth * 14}px"`;
  if (Array.isArray(v)) {
    const open = expandedVars.has(key);
    h += `<tr class="click" data-k="${esc(key)}"><td ${pad}>${open ? '▾' : '▸'} ${esc(name)}</td><td class="mono">${esc(Sim.typeStr(t))}</td><td class="mono val">${esc(arrPreview(v, t))}</td></tr>`;
    if (open) for (let i = 0; i < Math.min(v.length, 256); i++) h += varRows(`[${i}]`, v[i], t.elem, key + '[' + i + ']', depth + 1);
    return h;
  }
  return h + `<tr><td ${pad}>${esc(name)}</td><td class="mono">${esc(Sim.typeStr(t))}</td><td class="mono val">${esc(valCell(v, t))}</td></tr>`;
}
let varsSig = '';
function renderVars(force) {
  if (bottomTab !== 'vars' && !force) return;
  const pane = $('bp-vars');
  if (!M || !prog || progEx !== cur.id) { pane.innerHTML = '<p class="pad hint">Lance Debug (F11) : les variables du programme s\'affichent ici. Quand le programme est suspendu, tu vois aussi les variables locales de la fonction en cours.</p>'; varsSig = ''; return; }
  let h = '<table class="grid"><thead><tr><th>Nom</th><th>Type</th><th>Valeur</th></tr></thead><tbody>';
  if (M.state === 'suspended') {
    const frm = M.stack[selFrame >= 0 ? selFrame : M.stack.length - 1];
    if (frm) {
      const meta = prog.funcs[frm.fid];
      h += `<tr class="sect"><td colspan="3">Locales de ${esc(meta.name)}()</td></tr>`;
      if (!meta.locals.length) h += '<tr><td colspan="3" class="muted">aucune variable locale</td></tr>';
      for (const l of meta.locals) h += varRows(l.name + (l.param ? ' (paramètre)' : l.static ? ' (static)' : ''), l.g ? M.G[l.key] : frm.L[l.key], l.t, 'L' + frm.fid + ':' + l.key, 0);
    }
  } else h += '<tr class="sect"><td colspan="3">Programme en cours : les locales apparaissent quand il est suspendu</td></tr>';
  h += `<tr class="sect"><td colspan="3">Globales</td></tr>`;
  if (!prog.globals.length) h += '<tr><td colspan="3" class="muted">aucune variable globale</td></tr>';
  for (const g of prog.globals) h += varRows(g.name, M.G[g.key], g.t, 'G:' + g.key, 0);
  h += '</tbody></table>';
  if (h === varsSig) return; varsSig = h;
  const st = pane.scrollTop; pane.innerHTML = h; pane.scrollTop = st;
  pane.querySelectorAll('tr[data-k]').forEach(r => r.addEventListener('click', () => { const k = r.dataset.k; if (expandedVars.has(k)) expandedVars.delete(k); else expandedVars.add(k); varsSig = ''; renderVars(true); }));
}

/* expressions */
const watchCache = new Map();
function evalWatch(text) {
  if (!M || !prog || progEx !== cur.id) return { s: '—' };
  const frm = M.state === 'suspended' ? M.stack[selFrame >= 0 ? selFrame : M.stack.length - 1] : null;
  const fid = frm ? frm.fid : -1;
  const key = text + '|' + fid + '|' + prog._id;
  let w = watchCache.get(key);
  if (!w) {
    try {
      const locs = new Map();
      if (frm) for (const l of prog.funcs[fid].locals) locs.set(l.name, { c: l.g ? `G.${l.key}` : `L.${l.key}`, t: l.t, name: l.name });
      const r = prog.gen.watch(text, locs, prog.visAll);
      w = { fn: new Function('G', 'L', 'R', 'const {__rr,__rra,__gr,__ck,__div,__mod,__w64,__b64}=R;' + r.code), t: r.t };
    } catch (e) { w = { err: e.fr || e.message }; }
    watchCache.set(key, w);
  }
  if (w.err) return { s: w.err, err: true };
  const saveW = hw.warn; hw.warn = () => {};
  try { const v = w.fn(M.G, frm ? frm.L : {}, M.R); return { s: Array.isArray(v) ? arrPreview(v, w.t) : Sim.fmtVal(v, w.t, fmt), t: Sim.typeStr(w.t) }; }
  catch (e) { return { s: e.fr || e.message, err: true }; }
  finally { hw.warn = saveW; }
}
let exprSig = '';
function renderExpr(force) {
  if (bottomTab !== 'expr' && !force) return;
  const pane = $('bp-expr'); const list = proj().expr;
  let rows = list.map((x, i) => { const r = evalWatch(x); return `<tr><td class="mono">${esc(x)}</td><td class="mono">${esc(r.t || '')}</td><td class="mono val"${r.err ? ' style="color:var(--err);white-space:normal"' : ''}>${esc(r.s)}</td><td><button class="rmx" data-rm="${i}" aria-label="Retirer ${esc(x)}" title="Retirer">×</button></td></tr>`; }).join('');
  if (!list.length) rows = '<tr><td colspan="4" class="muted">Ajoute une variable ou une expression (ex. FD, tab[3], GpioDataRegs.GPADAT.bit.GPIO17).</td></tr>';
  const sig = rows;
  if (sig === exprSig && pane.querySelector('#exin')) return; exprSig = sig;
  if (!pane.querySelector('#exin')) {
    pane.innerHTML = `<table class="grid"><thead><tr><th>Expression</th><th>Type</th><th>Valeur</th><th></th></tr></thead><tbody id="exrows"></tbody></table><form class="addexpr" id="exform"><input id="exin" placeholder="Nouvelle expression…" spellcheck="false" autocomplete="off" aria-label="Nouvelle expression"><button class="btn" type="submit">Ajouter</button></form>`;
    $('exform').addEventListener('submit', e => { e.preventDefault(); const v = $('exin').value.trim(); if (!v) return; proj().expr.push(v); $('exin').value = ''; saveLocal(); exprSig = ''; renderExpr(true); });
  }
  $('exrows').innerHTML = rows;
  $('exrows').querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { proj().expr.splice(+b.dataset.rm, 1); saveLocal(); exprSig = ''; renderExpr(true); }));
}

/* registres */
let regsSig = '';
function renderRegs(force) {
  if (bottomTab !== 'regs' && !force) return;
  const R = n => Sim.REGIDX[n];
  const cell = (txt, st) => `<span class="v${st === 'good' ? ' good' : st === 'bad' ? ' bad' : ''}">${txt}</span>`;
  let h = `<table class="grid"><thead><tr><th>Composant</th><th>Broche</th><th>MUX</th><th>DIR</th><th>PUD</th><th>Niveau</th></tr></thead><tbody>`;
  for (const c of cur.comps) {
    const n = c.pin, P = Sim.portOf(n); const isOut = c.role === 'out';
    const mux = hw.mux[n], dir = hw.dir[n], pud = hw.pud[n]; const lv = hw.level(n);
    const pudSt = c.pu ? (pud === 0 ? 'good' : 'bad') : (pud === 1 ? 'good' : '');
    h += `<tr><td>${esc(c.name)}</td><td class="mono">GPIO${n} · port ${P}</td><td>${cell(mux === 0 ? '0 · GPIO' : mux + ' · périph.', mux === 0 ? 'good' : 'bad')}</td><td>${cell(dir ? '1 · sortie' : '0 · entrée', isOut ? (dir ? 'good' : 'bad') : (dir ? 'bad' : 'good'))}</td><td>${cell(pud ? '1 · désactivée' : '0 · activée', pudSt)}</td><td class="mono">${lv === 2 ? cell('en l\'air', 'bad') : lv}</td></tr>`;
  }
  h += `</tbody></table><p class="pad hint" style="padding-bottom:2px">Vert : réglage attendu pour le projet. Rouge : réglage qui empêche le montage de fonctionner. EALLOW : <b>${hw.eallow ? 'déverrouillé' : 'verrouillé'}</b></p>`;
  const used = new Set(cur.comps.map(c => c.pin));
  const ports = new Set(cur.comps.map(c => Sim.portOf(c.pin)));
  h += `<table class="grid"><thead><tr><th>Registre</th><th>Valeur</th><th>Bits (repère en couleur : broches du projet)</th></tr></thead><tbody>`;
  for (const P of ['A', 'B']) {
    if (!ports.has(P)) continue;
    for (const k of ['MUX1', 'MUX2', 'DIR', 'PUD', 'DAT']) {
      const r = R(`GP${P}${k}`); const saveW = hw.warn; hw.warn = () => {};
      const v = hw.rra(r.id); hw.warn = saveW;
      let bits = '';
      if (r.w === 1) { for (let b = 31; b >= 0; b--) { const n = r.lo + b; const bit = (v >>> b) & 1; bits += used.has(n) ? `<b title="GPIO${n}">${bit}</b>` : bit; if (b % 4 === 0 && b) bits += ' '; } }
      else { for (let b = 15; b >= 0; b--) { const n = r.lo + b; const f = Math.floor(v / Math.pow(4, b)) & 3; bits += used.has(n) ? `<b title="GPIO${n}">${f}</b>` : f; if (b % 4 === 0 && b) bits += ' '; } bits += ' <span class="muted">(2 bits par broche)</span>'; }
      h += `<tr><td class="mono">${r.name}</td><td class="mono">0x${v.toString(16).toUpperCase().padStart(8, '0')}</td><td class="bits">${bits}</td></tr>`;
    }
  }
  h += '</tbody></table>';
  if (h === regsSig) return; regsSig = h; $('bp-regs').innerHTML = h;
}

/* pile d'appels */
function renderDebug() {
  const el = $('stack');
  const st = M ? M.state : null;
  const label = { running: 'En cours', suspended: 'Suspendu' + (stateWhy ? ' (' + stateWhy + ')' : ''), finished: 'Terminé', terminated: 'Arrêté', error: 'Erreur', loaded: 'Chargé' }[st] || 'Déconnecté';
  let h = `<li class="tgt">${IC.chip} TMS320F28335 (simulé) — ${esc(label)}</li>`;
  if (M && st === 'suspended' && prog) {
    for (let i = M.stack.length - 1; i >= 0; i--) {
      const f = M.stack[i]; const meta = prog.funcs[f.fid]; const file = prog.files[f.file];
      h += `<li class="frame${i === selFrame ? ' sel' : ''}" data-i="${i}" tabindex="0">${esc(meta.name)}() at ${esc(file ? file.name : '?')}:${f.line}</li>`;
    }
  } else if (M && st === 'running') h += '<li class="tgt">La pile d\'appels s\'affiche quand le programme est suspendu.</li>';
  el.innerHTML = h;
  el.querySelectorAll('.frame').forEach(li => { const go = () => { selFrame = +li.dataset.i; showFrame(); }; li.addEventListener('click', go); li.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
}

/* ====================== ANALYSEUR LOGIQUE ====================== */
const TBS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
const fmtT = us => { const a = Math.abs(us); if (a >= 1e6) return fr(+(us / 1e6).toFixed(3)) + ' s'; if (a >= 1000) return fr(+(us / 1000).toFixed(3)) + ' ms'; return fr(+us.toFixed(a < 10 ? 2 : 1)) + ' µs'; };
const sc = { tb: 200000, mode: 'roll', trig: null, edge: 'up', frozen: null, trigT: null, cursorA: null, hoverX: null };
function scopeConfig() {
  const c = cur.scope;
  sc.tb = c.tb; sc.mode = c.mode; sc.trig = c.trig !== undefined ? c.trig : c.sigs[0][0]; sc.edge = c.edge || 'up';
  sc.frozen = null; sc.trigT = null; sc.cursorA = null;
  $('sc-tb').innerHTML = TBS.map(v => `<option value="${v}">${fmtT(v)} / div</option>`).join('');
  $('sc-tb').value = String(sc.tb);
  $('sc-mode').value = sc.mode;
  $('sc-trig').innerHTML = c.sigs.map(([n, l]) => `<option value="${n}">${esc(l)}${l.startsWith('GPIO') ? '' : ' (GPIO' + n + ')'}</option>`).join('');
  $('sc-trig').value = String(sc.trig); $('sc-edge').value = sc.edge;
  syncScopeBar();
}
function syncScopeBar() {
  const trig = sc.mode === 'trig';
  $('sc-trig').disabled = !trig; $('sc-edge').disabled = !trig;
  $('sc-freeze').textContent = sc.frozen !== null ? 'Reprendre' : 'Figer';
  $('sc-freeze').setAttribute('aria-pressed', String(sc.frozen !== null));
}
function scopeReset() { sc.trigT = null; sc.frozen = null; sc.cursorA = null; syncScopeBar(); }
$('sc-tb').addEventListener('change', e => { sc.tb = +e.target.value; sc.trigT = null; });
$('sc-mode').addEventListener('change', e => { sc.mode = e.target.value; sc.trigT = null; syncScopeBar(); });
$('sc-trig').addEventListener('change', e => { sc.trig = +e.target.value; sc.trigT = null; });
$('sc-edge').addEventListener('change', e => { sc.edge = e.target.value; sc.trigT = null; });
$('sc-freeze').addEventListener('click', () => { sc.frozen = sc.frozen === null ? now() : null; syncScopeBar(); });
$('sc-clear').addEventListener('click', () => { sc.cursorA = null; });
function bsearch(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
function valueAt(n, t) { const L = hw.logs[n]; const i = bsearch(L.t, t); return i < 0 ? (L.v.length ? L.v[0] : 2) : L.v[i]; }
function findTrigger(after) {
  const L = hw.logs[sc.trig]; if (!L) return null;
  let i = bsearch(L.t, after) + 1; if (i < 1) i = 1;
  for (; i < L.t.length; i++) { const v = L.v[i], p = L.v[i - 1]; if (sc.edge === 'up' ? (v === 1 && p !== 1) : (v === 0 && p !== 0)) return L.t[i]; }
  return null;
}
function scopeWindow() {
  const span = sc.tb * 10; const tnow = sc.frozen !== null ? sc.frozen : now();
  if (sc.mode === 'trig') {
    if (sc.trigT === null || (tnow >= sc.trigT + span * 0.9)) { const t = findTrigger(sc.trigT === null ? -1 : sc.trigT + span * 0.9); if (t !== null && t <= tnow) sc.trigT = t; }
    if (sc.trigT !== null) return { t0: sc.trigT - sc.tb, t1: sc.trigT + 9 * sc.tb, tnow, rel: sc.trigT };
    return { t0: tnow - span, t1: tnow, tnow, rel: tnow, waiting: true };
  }
  return { t0: tnow - span, t1: tnow, tnow, rel: tnow };
}
const cv = $('scope'); const cx = cv.getContext('2d');
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); sc.hoverX = e.clientX - r.left; });
cv.addEventListener('mouseleave', () => { sc.hoverX = null; });
cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left; const w = lastWin; if (!w) return; const L = 96, W = r.width - L - 10; if (x < L) return; sc.cursorA = w.t0 + (x - L) / W * (w.t1 - w.t0); });
let lastWin = null;
function drawScope() {
  if (bottomTab !== 'scope') return;
  const sigs = cur.scope.sigs;
  const rowH = 26, top = 18, bot = 22;
  const wrap = cv.parentElement; const W = Math.max(280, wrap.clientWidth - 16); const H = top + sigs.length * rowH + bot;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement); const col = k => cs.getPropertyValue(k).trim();
  cx.fillStyle = col('--scope-bg'); cx.fillRect(0, 0, W, H);
  const w = scopeWindow(); lastWin = w;
  const L = 96, PW = W - L - 10; const X = t => L + (t - w.t0) / (w.t1 - w.t0) * PW;
  cx.font = '11px Consolas, "DejaVu Sans Mono", monospace'; cx.textBaseline = 'middle';
  cx.strokeStyle = col('--scope-grid'); cx.lineWidth = 1;
  for (let d = 0; d <= 10; d++) {
    const x = Math.round(L + PW * d / 10) + .5; cx.beginPath(); cx.moveTo(x, top - 6); cx.lineTo(x, H - bot + 2); cx.stroke();
    if (d % 2 === 0 || PW > 560) { cx.fillStyle = col('--scope-ink'); cx.textAlign = 'center'; const t = w.t0 + (w.t1 - w.t0) * d / 10 - w.rel; cx.fillText(Math.abs(t) < 1e-6 ? '0' : fmtT(t), x, H - 9); }
  }
  if (sc.mode === 'trig' && !w.waiting) { const x = Math.round(X(w.rel)) + .5; cx.strokeStyle = col('--scope-z'); cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(x, top - 8); cx.lineTo(x, H - bot); cx.stroke(); cx.setLineDash([]); cx.fillStyle = col('--scope-z'); cx.textAlign = 'center'; cx.fillText('T', x, 7); }
  sigs.forEach(([n, label], i) => {
    const y0 = top + i * rowH, hi = y0 + 4, lo = y0 + rowH - 6, mid = (hi + lo) / 2;
    cx.fillStyle = col('--scope-ink'); cx.textAlign = 'left'; cx.fillText(label.length > 12 ? label.slice(0, 12) : label, 6, mid);
    const Lg = hw.logs[n];
    let v = valueAt(n, w.t0); let px = L;
    const color = i % 2 ? col('--scope-b') : col('--scope-a');
    const seg = (x0, x1, val) => {
      if (x1 <= x0) return;
      if (val === 2) { cx.strokeStyle = col('--scope-z'); cx.setLineDash([2, 3]); cx.beginPath(); cx.moveTo(x0, mid); cx.lineTo(x1, mid); cx.stroke(); cx.setLineDash([]); return; }
      cx.strokeStyle = color; cx.beginPath(); cx.moveTo(x0, val ? hi : lo); cx.lineTo(x1, val ? hi : lo); cx.stroke();
    };
    cx.lineWidth = 1.6;
    let k = bsearch(Lg.t, w.t0) + 1;
    const tEnd = Math.min(w.t1, w.tnow);
    for (; k < Lg.t.length && Lg.t[k] <= tEnd; k++) {
      const x = Math.max(L, X(Lg.t[k])); seg(px, x, v);
      const nv = Lg.v[k];
      if (nv !== v) { cx.strokeStyle = color; cx.beginPath(); cx.moveTo(x, v === 2 ? mid : v ? hi : lo); cx.lineTo(x, nv === 2 ? mid : nv ? hi : lo); cx.stroke(); }
      v = nv; px = x;
    }
    seg(px, X(tEnd), v);
    cx.strokeStyle = col('--scope-grid'); cx.lineWidth = 1; cx.beginPath(); cx.moveTo(L, y0 + rowH - .5); cx.lineTo(L + PW, y0 + rowH - .5); cx.stroke();
  });
  const cur2 = col('--scope-cur');
  if (sc.cursorA !== null && sc.cursorA >= w.t0 && sc.cursorA <= w.t1) { const x = Math.round(X(sc.cursorA)) + .5; cx.strokeStyle = col('--scope-z'); cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x, top - 6); cx.lineTo(x, H - bot); cx.stroke(); cx.fillStyle = col('--scope-z'); cx.textAlign = 'center'; cx.fillText('A', x, 7); }
  let rd = sc.mode === 'trig' && w.waiting ? 'En attente du front de déclenchement…' : '';
  if (sc.hoverX !== null && sc.hoverX >= L && sc.hoverX <= L + PW) {
    const t = w.t0 + (sc.hoverX - L) / PW * (w.t1 - w.t0);
    cx.strokeStyle = cur2; cx.globalAlpha = .55; cx.beginPath(); cx.moveTo(Math.round(sc.hoverX) + .5, top - 6); cx.lineTo(Math.round(sc.hoverX) + .5, H - bot); cx.stroke(); cx.globalAlpha = 1;
    rd = `t = ${fmtT(t - w.rel)}` + (sc.cursorA !== null ? ` · Δt depuis A = ${fmtT(t - sc.cursorA)}` : ' · clic : poser le repère A') + ' · ' + sigs.map(([n, l]) => `${l}=${t <= w.tnow ? ({ 0: '0', 1: '1', 2: 'Z' })[valueAt(n, t)] : '·'}`).join(' ');
  }
  $('sc-rd').textContent = rd;
}

/* ====================== CARTE (SVG) ====================== */
function boardSVG() {
  const silk = '#F2F5F2';
  const pins = (x, y, cols, rows, s = 7) => { let h = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) h += `<rect x="${x + c * s}" y="${y + r * s}" width="${s - 2.4}" height="${s - 2.4}" fill="#D6B25E" stroke="#8C6E2A" stroke-width=".5"/>`; return h; };
  const chipPins = (x, y, w, h, n) => { let s = ''; for (let i = 0; i < n; i++) { const t = x + 4 + i * (w - 8) / (n - 1); s += `<line x1="${t}" y1="${y - 3}" x2="${t}" y2="${y}" stroke="#B9BFC4" stroke-width="1"/><line x1="${t}" y1="${y + h}" x2="${t}" y2="${y + h + 3}" stroke="#B9BFC4" stroke-width="1"/>`; } for (let i = 0; i < n; i++) { const t = y + 4 + i * (h - 8) / (n - 1); s += `<line x1="${x - 3}" y1="${t}" x2="${x}" y2="${t}" stroke="#B9BFC4" stroke-width="1"/><line x1="${x + w}" y1="${t}" x2="${x + w + 3}" y2="${t}" stroke="#B9BFC4" stroke-width="1"/>`; } return s; };
  const lbl = (x, y, t, a = 'middle', size = 12, w = 700) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${size}" font-weight="${w}" fill="${silk}" font-family="Arial, Helvetica, sans-serif">${t}</text>`;
  const sm = (x, y, t, a = 'middle') => lbl(x, y, t, a, 8.5, 400);
  const gp = (x, y, t) => `<text class="gp" x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="#BFE6CF" font-family="Consolas, monospace">${t}</text>`;
  const led = (id, x, n) => `<g id="c-${id}" data-comp="${id}"><rect class="ring" x="${x - 21}" y="160" width="42" height="84" rx="5" fill="none"/>
    <circle class="glow" cx="${x}" cy="186" r="22" fill="url(#ledglow)" opacity="0"/>
    <rect x="${x - 8}" y="174" width="16" height="24" rx="2" fill="#E9E3D6" stroke="#B5AE9E" stroke-width=".7"/>
    <rect class="lamp" x="${x - 5.5}" y="178" width="11" height="16" rx="1.2" fill="#6E1C15"/>
    ${lbl(x, 218, id)}${gp(x, 232, 'GPIO' + n)}</g>`;
  const pb = (id, x, n) => `<g id="c-${id}" class="ia" data-comp="${id}" tabindex="0" role="button" aria-label="Bouton ${id} (GPIO${n}) : maintiens pour appuyer" aria-pressed="false"><rect class="ring" x="${x - 33}" y="152" width="66" height="94" rx="6" fill="none"/>
    <rect class="focusring" x="${x - 30}" y="155" width="60" height="60" rx="6" fill="none" stroke="none"/>
    <rect x="${x - 26}" y="159" width="52" height="52" rx="4" fill="#30353A" stroke="#1C1F22"/>
    <rect x="${x - 30}" y="163" width="5" height="6" fill="#C9CED3"/><rect x="${x + 25}" y="163" width="5" height="6" fill="#C9CED3"/><rect x="${x - 30}" y="201" width="5" height="6" fill="#C9CED3"/><rect x="${x + 25}" y="201" width="5" height="6" fill="#C9CED3"/>
    <circle cx="${x}" cy="185" r="17.5" fill="#15181A"/><circle class="cap" cx="${x}" cy="184" r="14.5" fill="#2A2E31" stroke="#45494D" stroke-width="1.2"/>
    ${lbl(x, 228, id)}${gp(x, 242, 'GPIO' + n)}</g>`;
  const HX = 92, HY = 192;
  let hexDigits = ''; for (let i = 0; i < 16; i++) { const a = (-90 + i * 22.5) * Math.PI / 180; hexDigits += `<text x="${(HX + 31 * Math.cos(a)).toFixed(1)}" y="${(HY + 31 * Math.sin(a) + 3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#FFFFFF" font-family="Arial">${i.toString(16).toUpperCase()}</text>`; }
  return `<svg class="board" id="boardsvg" viewBox="0 0 600 404" role="group" aria-label="Carte simulée : controlCARD TMS320F28335 sur sa carte d'expérimentation">
  <defs>
    <radialGradient id="ledglow"><stop offset="0" stop-color="#FF5A3C" stop-opacity=".95"/><stop offset=".45" stop-color="#FF3B22" stop-opacity=".45"/><stop offset="1" stop-color="#FF3B22" stop-opacity="0"/></radialGradient>
    <radialGradient id="pwrglow"><stop offset="0" stop-color="#6CFF7A" stop-opacity=".9"/><stop offset="1" stop-color="#6CFF7A" stop-opacity="0"/></radialGradient>
    <pattern id="traces" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 12h9l4-4h11M12 24v-7l3-3" fill="none" stroke="#1D6743" stroke-width="1.4"/></pattern>
  </defs>
  <rect x="3" y="3" width="594" height="398" rx="12" fill="#17573A" stroke="#0D3A25" stroke-width="3"/>
  <rect x="3" y="3" width="594" height="398" rx="12" fill="url(#traces)" opacity=".5"/>
  ${[[20, 20], [580, 20], [20, 384], [580, 384]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#D9BC6A"/><circle cx="${x}" cy="${y}" r="4.5" fill="#0B2117"/>`).join('')}
  <rect x="104" y="10" width="392" height="18" rx="2" fill="#26292C"/>
  <rect x="96" y="6" width="11" height="26" rx="2" fill="#E3E6E9"/><rect x="493" y="6" width="11" height="26" rx="2" fill="#E3E6E9"/>
  <rect x="118" y="20" width="364" height="106" rx="4" fill="#1F4F7A" stroke="#123352" stroke-width="1.5"/>
  ${Array.from({ length: 44 }, (_, i) => `<rect x="${122 + i * 8.2}" y="21" width="5" height="8" fill="#D9B25A"/>`).join('')}
  <rect x="264" y="38" width="72" height="72" rx="3" fill="#1A1C1E"/>${chipPins(264, 38, 72, 72, 16)}
  <circle cx="272" cy="46" r="2.6" fill="#2E3236"/>
  <text x="300" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="#AEB6BD" font-family="Arial">TMS320</text>
  <text x="300" y="83" text-anchor="middle" font-size="10" font-weight="700" fill="#AEB6BD" font-family="Arial">F28335</text>
  <text x="300" y="96" text-anchor="middle" font-size="7" fill="#7F8890" font-family="Arial">LQFP 176</text>
  <rect x="368" y="48" width="30" height="13" rx="6.5" fill="#CDD2D6" stroke="#8E959B"/>
  <rect x="148" y="52" width="24" height="13" fill="#1A1C1E"/><rect x="148" y="80" width="24" height="13" fill="#1A1C1E"/><rect x="416" y="78" width="32" height="20" fill="#1A1C1E"/>
  ${lbl(300, 121, 'controlCARD · F28335', 'middle', 9, 700)}
  ${sm(126, 41, 'J1 · DIMM100', 'start')}
  <rect x="3" y="44" width="36" height="28" rx="2" fill="#C5CACF" stroke="#7E858C"/><rect x="11" y="52" width="22" height="12" rx="1" fill="#2B2F33"/>
  ${sm(46, 55, 'JP1 USB', 'start')}${sm(46, 66, 'XDS100', 'start')}
  ${pins(46, 76, 7, 2)}${sm(46, 99, 'JTAG', 'start')}
  <rect x="3" y="112" width="40" height="30" rx="3" fill="#202326"/><circle cx="21" cy="127" r="7.5" fill="#0E0F10" stroke="#3A3E42"/>
  ${sm(23, 152, '+5 V')}
  <rect x="52" y="118" width="26" height="15" rx="2" fill="#EAEAEA" stroke="#9AA0A6"/><rect x="54" y="120" width="11" height="11" rx="1" fill="#2B2F33"/>
  ${sm(65, 145, 'SW1')}
  <circle cx="92" cy="126" r="9" fill="url(#pwrglow)"/><rect x="89" y="122" width="6" height="8" rx="1" fill="#7CFF8A"/>
  ${sm(92, 145, 'PWR')}
  <g id="c-SW2" class="ia" data-comp="SW2" tabindex="0" role="spinbutton" aria-label="Roue codeuse SW2 (GPIO12 à GPIO15)" aria-valuemin="0" aria-valuemax="15" aria-valuenow="0">
    <rect class="ring" x="${HX - 46}" y="${HY - 46}" width="92" height="132" rx="6" fill="none"/>
    <rect class="focusring" x="${HX - 42}" y="${HY - 42}" width="84" height="84" rx="8" fill="none" stroke="none"/>
    <rect x="${HX - 38}" y="${HY - 38}" width="76" height="76" rx="6" fill="#2C66C2" stroke="#1D4B91"/>
    ${hexDigits}
    <circle cx="${HX}" cy="${HY}" r="20" fill="#F3F4F6" stroke="#B9BEC5"/>
    <g id="hexrot"><rect x="${HX - 2}" y="${HY - 16}" width="4" height="22" rx="1.4" fill="#2C66C2"/><path d="M${HX} ${HY - 19}l-5 7h10z" fill="#2C66C2"/></g>
    <circle cx="${HX}" cy="${HY}" r="3" fill="#2C66C2"/>
    ${lbl(HX, HY + 54, 'SW2 · roue')}${gp(HX, HY + 68, 'GPIO12–15')}
  </g>
  <g id="hexdn" class="ia" role="button" aria-label="Roue codeuse : valeur précédente"><circle cx="${HX - 32}" cy="${HY + 82}" r="8.5" fill="#0F3F29" stroke="#BFE6CF"/><path d="M${HX - 29} ${HY + 78}l-6 4 6 4z" fill="#F2F5F2"/></g>
  <g id="hexup" class="ia" role="button" aria-label="Roue codeuse : valeur suivante"><circle cx="${HX + 32}" cy="${HY + 82}" r="8.5" fill="#0F3F29" stroke="#BFE6CF"/><path d="M${HX + 29} ${HY + 78}l6 4-6 4z" fill="#F2F5F2"/></g>
  <text id="hexval" x="${HX}" y="${HY + 86}" text-anchor="middle" font-size="11" font-weight="700" fill="#FFD54A" font-family="Consolas, monospace">0</text>
  ${pb('PB1', 186, 17)}${pb('PB2', 262, 48)}
  <rect x="312" y="170" width="24" height="16" rx="1" fill="#1A1C1E"/>${sm(324, 165, 'U6')}
  <rect x="312" y="194" width="10" height="5" fill="#2B2B2B"/><rect x="326" y="194" width="10" height="5" fill="#2B2B2B"/>
  ${led('LD1', 370, 9)}${led('LD2', 414, 11)}${led('LD3', 458, 34)}${led('LD4', 502, 49)}
  ${sm(436, 256, 'LEDS')}
  ${[['VR1', 'ADC-A0', 150], ['VR2', 'ADC-A1', 206]].map(([n, a, y], i) => `<g class="vr" data-vr="${i}" role="button" tabindex="0" aria-label="${n} : potentiomètre sur ${a}. Molette ou flèches pour tourner, clic pour ouvrir les capteurs" style="cursor:pointer"><title>${n} → ${a} : molette pour tourner, clic pour les capteurs</title><rect x="548" y="${y}" width="30" height="30" rx="2" fill="#2E6FD0" stroke="#1E4E97"/><circle cx="563" cy="${y + 15}" r="10" fill="#F2F2F2"/><rect id="vr-ind-${i}" x="562" y="${y + 6}" width="2" height="18" fill="#555" transform="rotate(35 563 ${y + 15})"/></g>${sm(563, y + 42, n + ' · ' + a)}`).join('')}
  <rect x="42" y="304" width="18" height="12" rx="1" fill="#1A1C1E"/>${sm(51, 330, 'TMP100')}
  <rect x="80" y="300" width="28" height="20" rx="1" fill="#1A1C1E"/>${sm(94, 330, 'EEPROM')}
  <rect x="126" y="296" width="22" height="26" rx="3" fill="#121416"/><circle cx="137" cy="305" r="6" fill="#2B2F33"/>${sm(137, 334, 'IR')}
  <rect x="168" y="292" width="36" height="36" rx="2" fill="#1A1C1E"/>${chipPins(168, 292, 36, 36, 7)}<text x="186" y="313" text-anchor="middle" font-size="7" fill="#8C959C" font-family="Arial">AIC23B</text>
  ${[['LINE IN', 226], ['CASQUE', 268]].map(([t, x]) => `<rect x="${x}" y="294" width="32" height="32" rx="3" fill="#16181A"/><circle cx="${x + 16}" cy="310" r="9" fill="#2C3034" stroke="#555B60"/><circle cx="${x + 16}" cy="310" r="4" fill="#0A0B0C"/>${sm(x + 16, 338, t)}`).join('')}
  ${pins(324, 304, 4, 1, 8)}${sm(338, 322, 'CAN')}
  ${pins(370, 304, 4, 1, 8)}${sm(384, 322, 'SCI')}
  ${pins(416, 300, 2, 2, 8)}${sm(424, 330, 'ePWM→eCAP')}
  ${pins(466, 304, 3, 1, 8)}${sm(476, 322, 'DAC')}
  ${pins(50, 362, 12, 2)}${sm(92, 356, 'ADC')}
  ${pins(170, 362, 12, 2)}${sm(212, 356, 'GPIO')}
  ${pins(290, 362, 12, 2)}${sm(332, 356, 'PWM')}
  <text x="574" y="396" text-anchor="end" font-size="8" fill="#BFE6CF" font-family="Arial">disposition approximative</text>
</svg>`;
}
function bindBoard() {
  const press = (id, v) => {
    if (inp[id] === v) return; inp[id] = v;
    const g = $('c-' + id); g.classList.toggle('down', v); g.setAttribute('aria-pressed', String(v));
    hw.touch(id === 'PB1' ? 17 : 48);
  };
  ['PB1', 'PB2'].forEach(id => {
    const g = $('c-' + id);
    g.addEventListener('pointerdown', e => { e.preventDefault(); press(id, true); try { g.setPointerCapture(e.pointerId); } catch (_) {} });
    const up = () => press(id, false);
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up); g.addEventListener('lostpointercapture', up);
    g.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(id, true); } });
    g.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up(); } });
    g.addEventListener('blur', up);
  });
  const setHex = v => { inp.hex = (v + 16) % 16; for (let n = 12; n <= 15; n++) hw.touch(n); updateBoard(); };
  const sw = $('c-SW2');
  sw.addEventListener('click', () => setHex(inp.hex + 1));
  sw.addEventListener('wheel', e => { e.preventDefault(); setHex(inp.hex + (e.deltaY > 0 ? -1 : 1)); }, { passive: false });
  sw.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === '+') { e.preventDefault(); setHex(inp.hex + 1); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === '-') { e.preventDefault(); setHex(inp.hex - 1); }
    if (/^[0-9a-fA-F]$/.test(e.key)) { e.preventDefault(); setHex(parseInt(e.key, 16)); }
  });
  $('hexup').addEventListener('click', () => setHex(inp.hex + 1));
  $('hexdn').addEventListener('click', () => setHex(inp.hex - 1));
}
const ledOn = n => hw.mux[n] === 0 && hw.dir[n] === 1 && hw.lat[n] === 1;
function updateBoard() {
  for (const [id, n] of [['LD1', 9], ['LD2', 11], ['LD3', 34], ['LD4', 49]]) {
    const g = $('c-' + id); if (!g) continue; const on = ledOn(n);
    if (g._on !== on) { g._on = on; g.querySelector('.lamp').setAttribute('fill', on ? '#FF3B2A' : '#6E1C15'); g.querySelector('.glow').setAttribute('opacity', on ? '1' : '0'); g.classList.toggle('on', on); }
  }
  for (const id of ['PB1', 'PB2']) { const g = $('c-' + id); const d = inp[id]; if (g._d !== d) { g._d = d; g.querySelector('.cap').setAttribute('r', d ? '12' : '14.5'); g.querySelector('.cap').setAttribute('fill', d ? '#1B1E20' : '#2A2E31'); } }
  const hv = inp.hex;
  if ($('hexrot')._v !== hv) { $('hexrot')._v = hv; $('hexrot').setAttribute('transform', `rotate(${hv * 22.5} 92 192)`); $('hexval').textContent = hv.toString(16).toUpperCase() + ` (${hv})`; $('c-SW2').setAttribute('aria-valuenow', String(hv)); $('c-SW2').setAttribute('aria-valuetext', `${hv.toString(16).toUpperCase()} soit ${hv}`); }
}
function applyHighlights() {
  const svg = $('boardsvg'); if (!svg) return;
  for (const id of ['LD1', 'LD2', 'LD3', 'LD4', 'PB1', 'PB2', 'SW2']) {
    const g = $('c-' + id); const used = cur.uses.includes(id);
    g.classList.toggle('hl', used && cur.id !== 'libre'); g.classList.toggle('dim', !used);
  }
}

/* ====================== MODULES EXTERNES ====================== */
const SEGS = {
  a: '14,4 50,4 54,8 50,12 14,12 10,8', b: '54,10 58,14 58,48 54,52 50,48 50,14', c: '54,56 58,60 58,94 54,98 50,94 50,60',
  d: '14,96 50,96 54,100 50,104 14,104 10,100', e: '10,56 14,60 14,94 10,98 6,94 6,60', f: '10,10 14,14 14,48 10,52 6,48 6,14', g: '14,50 50,50 54,54 50,58 14,58 10,54'
};
const SEGN = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
function digitSVG(id, label) {
  return `<svg viewBox="0 0 72 128" width="72" height="128" role="img" aria-label="${esc(label)}"><rect x="0" y="0" width="72" height="112" rx="5" fill="#141414"/>
    <g transform="translate(4,4)">${SEGN.map(s => `<polygon points="${SEGS[s]}" fill="#3A1513"/><polygon id="${id}-${s}" points="${SEGS[s]}" fill="#FF3B2F" opacity="0"/>`).join('')}</g>
    <text x="36" y="124" text-anchor="middle" font-size="10" fill="currentColor" font-family="Arial">${esc(label)}</text></svg>`;
}
const lvlTxt = v => v === 2 ? 'Z' : String(v);
const lvlCls = v => 'lvl' + (v === 1 ? ' h' : v === 2 ? ' z' : '');
let modRefs = {};
const seg7Mode = () => S.ui.seg7 === 'anode' ? 'anode' : 'cathode';
const sr = { reg: 0, out: 0xFF };
const pov = { acc: new Float64Array(14), lit: new Uint8Array(14), lastT: 0, frameT: 0, show: new Float64Array(14), lastReal: perf() };
function resetModules() { sr.reg = 0; sr.out = 0xFF; pov.acc.fill(0); pov.show.fill(0); pov.lastT = now(); pov.frameT = now(); povState(); }
function povState() {
  const sel = hw.level(0); const driven = hw.mux[0] === 0 && hw.dir[0] === 1;
  const diz = driven && sel === 1, unit = driven && sel === 0;
  for (let s = 0; s < 7; s++) { const lit = ((sr.out >> s) & 1) === 0; pov.lit[s] = diz && lit ? 1 : 0; pov.lit[7 + s] = unit && lit ? 1 : 0; }
}
function povInt(t) { const dt = t - pov.lastT; if (dt > 0) for (let i = 0; i < 14; i++) if (pov.lit[i]) pov.acc[i] += dt; pov.lastT = Math.max(pov.lastT, t); }
hw.listeners.push((n, v, old, t) => {
  if (!cur.modules.includes('hc595') || n > 3) return;
  if (n === 1 && v === 1 && old === 0) { const d = hw.level(3); sr.reg = ((sr.reg << 1) | (d === 1 ? 1 : d === 2 ? (Math.random() < .5 ? 1 : 0) : 0)) & 0xFF; }
  if (n === 2 && v === 1 && old === 0) { povInt(t); sr.out = sr.reg; povState(); }
  if (n === 0) { povInt(t); povState(); }
});
function renderModules() {
  const el = $('modules'); modRefs = {};
  if (!cur.modules.length) { el.innerHTML = cur.id === 'libre' ? '' : `<p class="hint" style="padding:0 2px">Ce projet n'utilise que des éléments de la carte (en surbrillance).</p>`; return; }
  let h = `<p class="hint" style="padding:0 2px">Modules branchés pour ce projet</p>`;
  if (cur.modules.includes('seg7')) {
    const cath = seg7Mode() === 'cathode';
    h += `<section class="mod"><header>Afficheur 7 segments<span class="grow"></span><span class="chip">GPIO0–GPIO6</span></header>
    <div class="segmode"><span class="hint">Montage de l'afficheur</span><div class="persp" role="group" aria-label="Montage de l'afficheur"><button type="button" data-seg7="anode" aria-pressed="${!cath}">Anode commune · CLEAR allume</button><button type="button" data-seg7="cathode" aria-pressed="${cath}">Cathode commune · SET allume</button></div>
    <p class="hint">${cath ? 'Cathode commune à la masse : un segment s\'allume quand sa broche est à <b>1</b> (GPASET).' : 'Anode commune au VCC : un segment s\'allume quand sa broche est à <b>0</b> (GPACLEAR).'}</p></div>
    <div class="mbody">${digitSVG('s7', 'afficheur')}
    <div class="wires" aria-label="Câblage de l'afficheur">${SEGN.map((s, i) => `<span>GPIO${i}</span><span>— 330 Ω →</span><span>seg ${s} <span class="${lvlCls(2)}" id="s7l-${i}">Z</span></span>`).join('')}</div></div></section>`;
  }
  if (cur.modules.includes('keypad')) {
    const X = [56, 106, 156], Y = [30, 76, 122, 168];
    let k = '';
    for (let r = 0; r < 4; r++) k += `<line x1="22" y1="${Y[r]}" x2="190" y2="${Y[r]}" stroke="currentColor" stroke-width="1.6"/><text x="196" y="${Y[r] + 4}" font-size="12" fill="currentColor" font-family="Arial">L${r}</text>`;
    for (let c = 0; c < 3; c++) k += `<line x1="${X[c]}" y1="10" x2="${X[c]}" y2="190" stroke="currentColor" stroke-width="1.6"/><text x="${X[c]}" y="206" text-anchor="middle" font-size="12" fill="currentColor" font-family="Arial">C${c}</text>`;
    for (const [d, [r, c]] of Object.entries(KEYPOS)) k += `<g class="key" data-k="${d}" tabindex="0" role="button" aria-label="Touche ${d}" aria-pressed="false" style="cursor:pointer"><circle cx="${X[c]}" cy="${Y[r]}" r="17" fill="#FFFFFF" stroke="#333" stroke-width="1.6"/><text x="${X[c]}" y="${Y[r] + 5.5}" text-anchor="middle" font-size="16" font-weight="700" fill="#D32F2F" font-family="Arial" pointer-events="none">${d}</text></g>`;
    h += `<section class="mod"><header>Clavier 10 touches<span class="grow"></span><span class="chip">L0–L3 : GPIO0–3 · C0–C2 : GPIO4–6</span></header><div class="mbody"><svg viewBox="0 0 220 214" width="230" height="224" role="group" aria-label="Clavier : maintiens une touche">${k}</svg>
    <div class="wires" aria-label="Niveaux des lignes et colonnes">${['L0', 'L1', 'L2', 'L3', 'C0', 'C1', 'C2'].map((l, i) => `<span>${l}</span><span>GPIO${i}</span><span class="${lvlCls(2)}" id="kpl-${i}">Z</span>`).join('')}</div>
    <p class="keyhint">Maintiens une touche avec la souris, ou avec Espace quand elle a le focus. Plusieurs touches à la fois : clic droit pour verrouiller une touche.</p></div></section>`;
  }
  if (cur.modules.includes('portb')) {
    h += `<section class="mod"><header>Port B : interrupteurs<span class="grow"></span><span class="chip">GPIO32–GPIO39</span></header><div class="mbody"><div class="dips">${inp.sw.map((v, i) => `<button class="dip" data-sw="${i}" aria-pressed="${!!v}" aria-label="GPIO${32 + i}"><span>GPIO${32 + i}</span><span class="sl"></span><b>${v}</b></button>`).join('')}</div>
    <button class="btn" id="swq1">Valeurs de la question 1</button><button class="btn" id="sw0">Tout à 0</button></div></section>
    <section class="mod"><header>Générateur sur GPIO1 et sonde sur GPIO0<span class="grow"></span><span class="chip">GPIO1 · GPIO0</span></header><div class="mbody">
    <button class="btn genbtn" id="genbtn" aria-pressed="false">Maintenir : GPIO1 = 1</button><button class="btn genbtn" id="genpulse">Impulsion de 20 ms</button>
    <div class="probe"><span>GPIO1</span><span class="${lvlCls(0)}" id="g1l">0</span></div>
    <div class="probe"><span class="dot" id="g0dot"></span><span>Sonde GPIO0</span><span class="${lvlCls(2)}" id="g0l">Z</span></div>
    <button class="btn" id="openscope">Voir le chronogramme</button>
    <p class="keyhint">Le chronogramme complet s'affiche dans l'onglet Analyseur logique (déclenché sur le front montant de GPIO1).</p></div></section>`;
  }
  if (cur.modules.includes('hc595')) {
    const cells = (id) => Array.from({ length: 8 }, (_, i) => `<g><rect x="${i * 24}" y="0" width="22" height="22" rx="2" fill="none" stroke="currentColor" stroke-opacity=".5"/><text id="${id}-${i}" x="${i * 24 + 11}" y="15.5" text-anchor="middle" font-size="12" font-family="Consolas, monospace" fill="currentColor">0</text><text x="${i * 24 + 11}" y="34" text-anchor="middle" font-size="9" fill="currentColor" opacity=".7" font-family="Arial">Q${'ABCDEFGH'[i]}</text></g>`).join('');
    h += `<section class="mod"><header>74HC595 et deux afficheurs<span class="grow"></span><span class="chip">GPIO0 · GPIO1 CLK · GPIO2 LATCH · GPIO3 DATA</span></header><div class="mbody">
    <div class="wires">${[['GPIO0', 'afficheurs (transistors)'], ['GPIO1', 'CLK'], ['GPIO2', 'LATCH'], ['GPIO3', 'DATA']].map(([g, r], i) => `<span>${g}</span><span>→ ${r}</span><span class="${lvlCls(2)}" id="hcl-${i}">Z</span>`).join('')}</div>
    <div style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="hint">Registre interne (décalé à chaque front montant de CLK)</span><svg viewBox="0 0 194 38" width="194" height="38">${cells('hcr')}</svg>
    <span class="hint">Sorties (copiées au front montant de LATCH)</span><svg viewBox="0 0 194 38" width="194" height="38">${cells('hco')}</svg></div>
    <div style="display:flex;gap:10px;align-items:flex-end">${digitSVG('dz', 'AFF DIZ')}${digitSVG('du', 'AFF UNIT')}</div>
    <div class="wires"><span>AFF DIZ</span><span id="pdz" class="lvl">éteint</span><span></span><span>AFF UNIT</span><span id="pdu" class="lvl">éteint</span><span></span></div>
    <p class="keyhint">QA → segment a … QG → segment g ; QH n'est pas utilisée. L'éclat des afficheurs tient compte de la persistance rétinienne.</p></div></section>`;
  }
  if (cur.modules.includes('motor')) h += motorHTML();
  el.innerHTML = h;
  // liaisons
  el.querySelectorAll('.key').forEach(g => {
    const k = +g.dataset.k; let locked = false;
    const set = v => { if (v) inp.keys.add(k); else inp.keys.delete(k); g.setAttribute('aria-pressed', String(v)); g.querySelector('circle').setAttribute('fill', v ? '#C8D7EA' : '#FFFFFF'); for (let n = 0; n < 7; n++) hw.touch(n); };
    g.addEventListener('pointerdown', e => { if (e.button === 2) return; e.preventDefault(); locked = false; set(true); try { g.setPointerCapture(e.pointerId); } catch (_) {} });
    const up = () => { if (!locked) set(false); };
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up); g.addEventListener('lostpointercapture', up);
    g.addEventListener('contextmenu', e => { e.preventDefault(); locked = !inp.keys.has(k) || !locked; set(locked); });
    g.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(true); } });
    g.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(false); } });
  });
  el.querySelectorAll('[data-seg7]').forEach(b => b.addEventListener('click', () => {
    const m = b.dataset.seg7; if (seg7Mode() === m) return;
    S.ui.seg7 = m; saveLocal(); renderModules();
    toast(m === 'cathode' ? 'Afficheur en cathode commune : SET (niveau 1) allume un segment' : 'Afficheur en anode commune : CLEAR (niveau 0) allume un segment');
  }));
  el.querySelectorAll('[data-sw]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.sw; inp.sw[i] ^= 1; b.setAttribute('aria-pressed', String(!!inp.sw[i])); b.querySelector('b').textContent = inp.sw[i]; hw.touch(32 + i); }));
  const setSw = arr => { inp.sw = arr.slice(); el.querySelectorAll('[data-sw]').forEach(b => { const i = +b.dataset.sw; b.setAttribute('aria-pressed', String(!!inp.sw[i])); b.querySelector('b').textContent = inp.sw[i]; hw.touch(32 + i); }); };
  if ($('swq1')) $('swq1').addEventListener('click', () => setSw([1, 0, 0, 1, 1, 0, 1, 1]));
  if ($('sw0')) $('sw0').addEventListener('click', () => setSw([0, 0, 0, 0, 0, 0, 0, 0]));
  if ($('genbtn')) {
    const b = $('genbtn');
    const set = v => { inp.g1 = v; b.classList.toggle('down', !!v); b.setAttribute('aria-pressed', String(!!v)); hw.touch(1); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); set(1); try { b.setPointerCapture(e.pointerId); } catch (_) {} });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(0)));
    b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(1); } });
    b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(0); } });
    $('genpulse').addEventListener('click', () => { inp.g1 = 1; hw.touch(1); setTimeout(() => { inp.g1 = 0; hw.touch(1); }, 20); });
    $('openscope').addEventListener('click', () => showBottom('scope'));
  }
}
function updateModules() {
  if (cur.modules.includes('motor')) updateMotor();
  if (cur.modules.includes('seg7')) {
    for (let i = 0; i < 7; i++) {
      const lit = hw.mux[i] === 0 && hw.dir[i] === 1 && hw.lat[i] === (seg7Mode() === 'cathode' ? 1 : 0);
      const p = $('s7-' + SEGN[i]); if (p && p._v !== lit) { p._v = lit; p.setAttribute('opacity', lit ? '1' : '0'); }
      const l = $('s7l-' + i); const v = hw.level(i); if (l && l._v !== v) { l._v = v; l.textContent = lvlTxt(v); l.className = lvlCls(v); }
    }
  }
  if (cur.modules.includes('keypad')) for (let i = 0; i < 7; i++) { const l = $('kpl-' + i); const v = hw.level(i); if (l && l._v !== v) { l._v = v; l.textContent = lvlTxt(v); l.className = lvlCls(v); } }
  if (cur.modules.includes('portb')) {
    const v0 = hw.level(0), v1 = hw.level(1);
    const a = $('g0l'); if (a && a._v !== v0) { a._v = v0; a.textContent = lvlTxt(v0); a.className = lvlCls(v0); $('g0dot').classList.toggle('on', v0 === 1); }
    const b = $('g1l'); if (b && b._v !== v1) { b._v = v1; b.textContent = lvlTxt(v1); b.className = lvlCls(v1); }
  }
  if (cur.modules.includes('hc595')) {
    for (let i = 0; i < 4; i++) { const l = $('hcl-' + i); const v = hw.level(i); if (l && l._v !== v) { l._v = v; l.textContent = lvlTxt(v); l.className = lvlCls(v); } }
    for (let i = 0; i < 8; i++) { const a = $('hcr-' + i), b = $('hco-' + i); const ra = (sr.reg >> i) & 1, ob = (sr.out >> i) & 1; if (a && a._v !== ra) { a._v = ra; a.textContent = ra; } if (b && b._v !== ob) { b._v = ob; b.textContent = ob; } }
    const t = now(); const real = perf(); const dtr = real - pov.lastReal; pov.lastReal = real;
    povInt(t);
    const span = t - pov.frameT;
    const k = 1 - Math.exp(-Math.max(dtr, 1) / 45);
    for (let i = 0; i < 14; i++) {
      const target = span > 0 ? Math.min(1, pov.acc[i] / span) : pov.lit[i];
      pov.show[i] += (target - pov.show[i]) * k;
    }
    pov.acc.fill(0); pov.frameT = t;
    for (let i = 0; i < 14; i++) { const p = $((i < 7 ? 'dz-' : 'du-') + SEGN[i % 7]); const o = Math.min(1, pov.show[i] * 1.9); const r = Math.round(o * 100) / 100; if (p && p._v !== r) { p._v = r; p.setAttribute('opacity', String(r)); } }
    const sel = hw.level(0), drv = hw.mux[0] === 0 && hw.dir[0] === 1;
    const sdz = drv && sel === 1 ? 'alimenté' : 'éteint', sdu = drv && sel === 0 ? 'alimenté' : 'éteint';
    if ($('pdz').textContent !== sdz) { $('pdz').textContent = sdz; $('pdz').className = 'lvl' + (sdz === 'alimenté' ? ' h' : ''); }
    if ($('pdu').textContent !== sdu) { $('pdu').textContent = sdu; $('pdu').className = 'lvl' + (sdu === 'alimenté' ? ' h' : ''); }
  }
}

/* ====================== CHANGEMENT DE PROJET ====================== */
function renderExTabs() {
  let grp = null;
  $('extabs').innerHTML = EXOS.map(ex => { const gk = ex.chap === 0 || ex.id === 'libre' ? 0 : (ex.chap || 2); const lab = gk !== grp ? `<span class="exgrp" aria-hidden="true">${gk === 0 ? 'Libre' : gk === 3 ? 'ADC' : 'GPIO'}</span>` : ''; grp = gk; return lab + `<button class="extab" role="tab" id="xt-${ex.id}" aria-selected="${ex.id === cur.id}" data-x="${ex.id}" title="${esc(ex.title)}"><b>${esc(ex.tab)}</b><small>${esc(ex.sub)}</small></button>`; }).join('');
  $('extabs').querySelectorAll('.extab').forEach(b => b.addEventListener('click', () => selectExercise(b.dataset.x)));
}
function setEnonce() {
  $('enonce').innerHTML = cur.enonce;
  $('enonce').querySelectorAll('details').forEach(d => { const b = d.querySelector('[data-copysol]'), pre = d.querySelector('pre.sol'); if (b && pre && !pre.textContent && typeof SOLS !== 'undefined') pre.textContent = SOLS[b.dataset.copysol] || ''; });
  $('enonce').querySelectorAll('[data-verify]').forEach(b => b.addEventListener('click', verifyExercise));
  hw.watch = new Set(cur.comps.map(c => c.pin));
  $('enonce').querySelectorAll('[data-copysol]').forEach(b => b.addEventListener('click', async () => {
    const txt = (typeof SOLS !== 'undefined' && SOLS[b.dataset.copysol]) || '';
    if (await copyText(txt)) toast('Correction copiée dans le presse-papiers');
    else { const pre = b.closest('details').querySelector('pre'); const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Copie refusée : le code est sélectionné, fais Ctrl+C'); }
  }));
}
function selectExercise(id) {
  if (id === cur.id) return;
  if (active() && progEx !== id) { M.terminate(); log('info', `Programme de ${EXO(progEx).proj} arrêté : changement de projet.`); }
  S.projects[cur.id].expanded = false;
  cur = EXO(id); S.active = id; S.projects[id].expanded = true; saveLocal();
  inp.keys.clear(); inp.g1 = 0; inp.PB1 = false; inp.PB2 = false;
  problems = progEx === id ? problems : []; runErr = null; execMark = null;
  renderExTabs(); renderTree(); renderFileTabs(); loadEditorText();
  applyHighlights(); renderModules(); resetModules(); scopeConfig();
  setEnonce();
  hw.touchAll();
  showRight(cur.right || 'board'); renderSensors(); adcSig = '';
  renderProblems(); exprSig = ''; varsSig = ''; regsSig = ''; renderExpr(true); renderVars(true); renderRegs(true);
  updateToolbar(); updateStatus(); renderDebug();
  const el = $('xt-' + id); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ====================== MENUS ====================== */
const MENUS = {
  file: () => [
    { l: 'Nouveau fichier…', k: '', a: newFileDlg },
    { l: 'Renommer le fichier…', a: () => curFile() && renameDlg(curFile().id), d: !curFile() },
    { l: 'Supprimer le fichier…', a: () => curFile() && deleteDlg(curFile().id), d: !curFile() },
    { sep: 1 },
    { l: 'Copier tout le fichier', a: copyFile, d: !curFile() },
    { l: 'Exporter tous mes projets…', a: exportProjects },
    { l: 'Importer des projets…', a: prefsDlg },
    { l: 'Revenir au modèle du projet…', a: resetDlg },
    { sep: 1 },
    { l: 'Enregistrer', k: 'Ctrl+S', a: () => toast('Enregistrement automatique : ton code est déjà sauvegardé') }
  ],
  edit: () => [
    { l: 'Annuler', k: 'Ctrl+Z', a: () => { src.focus(); document.execCommand('undo'); } },
    { l: 'Rétablir', k: 'Ctrl+Y', a: () => { src.focus(); document.execCommand('redo'); } },
    { sep: 1 },
    { l: 'Tout sélectionner', k: 'Ctrl+A', a: () => { src.focus(); src.select(); } },
    { l: 'Commenter / décommenter', k: 'Ctrl+/', a: () => { src.focus(); toggleComment(); } },
    { sep: 1 },
    { l: 'Afficher les suggestions', k: 'Ctrl+Espace', a: () => { src.focus(); acOpen(true); }, d: !P.ac },
    { l: (P.ac ? '✓ ' : '') + 'Autocomplétion activée', k: 'Ctrl+Maj+Espace', a: () => { toggleAc(); src.focus(); } },
    { l: (P.acAuto ? '✓ ' : '') + 'Suggestions pendant la frappe', a: () => { P.acAuto = !P.acAuto; savePrefs(); applyPrefs(); toast(P.acAuto ? 'Suggestions automatiques pendant la frappe' : 'Suggestions seulement avec Ctrl+Espace'); }, d: !P.ac },
    { sep: 1 },
    { l: 'Préférences…', k: 'Ctrl+,', a: prefsDlg }
  ],
  project: () => [
    { l: 'Build Project', k: 'Ctrl+B', a: doBuild },
    { l: 'Compiler et lancer', k: 'Ctrl+Entrée', a: runNow },
    { sep: 1 },
    ...EXOS.map(ex => ({ l: (ex.id === cur.id ? '● ' : '') + ex.proj, a: () => selectExercise(ex.id) }))
  ],
  run: () => {
    const st = M ? M.state : 'none';
    return [
      { l: 'Debug', k: 'F11', a: debugCmd },
      { l: st === 'suspended' ? 'Resume' : 'Lancer sans arrêt', k: 'F8', a: resumeCmd, d: st === 'running' },
      { l: 'Suspend', k: 'Alt+F8', a: suspendCmd, d: st !== 'running' },
      { l: 'Terminate', k: 'Ctrl+F2', a: terminateCmd, d: !(st === 'running' || st === 'suspended') },
      { sep: 1 },
      { l: 'Step Into', k: 'F5', a: () => stepCmd('into'), d: st !== 'suspended' },
      { l: 'Step Over', k: 'F6', a: () => stepCmd('over'), d: st !== 'suspended' },
      { l: 'Step Return', k: 'F7', a: () => stepCmd('return'), d: st !== 'suspended' },
      { l: 'Restart (retour au début de main)', a: restartCmd, d: !prog || progEx !== cur.id },
      { sep: 1 },
      { l: 'Point d\'arrêt sur la ligne du curseur', k: 'Ctrl+Maj+B', a: () => { const ln = src.value.slice(0, src.selectionStart).split('\n').length; toggleBp(ln); } },
      { l: 'Supprimer tous les points d\'arrêt', a: clearBps }
    ];
  },
  window: () => [
    { l: 'Perspective CCS Edit', a: () => setPersp('edit') },
    { l: 'Perspective CCS Debug', a: () => setPersp('debug') },
    { sep: 1 },
    { l: 'Console', a: () => showBottom('console') }, { l: 'Problèmes', a: () => showBottom('problems') }, { l: 'Variables', a: () => showBottom('vars') }, { l: 'Expressions', a: () => showBottom('expr') }, { l: 'Registres', a: () => showBottom('regs') }, { l: 'Analyseur logique', a: () => showBottom('scope') },
    { sep: 1 },
    { l: 'Description du projet', a: () => showRight('enonce') }, { l: 'Carte', a: () => showRight('board') }, { l: 'Capteurs ADC', a: () => showRight('sensors') },
    { sep: 1 },
    { l: 'Vue ADC (registres, séquence, tracé)', a: () => showBottom('adc') },
    { l: 'Préférences…', k: 'Ctrl+,', a: prefsDlg },
    ...(BRIDGE.mode === 'panel' ? [{ l: 'Ouvrir dans un grand onglet', a: () => BRIDGE.openTab() }] : [])
  ],
  help: () => [
    { l: 'Raccourcis clavier', a: helpKeys },
    { l: 'Aide-mémoire ADC', a: helpAdc },
    { l: 'Ce que le simulateur sait faire', a: helpLimits },
    { l: 'À propos de l\'extension', a: helpExt }
  ]
};
let openMenu = null;
function closeMenu() { if (openMenu) { openMenu.el.remove(); openMenu.btn.setAttribute('aria-expanded', 'false'); openMenu = null; } }
function showMenu(btn) {
  const key = btn.dataset.menu; if (openMenu && openMenu.key === key) { closeMenu(); return; } closeMenu();
  const items = MENUS[key]();
  const el = document.createElement('div'); el.className = 'menu'; el.setAttribute('role', 'menu');
  el.innerHTML = items.map((it, i) => it.sep ? '<hr>' : `<button role="menuitem" data-i="${i}"${it.d ? ' disabled' : ''}><span></span><span>${esc(it.l)}</span><span class="k">${esc(it.k || '')}</span></button>`).join('');
  document.body.append(el);
  const r = btn.getBoundingClientRect(); el.style.left = Math.min(r.left, window.innerWidth - el.offsetWidth - 6) + 'px'; el.style.top = r.bottom + 'px';
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const it = items[+b.dataset.i]; closeMenu(); it.a(); }));
  el.addEventListener('keydown', e => {
    const bs = [...el.querySelectorAll('button:not(:disabled)')]; const i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    if (e.key === 'Escape') { e.preventDefault(); const b = openMenu.btn; closeMenu(); b.focus(); }
  });
  btn.setAttribute('aria-expanded', 'true'); openMenu = { key, el, btn };
  const first = el.querySelector('button:not(:disabled)'); if (first && document.activeElement === btn) first.focus();
}
document.querySelectorAll('.mbtn').forEach(b => {
  b.addEventListener('click', () => showMenu(b));
  b.addEventListener('mouseenter', () => { if (openMenu && openMenu.btn !== b) showMenu(b); });
  b.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!openMenu || openMenu.btn !== b) showMenu(b); const f = openMenu && openMenu.el.querySelector('button:not(:disabled)'); if (f) f.focus(); } });
});
document.addEventListener('mousedown', e => { if (openMenu && !openMenu.el.contains(e.target) && !e.target.closest('.mbtn')) closeMenu(); });
function helpKeys() {
  const rows = [['Ctrl+B', 'Build : compiler le projet'], ['F11', 'Debug : compiler, charger, s\'arrêter au début de main()'], ['F8', 'Resume ; si rien n\'est chargé : compiler et lancer'], ['Ctrl+Entrée', 'Compiler et lancer sans s\'arrêter'], ['Alt+F8', 'Suspend'], ['Ctrl+F2', 'Terminate'], ['F5 / F6 / F7', 'Step Into / Step Over / Step Return'], ['Clic dans la marge', 'Poser ou enlever un point d\'arrêt'], ['Ctrl+Maj+B', 'Point d\'arrêt sur la ligne du curseur'], ['Ctrl+Espace', 'Autocomplétion (registres, broches, mots clés)'], ['Ctrl+/', 'Commenter ou décommenter les lignes'], ['Tab / Maj+Tab', 'Indenter / désindenter']];
  dialog({ title: 'Raccourcis clavier', cancelLabel: 'Fermer', wide: true, body: `<div class="help"><table>${rows.map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join('')}</table><p class="hint" style="margin-top:8px">Comme dans Code Composer Studio (Eclipse). Dans un navigateur, F5 et F11 sont interceptés par la page tant qu'elle a le focus.</p></div>` });
}
function helpLimits() {
  dialog({
    title: 'Ce que le simulateur sait faire', cancelLabel: 'Fermer', wide: true, body: `<div class="help">
  <p><b>Langage C</b> : variables globales et locales, tableaux (1 et 2 dimensions), fonctions avec paramètres et valeur de retour, if, while, do, for, switch, #define (aussi avec paramètres), #include de tes .h, plusieurs fichiers .c compilés ensemble, printf vers la console.</p>
  <p><b>Types comme sur le C28x</b> : int, char et Uint16 sur 16 bits, long et Uint32 sur 32 bits. Exemple : <code>~0xF000</code> vaut 0x0FFF sur 16 bits, et efface les bits 16 à 31 d'un registre 32 bits si on oublie <code>UL</code>.</p>
  <p><b>Registres</b> : GpioCtrlRegs (MUX1/2, DIR, PUD, QSEL1/2, CTRL) protégés par EALLOW/EDIS, GpioDataRegs (DAT, SET, CLEAR, TOGGLE), en <code>.bit.GPIOxx</code> ou <code>.all</code>, ports A, B et C. <b>AdcRegs</b> et <b>AdcMirror</b> (tout le module ADC : séquenceurs cascadé / double, start-stop / continu, drapeaux, résultats) et <b>SysCtrlRegs.PCLKCR0</b> (horloges, protégé par EALLOW). Les autres périphériques (PieCtrlRegs, ePWM…) sont acceptés mais pas simulés.</p>
  <p><b>Capteurs</b> : potentiomètres, capteurs linéaires (V = a·x + b) et générateurs sur les 16 voies ADCIN, déclencheurs ADCSOC / SOCA / SOCB simulés.</p>
  <p><b>Temps</b> : une instruction C dure environ 0,05 µs (≈ 7 cycles à 150 MHz) ; <code>DELAY_US(x)</code> attend x µs. Le temps simulé suit le temps réel, sauf pendant une pause.</p>
  <p><b>Débogage</b> : points d'arrêt, pas à pas, pile d'appels, variables locales et globales, expressions surveillées, registres, analyseur logique.</p>
  <p><b>Pas pris en charge</b> : pointeurs, struct, enum, typedef, routines d'interruption (les drapeaux sont simulés, pas l'appel de la routine), timers, ePWM. Le simulateur ne remplace pas la carte : vérifie toujours ton programme sur la vraie carte.</p>
  <p><b>Tes fichiers</b> sont enregistrés automatiquement dans l'extension, sur ce PC (Préférences ▸ Données pour exporter).</p></div>`
  });
}

/* ====================== RACCOURCIS, BARRE D'ÉTAT, BOUCLE ====================== */
document.addEventListener('keydown', e => {
  if (document.querySelector('.dlg-back')) return;
  const k = e.key;
  if (k === 'F11') { e.preventDefault(); debugCmd(); return; }
  if (k === 'F8' && e.altKey) { e.preventDefault(); suspendCmd(); return; }
  if (k === 'F8') { e.preventDefault(); resumeCmd(); return; }
  if (k === 'F5') { e.preventDefault(); stepCmd('into'); return; }
  if (k === 'F6') { e.preventDefault(); stepCmd('over'); return; }
  if (k === 'F7') { e.preventDefault(); stepCmd('return'); return; }
  if (k === 'F2' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); terminateCmd(); return; }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'B' || k === 'b')) { e.preventDefault(); const ln = src.value.slice(0, src.selectionStart).split('\n').length; toggleBp(ln); return; }
  if ((e.ctrlKey || e.metaKey) && (k === 'b' || k === 'B')) { e.preventDefault(); doBuild(); return; }
  if ((e.ctrlKey || e.metaKey) && k === ',') { e.preventDefault(); prefsDlg(); return; }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === ' ' && document.activeElement !== src) { e.preventDefault(); toggleAc(); return; }
  if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'S')) { e.preventDefault(); toast('Enregistrement automatique : ton code est déjà sauvegardé'); return; }
  if (k === 'Escape') closeMenu();
}, true);
$('tb-new').addEventListener('click', newFileDlg); $('ex-new').addEventListener('click', newFileDlg);
$('tb-build').addEventListener('click', doBuild); $('tb-debug').addEventListener('click', debugCmd);
$('tb-resume').addEventListener('click', resumeCmd); $('tb-suspend').addEventListener('click', suspendCmd); $('tb-term').addEventListener('click', terminateCmd);
$('tb-into').addEventListener('click', () => stepCmd('into')); $('tb-over').addEventListener('click', () => stepCmd('over')); $('tb-ret').addEventListener('click', () => stepCmd('return'));
$('tb-restart').addEventListener('click', restartCmd);
$('pp-edit').addEventListener('click', () => setPersp('edit')); $('pp-debug').addEventListener('click', () => setPersp('debug'));
$('dbg-tog').addEventListener('click', () => setDebugOpen(!$('v-debug').classList.contains('open')));
function showRight(v) {
  for (const k of ['board', 'sensors', 'enonce']) { $('rt-' + k).setAttribute('aria-selected', String(v === k)); $('rp-' + k).hidden = v !== k; }
  $('gpvis-l').hidden = v !== 'board';
  if (v === 'sensors') renderSensors();
}
$('rt-board').addEventListener('click', () => showRight('board')); $('rt-enonce').addEventListener('click', () => showRight('enonce')); $('rt-sensors').addEventListener('click', () => showRight('sensors'));
$('gpvis').addEventListener('change', e => { $('boardsvg').classList.toggle('nogp', !e.target.checked); S.ui.nogp = !e.target.checked; saveLocal(); });
function updateStatus() {
  const f = curFile();
  $('st-proj').textContent = cur.proj + (f ? ' · ' + f.name : '');
  const st = M && progEx === cur.id ? M.state : (M && active() ? 'other' : null);
  const chip = $('st-run'); const lab = { running: 'En cours', suspended: 'Suspendu' + (stateWhy ? ' · ' + stateWhy : ''), finished: 'Terminé', terminated: 'Arrêté', error: 'Erreur', loaded: 'Chargé', other: 'Autre projet en cours' }[st] || 'Non chargé';
  chip.className = 'st-chip' + (st === 'running' ? ' run' : st === 'suspended' ? ' sus' : st === 'error' ? ' err' : '');
  chip.lastChild.textContent = lab;
  $('st-stale').hidden = !(progStale && progEx === cur.id && prog);
}
function checkHints() {
  if (!active()) return;
  const t = now();
  for (const c of cur.comps) if (c.role === 'out') {
    const n = c.pin;
    if (hw.latT[n] >= 0 && hw.dir[n] === 0 && t - hw.latT[n] > 400000) warnOnce('ldir' + n, `${c.name} : une valeur a été écrite pour GPIO${n}, mais la broche est restée en entrée (GP${Sim.portOf(n)}DIR = 0) : rien ne sort. Mets GP${Sim.portOf(n)}DIR.bit.GPIO${n} = 1 (entre EALLOW et EDIS).`);
  }
}
let lastSlow = 0;
function frame(ts) {
  updateBoard(); updateModules(); updateVR();
  if (bottomTab === 'scope') drawScope();
  if (ts - lastSlow > 160) {
    lastSlow = ts;
    if (M && M.state === 'running') { renderVars(); renderExpr(); }
    renderRegs(); checkHints(); renderAdc(); updateSensorsLive(); adcHints();
    $('st-time').textContent = 't = ' + (now() / 1e6).toFixed(3).replace('.', ',') + ' s';
  }
  requestAnimationFrame(frame);
}


/* ====================== PRÉFÉRENCES : APPLICATION ====================== */
function applyPrefs() {
  const root = document.documentElement;
  if (P.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', P.theme);
  LH = Math.round(P.fontSize * 1.46);
  root.style.setProperty('--cfs', P.fontSize + 'px'); root.style.setProperty('--clh', LH + 'px'); root.style.setProperty('--ctab', String(P.tabSize));
  if (hw.adc) Object.assign(hw.adc.opts, P.adc);
  Sim.Machine.defaultSpeed = P.speed; if (M) M.setSpeed(P.speed);
  const sp = $('tb-speed');
  if (sp) { if (![...sp.options].some(o => +o.value === P.speed)) sp.insertAdjacentHTML('beforeend', `<option value="${P.speed}">× ${fr(P.speed)}</option>`); sp.value = String(P.speed); }
  updateAcChip();
  if (!P.ac) acClose();
  renderEditor();
}
function toggleAc() {
  P.ac = !P.ac; savePrefs(); applyPrefs();
  toast(P.ac ? 'Autocomplétion activée (Ctrl+Espace pour l\'ouvrir à tout moment)' : 'Autocomplétion désactivée (Ctrl+Maj+Espace pour la réactiver)');
}
function updateAcChip() {
  const b = $('st-ac'); if (!b) return;
  b.textContent = 'Autocomplétion : ' + (P.ac ? (P.acAuto ? 'activée' : 'Ctrl+Espace') : 'désactivée');
  b.classList.toggle('off', !P.ac); b.setAttribute('aria-pressed', String(P.ac));
}

/* ====================== PRÉFÉRENCES : FENÊTRE ====================== */
function prefsDlg() {
  const ck = (k, l, hint) => `<label class="pf-ck"><input type="checkbox" data-p="${k}"> <span>${l}${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  const sel = (k, l, opts, hint) => `<label class="pf-row"><span>${l}${hint ? `<small>${hint}</small>` : ''}</span><select class="sm" data-p="${k}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
  const num = (k, l, min, max, step, unit, hint) => `<label class="pf-row"><span>${l}${hint ? `<small>${hint}</small>` : ''}</span><span class="pf-num"><input type="number" data-p="${k}" min="${min}" max="${max}" step="${step}">${unit ? `<i>${unit}</i>` : ''}</span></label>`;
  const body = `<div class="prefs">
  <nav class="pf-tabs" role="tablist">${['Éditeur', 'Simulation', 'ADC et capteurs', 'Interface', 'Données'].map((t, i) => `<button type="button" role="tab" data-pt="${i}" aria-selected="${i === 0}">${t}</button>`).join('')}</nav>
  <section data-ps="0">
    <h4>Autocomplétion</h4>
    ${ck('ac', 'Autocomplétion activée', 'Raccourci : Ctrl+Maj+Espace pour activer / désactiver')}
    ${ck('acAuto', 'Proposer automatiquement pendant la frappe', 'Décoché : la liste n\'apparaît qu\'avec Ctrl+Espace')}
    ${num('acMin', 'Lettres tapées avant de proposer', 1, 4, 1, '')}
    ${ck('acRegs', 'Proposer les registres et leurs champs', 'GpioCtrlRegs, GpioDataRegs, AdcRegs, AdcMirror, SysCtrlRegs.PCLKCR0')}
    ${ck('acProject', 'Proposer les variables et fonctions de ton projet')}
    <h4>Saisie</h4>
    ${ck('autoClose', 'Fermer automatiquement ( [ { " \'')}
    ${ck('autoIndent', 'Indenter automatiquement après Entrée')}
    ${sel('tabSize', 'Indentation (touche Tab)', [[2, '2 espaces'], [3, '3 espaces'], [4, '4 espaces'], [8, '8 espaces']])}
    ${num('fontSize', 'Taille du texte du code', 10, 22, 1, 'px')}
    ${ck('highlight', 'Coloration syntaxique')}
  </section>
  <section data-ps="1" hidden>
    <h4>Exécution</h4>
    ${sel('speed', 'Vitesse du temps simulé', [[0.01, '× 0,01 (très ralenti)'], [0.1, '× 0,1'], [0.5, '× 0,5'], [1, '× 1 (temps réel)'], [2, '× 2'], [10, '× 10']], 'Aussi dans la barre d\'outils')}
    ${ck('hints', 'Conseils pédagogiques dans la console', 'Messages « astuce » (en gris) ; les erreurs restent toujours affichées')}
    <h4>Rigueur de la carte simulée</h4>
    ${ck('adc.clockFromInit', 'InitSysCtrl() active l\'horloge de l\'ADC', 'Comme la bibliothèque TI. Décoché (comme le demande le cours) : tu dois écrire ADCENCLK = 1 toi-même')}
    ${ck('adc.needPower', 'Exiger la mise sous tension de l\'ADC', 'Sans InitAdc() / initADC() (ou ADCTRL3), les conversions renvoient 0, comme sur la vraie carte')}
  </section>
  <section data-ps="2" hidden>
    <h4>Conversion</h4>
    ${num('adc.vref', 'Plage de conversion VREFHI − VREFLO', 0.5, 5, 0.1, 'V', 'F28335 : 3 V (VREFLO = 0)')}
    ${sel('adc.rounding', 'Calcul de N', [['round', 'arrondi : N = 4095 × V / 3'], ['floor', 'troncature (quantification par défaut)']])}
    ${num('adc.noiseLsb', 'Bruit de mesure (écart type)', 0, 50, 0.5, 'LSB', '0 = mesures parfaitement stables')}
    ${num('adc.offsetLsb', 'Erreur d\'offset', -100, 100, 1, 'LSB')}
    ${sel('adc.convScale', 'Durée d\'une conversion', [[1, 'réaliste (quelques dizaines de ns)'], [1000, 'ralentie × 1000 (pour voir SEQ1_BSY)']])}
    ${sel('adc.floating', 'Voie sans capteur', [['noise', 'valeur au hasard (comme une entrée en l\'air)'], ['zero', 'lit 0']])}
    <h4>Déclencheurs simulés</h4>
    ${num('adc.socaHz', 'Fréquence du SOCA (ePWM)', 1, 100000, 1, 'Hz')}
    ${num('adc.socbHz', 'Fréquence du SOCB (ePWM)', 1, 100000, 1, 'Hz')}
  </section>
  <section data-ps="3" hidden>
    ${sel('theme', 'Thème', [['auto', 'comme le système'], ['light', 'clair'], ['dark', 'sombre']])}
    ${sel('openIn', 'Clic sur l\'icône de l\'extension', [['tab', 'ouvre un onglet'], ['panel', 'ouvre le panneau latéral']], 'Clic droit sur l\'icône : choisir l\'autre à chaque fois')}
    ${ck('sensorsAll', 'Capteurs ADC : afficher les 16 voies', 'Décoché : seulement les voies branchées')}
    ${BRIDGE.mode === 'panel' ? '<p><button class="btn" type="button" id="pf-tab">Ouvrir le simulateur dans un grand onglet</button></p>' : ''}
  </section>
  <section data-ps="4" hidden>
    <p class="hint">Tes projets sont enregistrés automatiquement dans l'extension, sur cet ordinateur. Exporte-les pour les sauvegarder ou les passer sur un autre PC.</p>
    <p class="pf-btns"><button class="btn" type="button" id="pf-exp">Exporter tous mes projets (.json)</button><label class="btn">Importer des projets…<input type="file" id="pf-imp" accept=".json,application/json" hidden></label></p>
    <p class="pf-btns"><button class="btn" type="button" id="pf-reset">Remettre les préférences par défaut</button></p>
    <p class="hint">Version ${esc(BRIDGE.version || '—')} · ${BRIDGE.mode === 'panel' ? 'panneau latéral' : 'onglet'}</p>
  </section></div>`;
  dialog({ title: 'Préférences', body, cancelLabel: 'Fermer', wide: true });
  const box = document.querySelector('.dlg .prefs'); if (!box) return;
  const get = k => k.split('.').reduce((o, x) => o[x], P);
  const def = k => k.split('.').reduce((o, x) => o[x], PREF_DEF);
  const set = (k, v) => { const a = k.split('.'); const last = a.pop(); a.reduce((o, x) => o[x], P)[last] = v; };
  const load = () => box.querySelectorAll('[data-p]').forEach(el => { const v = get(el.dataset.p); if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v); });
  load();
  box.addEventListener('change', e => {
    const el = e.target.closest('[data-p]'); if (!el) return;
    const k = el.dataset.p, d = def(k);
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (typeof d === 'number') { v = Number(v); if (!Number.isFinite(v)) { el.value = String(get(k)); return; } if (el.min !== '') v = Math.max(+el.min, v); if (el.max !== '') v = Math.min(+el.max, v); el.value = String(v); }
    set(k, v); savePrefs(); applyPrefs();
    if (k.startsWith('adc.') || k === 'sensorsAll') { renderSensors(); adcSig = ''; }
  });
  box.querySelectorAll('[data-pt]').forEach(b => b.addEventListener('click', () => {
    box.querySelectorAll('[data-pt]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    box.querySelectorAll('[data-ps]').forEach(s => { s.hidden = s.dataset.ps !== b.dataset.pt; });
  }));
  const tb = box.querySelector('#pf-tab'); if (tb) tb.addEventListener('click', () => BRIDGE.openTab());
  box.querySelector('#pf-exp').addEventListener('click', exportProjects);
  box.querySelector('#pf-imp').addEventListener('change', e => { const f = e.target.files[0]; if (f) importProjects(f); e.target.value = ''; });
  box.querySelector('#pf-reset').addEventListener('click', () => {
    const fresh = readPrefs(null); for (const k of Object.keys(fresh)) P[k] = fresh[k];
    savePrefs(); applyPrefs(); renderSensors(); load(); toast('Préférences remises par défaut');
  });
}
function exportProjects() {
  const d = new Date(); const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  BRIDGE.download(`simulateur-f28335-projets-${day}.json`, JSON.stringify({ app: 'simulateur-f28335', version: BRIDGE.version, date: d.toISOString(), state: S, prefs: P }, null, 1));
  toast('Export lancé : regarde tes téléchargements');
}
function importProjects(file) {
  const rd = new FileReader();
  rd.onload = () => {
    let o; try { o = JSON.parse(rd.result); } catch (e) { toast('Fichier illisible : ce n\'est pas un export du simulateur'); return; }
    if (!o || o.app !== 'simulateur-f28335' || !o.state || typeof o.state.projects !== 'object') { toast('Ce fichier n\'est pas un export du simulateur'); return; }
    const n = Object.keys(o.state.projects).length;
    dialog({
      title: 'Importer des projets', okLabel: 'Remplacer mes projets', danger: true,
      body: `<p>Le fichier contient ${n} projet${n > 1 ? 's' : ''} (export du ${esc(String(o.date || '').slice(0, 10))}). Tes projets actuels seront <b>remplacés</b>. Exporte-les d'abord si tu veux les garder.</p>`,
      onOk: () => { lsSet(LS_KEY, JSON.stringify(o.state)); if (o.prefs) { BRIDGE.prefs = JSON.stringify(o.prefs); BRIDGE.save(PREF_KEY, BRIDGE.prefs); } setTimeout(() => location.reload(), 300); return null; }
    });
  };
  rd.readAsText(file);
}

/* ====================== CAPTEURS ADC ====================== */
function SENSOR_PRESETS() {
  return [
    ['pot', 'Potentiomètre 0–3 V', { type: 'pot', label: 'Potentiomètre', v: 1.5 }],
    ['courant', 'Capteur de courant (V = 1,5 + 0,1·I)', { type: 'lin', label: 'Capteur de courant', qty: 'I', unit: 'A', a: 0.1, b: 1.5, x: 2, xmin: -15, xmax: 15, step: 0.1 }],
    ['temp', 'Capteur de température (10 mV/°C)', { type: 'lin', label: 'Capteur de température', qty: 'T', unit: '°C', a: 0.01, b: 0, x: 25, xmin: -20, xmax: 150, step: 0.5 }],
    ['lum', 'Capteur de lumière (V = 0,003·E)', { type: 'lin', label: 'Capteur de lumière', qty: 'E', unit: 'lx', a: 0.003, b: 0, x: 300, xmin: 0, xmax: 1000, step: 5 }],
    ['pos', 'Capteur de position (V = 0,03·x)', { type: 'lin', label: 'Capteur de position', qty: 'x', unit: 'mm', a: 0.03, b: 0, x: 50, xmin: 0, xmax: 100, step: 0.5 }],
    ['sin', 'Générateur sinusoïdal', { type: 'gen', label: 'Générateur', shape: 'sin', off: 1.5, amp: 1.2, freq: 50 }],
    ['tri', 'Générateur triangulaire', { type: 'gen', label: 'Générateur', shape: 'tri', off: 1.5, amp: 1.2, freq: 50 }],
    ['sq', 'Générateur carré', { type: 'gen', label: 'Générateur', shape: 'sq', off: 1.5, amp: 1.2, freq: 50 }],
    ['micro', 'Microphone (signal audio f + 4f + 10f)', { type: 'gen', label: 'Microphone', shape: 'voix', off: 1.5, amp: 1, freq: 300 }],
    ['lin', 'Capteur linéaire personnalisé (V = a·x + b)', { type: 'lin', label: 'Capteur', qty: 'x', unit: '', a: 1, b: 0, x: 1, xmin: 0, xmax: 3, step: 0.01 }]
  ];
}
function defaultSensors(ex) {
  const a = Array.from({ length: 16 }, () => ({ type: 'none' }));
  if (ex && ex.sensors) for (const [ch, s] of Object.entries(ex.sensors)) a[+ch] = JSON.parse(JSON.stringify(s));
  return a;
}
const SHAPES = { sin: 'sinus', tri: 'triangle', sq: 'carré', saw: 'dent de scie', voix: 'voix (f + 4f + 10f)' };
function wave(shape, ph) {
  ph -= Math.floor(ph);
  if (shape === 'tri') return 1 - 4 * Math.abs(ph - 0.5);
  if (shape === 'sq') return ph < 0.5 ? 1 : -1;
  if (shape === 'saw') return 2 * ph - 1;
  if (shape === 'voix') { const w = 2 * Math.PI * ph; return 0.6 * Math.sin(w) + 0.3 * Math.sin(4 * w + 0.7) + 0.1 * Math.sin(10 * w + 1.9); }
  return Math.sin(2 * Math.PI * ph);
}
function sensorVoltOf(s, t) {
  if (!s || s.type === 'none') return NaN;
  if (s.type === 'pot') return +s.v;
  if (s.type === 'lin') return (+s.a) * (+s.x) + (+s.b);
  if (s.type === 'gen') return (+s.off) + (+s.amp) * wave(s.shape, (+s.freq) * t / 1e6);
  return NaN;
}
function sensorVolt(ch, t) { const p = S.projects[progEx && active() ? progEx : cur.id] || proj(); return sensorVoltOf(p.sensors[ch], t); }
const expN = v => { const VR = P.adc.vref || 3; const x = 4095 * Math.max(0, Math.min(VR, v)) / VR + (P.adc.offsetLsb || 0); return Math.max(0, Math.min(4095, P.adc.rounding === 'floor' ? Math.floor(x) : Math.round(x))); };
const fv = (v, d = 3) => Number.isFinite(v) ? (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',') : '—';
const fnum = v => String(v).replace('.', ',');
function lastConv(ch) { const H = hw.adc ? hw.adc.history : []; for (let i = H.length - 1; i >= 0 && i > H.length - 600; i--) if (H[i].ch === ch) return H[i]; return null; }
let sensSaveT = null;
function sensSave() { clearTimeout(sensSaveT); sensSaveT = setTimeout(saveLocal, 250); }
function renderSensors() {
  const el = $('sensors'); if (!el || $('rp-sensors').hidden) return;
  const sens = proj().sensors;
  const used = sens.map((s, ch) => ({ s, ch })).filter(x => x.s.type !== 'none');
  const show = P.sensorsAll ? sens.map((s, ch) => ({ s, ch })) : used;
  const presetOpts = SENSOR_PRESETS().map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
  let h = `<div class="sn-head"><div class="sn-stat" id="sn-stat"></div>
    <label class="hint"><input type="checkbox" id="sn-all"${P.sensorsAll ? ' checked' : ''}> 16 voies</label></div>`;
  h += `<p class="hint sn-intro">Chaque voie <b>ADCINA0–A7</b> (voies 0–7) et <b>ADCINB0–B7</b> (voies 8–15) reçoit la tension d'un capteur virtuel. Plage utile : 0 à ${fnum(P.adc.vref)} V. Valeur attendue : N = 4095 × V / ${fnum(P.adc.vref)}.</p>`;
  if (!show.length) h += `<p class="hint sn-empty">Aucun capteur branché pour ce projet.</p>`;
  for (const { s, ch } of show) h += sensorCard(s, ch);
  const free = sens.map((s, ch) => ch).filter(ch => sens[ch].type === 'none');
  h += `<section class="mod sn-add"><header>Brancher un capteur</header><div class="mbody">
    <label class="hint">Voie <select class="sm" id="sn-ch">${free.map(ch => `<option value="${ch}">${ch} · ${AdcSim.CH_NAME(ch)}</option>`).join('')}</select></label>
    <label class="hint">Modèle <select class="sm" id="sn-preset">${presetOpts}</select></label>
    <button class="btn primary" id="sn-plug"${free.length ? '' : ' disabled'}>Brancher</button>
    <button class="btn" id="sn-defaults" title="Revenir aux capteurs prévus par le projet">Montage de départ</button></div></section>`;
  h += `<section class="mod"><header>Déclencheurs externes<span class="grow"></span><span class="chip">ADCSOC · ePWM</span></header><div class="mbody sn-trig">
    <button class="btn" id="sn-extsoc" title="Impulsion sur la broche ADCSOC (EXT_SOC_SEQ1 doit valoir 1)">Impulsion ADCSOC</button>
    <label class="hint">SOCA <input type="number" class="sn-in" id="sn-soca" min="1" max="100000" step="1" value="${P.adc.socaHz}"> Hz</label>
    <label class="hint">SOCB <input type="number" class="sn-in" id="sn-socb" min="1" max="100000" step="1" value="${P.adc.socbHz}"> Hz</label>
    <p class="keyhint">Les timers ePWM ne sont pas simulés : quand EPWM_SOCA_SEQ1 (ou SOCB) vaut 1, le simulateur envoie le signal à la fréquence choisie ici.</p></div></section>`;
  el.innerHTML = h;
  updateSensorsLive(true);
}
function sensorCard(s, ch) {
  const head = `<header><b class="sn-ch">${AdcSim.CH_NAME(ch)}</b><span class="chip">voie ${ch}</span>${s.type !== 'none' ? `<span class="sn-lab">${esc(s.label || '')}</span>` : ''}<span class="grow"></span>
    <select class="sm" data-k="type" aria-label="Type de capteur sur la voie ${ch}">${[['none', 'non branché'], ['pot', 'potentiomètre'], ['lin', 'capteur linéaire'], ['gen', 'générateur']].map(([v, l]) => `<option value="${v}"${s.type === v ? ' selected' : ''}>${l}</option>`).join('')}</select></header>`;
  if (s.type === 'none') return `<section class="mod sn sn-off" data-ch="${ch}">${head}</section>`;
  let b = '';
  if (s.type === 'pot') {
    b = `<div class="sn-main"><input type="range" data-k="v" min="0" max="3.3" step="0.001" value="${s.v}" aria-label="Tension voie ${ch}"><span class="sn-val"><input type="number" class="sn-in" data-k="v" min="-1" max="5" step="0.01" value="${s.v}"> V</span></div>`;
  } else if (s.type === 'lin') {
    b = `<div class="sn-main"><span class="sn-q">${esc(s.qty || 'x')}</span><input type="range" data-k="x" min="${s.xmin}" max="${s.xmax}" step="${s.step || 0.01}" value="${s.x}" aria-label="${esc(s.qty || 'x')} voie ${ch}"><span class="sn-val"><input type="number" class="sn-in" data-k="x" step="${s.step || 0.01}" value="${s.x}"> ${esc(s.unit || '')}</span></div>
      <details class="sn-par"><summary>V = ${fnum(s.a)} × ${esc(s.qty || 'x')} ${+s.b < 0 ? '−' : '+'} ${fnum(Math.abs(s.b))}</summary><div class="sn-grid">
      <label>Nom <input class="sn-in w" data-k="label" value="${esc(s.label || '')}"></label><label>Grandeur <input class="sn-in" data-k="qty" value="${esc(s.qty || '')}"></label><label>Unité <input class="sn-in" data-k="unit" value="${esc(s.unit || '')}"></label>
      <label>a (V/${esc(s.unit || 'u')}) <input type="number" class="sn-in" data-k="a" step="any" value="${s.a}"></label><label>b (V) <input type="number" class="sn-in" data-k="b" step="any" value="${s.b}"></label>
      <label>min <input type="number" class="sn-in" data-k="xmin" step="any" value="${s.xmin}"></label><label>max <input type="number" class="sn-in" data-k="xmax" step="any" value="${s.xmax}"></label></div></details>`;
  } else if (s.type === 'gen') {
    b = `<div class="sn-grid g"><label>Forme <select class="sm" data-k="shape">${Object.entries(SHAPES).map(([k, l]) => `<option value="${k}"${s.shape === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Décalage <input type="number" class="sn-in" data-k="off" step="0.05" value="${s.off}"> V</label><label>Amplitude <input type="number" class="sn-in" data-k="amp" step="0.05" value="${s.amp}"> V</label>
      <label>Fréquence <input type="number" class="sn-in" data-k="freq" step="any" min="0" value="${s.freq}"> Hz</label></div>
      <canvas class="sn-wave" width="220" height="44" aria-hidden="true"></canvas>`;
  }
  return `<section class="mod sn" data-ch="${ch}">${head}<div class="mbody snb">${b}<div class="sn-read" id="snr-${ch}"></div></div></section>`;
}
function updateSensorsLive(force) {
  if ($('rp-sensors').hidden) return;
  const snap = hw.adc ? hw.adc.snapshot() : null; const t = now();
  const st = $('sn-stat');
  if (st && snap) {
    const chip = (ok, on, off) => `<span class="sn-c ${ok ? 'ok' : 'ko'}">${ok ? on : off}</span>`;
    const s = chip(snap.clockOn, 'horloge ADC ✓', 'horloge ADC coupée') + chip(snap.powered, 'alimenté ✓', 'non alimenté')
      + `<span class="sn-c">${snap.busy ? `SEQ${snap.cascaded ? '' : snap.busy.seq} en cours (voie ${snap.busy.ch})` : snap.pend1 || snap.pend2 ? 'séquence en attente' : 'au repos'}</span><span class="sn-c">${snap.convTotal} conversions</span>`;
    if (st._s !== s) { st._s = s; st.innerHTML = s; }
  }
  const sens = proj().sensors;
  for (let ch = 0; ch < 16; ch++) {
    const el = $('snr-' + ch); if (!el) continue;
    const s = sens[ch]; const v = sensorVoltOf(s, t); const n = expN(v); const lc = lastConv(ch);
    const out = v < 0 || v > (P.adc.vref || 3);
    const txt = `<span>V = <b>${fv(v)}</b> V</span><span>N attendu = <b>${n}</b> <i>0x${n.toString(16).toUpperCase().padStart(3, '0')}</i></span><span>dernière conversion : <b>${lc ? lc.n : '—'}</b>${lc ? ` <i>(RESULT${lc.slot})</i>` : ''}</span>${out ? '<span class="sn-warn">hors plage 0–3 V : saturation</span>' : ''}`;
    if (el._t !== txt) { el._t = txt; el.innerHTML = txt; }
    if (s.type === 'gen' && (force || !el._w)) { el._w = 1; drawWave(el.parentNode.querySelector('.sn-wave'), s); }
  }
}
function drawWave(cv, s) {
  if (!cv) return; const g = cv.getContext('2d'); const W = cv.width, H = cv.height;
  const css = getComputedStyle(document.documentElement);
  g.clearRect(0, 0, W, H); g.strokeStyle = css.getPropertyValue('--line').trim() || '#ccc'; g.lineWidth = 1;
  const y = v => H - 3 - (Math.max(-0.3, Math.min(3.6, v)) + 0.3) / 3.9 * (H - 6);
  g.setLineDash([3, 3]); [0, 3].forEach(v => { g.beginPath(); g.moveTo(0, y(v)); g.lineTo(W, y(v)); g.stroke(); }); g.setLineDash([]);
  g.strokeStyle = css.getPropertyValue('--accent').trim() || '#2F6FB5'; g.lineWidth = 1.6; g.beginPath();
  for (let i = 0; i <= W; i++) { const v = (+s.off) + (+s.amp) * wave(s.shape, 2 * i / W); i ? g.lineTo(i, y(v)) : g.moveTo(i, y(v)); }
  g.stroke();
}
function bindSensors() {
  const el = $('sensors');
  const onField = (e, final) => {
    const card = e.target.closest('.sn'); const k = e.target.dataset.k; if (!card || !k) return;
    const ch = +card.dataset.ch; const sens = proj().sensors; const s = sens[ch];
    if (k === 'type') {
      const t = e.target.value;
      if (t === 'none') sens[ch] = { type: 'none' };
      else { const pr = SENSOR_PRESETS().find(p => p[2].type === t); sens[ch] = JSON.parse(JSON.stringify(pr[2])); }
      sensSave(); renderSensors(); return;
    }
    let v = e.target.value;
    if (['v', 'x', 'a', 'b', 'xmin', 'xmax', 'off', 'amp', 'freq'].includes(k)) { v = Number(v); if (!Number.isFinite(v)) return; }
    s[k] = v;
    card.querySelectorAll(`[data-k="${k}"]`).forEach(o => { if (o !== e.target) o.value = String(v); });
    if (k === 'xmin' || k === 'xmax') { const r = card.querySelector('input[type=range][data-k="x"]'); if (r) { r.min = s.xmin; r.max = s.xmax; } }
    if (k === 'label' && final) { const l = card.querySelector('.sn-lab'); if (l) l.textContent = v; }
    if (s.type === 'gen') drawWave(card.querySelector('.sn-wave'), s);
    if (final && ['a', 'b', 'qty'].includes(k)) { const sm = card.querySelector('.sn-par summary'); if (sm) sm.textContent = `V = ${fnum(s.a)} × ${s.qty || 'x'} ${+s.b < 0 ? '−' : '+'} ${fnum(Math.abs(s.b))}`; }
    sensSave(); updateSensorsLive();
  };
  el.addEventListener('input', e => onField(e, false));
  el.addEventListener('change', e => {
    if (e.target.id === 'sn-all') { P.sensorsAll = e.target.checked; savePrefs(); renderSensors(); return; }
    if (e.target.id === 'sn-soca' || e.target.id === 'sn-socb') { const v = Math.max(1, Math.min(100000, Number(e.target.value) || 1000)); P.adc[e.target.id === 'sn-soca' ? 'socaHz' : 'socbHz'] = v; savePrefs(); applyPrefs(); return; }
    onField(e, true);
  });
  el.addEventListener('click', e => {
    if (e.target.id === 'sn-plug') {
      const ch = +$('sn-ch').value; const pr = SENSOR_PRESETS().find(p => p[0] === $('sn-preset').value);
      if (!pr || !Number.isFinite(ch)) return; proj().sensors[ch] = JSON.parse(JSON.stringify(pr[2])); sensSave(); renderSensors();
      toast(`${pr[1]} branché sur la voie ${ch} (${AdcSim.CH_NAME(ch)})`);
    }
    if (e.target.id === 'sn-defaults') { proj().sensors = defaultSensors(cur); sensSave(); renderSensors(); toast('Montage de départ rétabli'); }
    if (e.target.id === 'sn-extsoc') { const err = hw.adc.extSoc(); toast(err ? 'ADCSOC : ' + err : 'Impulsion ADCSOC envoyée : SEQ1 démarre'); }
  });
}

/* ====================== VUE « ADC » (en bas) ====================== */
let adcSig = '', adcBuilt = null;
const hex4 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(4, '0');
function buildAdcPane() {
  const pane = $('bp-adc');
  const pl = proj().plot || cur.plot || 'hist';
  pane.innerHTML = `<div class="adcv">
  <div class="adc-live" id="adc-live"></div>
  <section class="adc-plot"><header><b>Tracé</b>
    <select class="sm" id="adc-src" aria-label="Que tracer"><option value="hist">Historique des conversions</option><option value="var">Tableau du programme</option></select>
    <span id="adc-var-w"><input class="sn-in" id="adc-var" placeholder="nom du tableau" value="${esc(pl === 'hist' ? 'tab' : pl)}" aria-label="Nom du tableau à tracer"></span>
    <span id="adc-ch-w"><select class="sm" id="adc-ch" aria-label="Voie">${['toutes les voies', ...Array.from({ length: 16 }, (_, i) => `voie ${i} · ${AdcSim.CH_NAME(i)}`)].map((l, i) => `<option value="${i - 1}">${l}</option>`).join('')}</select></span>
    <span class="grow"></span><span class="hint" id="adc-plot-info"></span></header>
    <canvas id="adc-canvas" height="190" aria-label="Tracé des valeurs converties"></canvas></section>
  <details class="adc-calc"><summary><b>Calculatrice de quantification</b></summary>
    <div class="calc-in">
      <label>n (bits) <input type="number" class="sn-in" id="cq-n" value="12" min="1" max="24"></label>
      <label>V<sub>REF+</sub> (V) <input type="number" class="sn-in" id="cq-hi" value="3" step="any"></label>
      <label>V<sub>REF−</sub> (V) <input type="number" class="sn-in" id="cq-lo" value="0" step="any"></label>
      <label>V<sub>E</sub> (V) <input type="number" class="sn-in" id="cq-ve" value="1.5" step="any"></label>
      <label>Quantification <select class="sm" id="cq-mode"><option value="def">par défaut (troncature)</option><option value="cent">centrée (½ LSB)</option><option value="f28">formule F28335 : (2ⁿ − 1)·(V − V<sub>REF−</sub>)/PE</option></select></label>
      <label>ou capteur : V = a·x + b, a <input type="number" class="sn-in" id="cq-a" value="" step="any" placeholder="—"> b <input type="number" class="sn-in" id="cq-b" value="" step="any" placeholder="—"> x <input type="number" class="sn-in" id="cq-x" value="" step="any" placeholder="—"></label>
    </div><div class="calc-out" id="cq-out"></div></details>
  </div>`;
  $('adc-src').value = pl === 'hist' ? 'hist' : 'var';
  { const pc = proj().plotCh != null ? proj().plotCh : cur.plotCh; if (pc != null) $('adc-ch').value = String(pc); }
  const sync = () => { const v = $('adc-src').value === 'var'; $('adc-var-w').hidden = !v; $('adc-ch-w').hidden = v; proj().plot = v ? ($('adc-var').value.trim() || 'tab') : 'hist'; proj().plotCh = +$('adc-ch').value; saveLocal(); drawAdcPlot(true); };
  $('adc-src').addEventListener('change', sync); $('adc-var').addEventListener('change', sync); $('adc-ch').addEventListener('change', sync);
  ['cq-n', 'cq-hi', 'cq-lo', 'cq-ve', 'cq-mode', 'cq-a', 'cq-b', 'cq-x'].forEach(id => $(id).addEventListener('input', calcQ));
  sync(); calcQ();
  adcBuilt = cur.id;
}
function calcQ() {
  const n = Math.max(1, Math.min(24, Math.round(+$('cq-n').value || 12))), hi = +$('cq-hi').value, lo = +$('cq-lo').value, mode = $('cq-mode').value;
  let ve = +$('cq-ve').value; const a = $('cq-a').value, b = $('cq-b').value, x = $('cq-x').value;
  let line0 = '';
  if (a !== '' && b !== '' && x !== '') { ve = (+a) * (+x) + (+b); line0 = `<p>V<sub>E</sub> = a·x + b = ${fnum(+a)} × ${fnum(+x)} ${+b < 0 ? '−' : '+'} ${fnum(Math.abs(+b))} = <b>${fv(ve, 4)} V</b></p>`; }
  const PE = hi - lo; if (!(PE > 0)) { $('cq-out').innerHTML = '<p class="sn-warn">Il faut V<sub>REF+</sub> &gt; V<sub>REF−</sub>.</p>'; return; }
  const M2 = 2 ** n, q = PE / M2;
  let N, how;
  if (mode === 'f28') { N = Math.round((M2 - 1) * (ve - lo) / PE); how = `N = (2<sup>n</sup> − 1) × (V<sub>E</sub> − V<sub>REF−</sub>) / PE = ${M2 - 1} × ${fv(ve - lo, 4)} / ${fnum(PE)} = ${fv((M2 - 1) * (ve - lo) / PE, 3)} → arrondi`; }
  else if (mode === 'cent') { N = Math.floor((ve - lo) / q + 0.5); how = `N = ⌊(V<sub>E</sub> − V<sub>REF−</sub>) / q + ½⌋ = ⌊${fv((ve - lo) / q, 3)} + 0,5⌋`; }
  else { N = Math.floor((ve - lo) / q); how = `N = ⌊(V<sub>E</sub> − V<sub>REF−</sub>) / q⌋ = ⌊${fv((ve - lo) / q, 3)}⌋`; }
  const sat = N < 0 || N > M2 - 1; N = Math.max(0, Math.min(M2 - 1, N));
  const bin = N.toString(2).padStart(n, '0').replace(/(\d)(?=(\d{4})+$)/g, '$1 ');
  $('cq-out').innerHTML = `${line0}
  <p>PE = V<sub>REF+</sub> − V<sub>REF−</sub> = <b>${fnum(PE)} V</b> · 2<sup>n</sup> = ${M2} codes (0 à ${M2 - 1})</p>
  <p>q = PE / 2<sup>n</sup> = <b>${q < 0.001 ? (q * 1000).toPrecision(4).replace('.', ',') + ' mV' : fv(q, 5) + ' V'}</b> · résolution ℜ = 1 / 2<sup>n</sup> = ${(100 / M2).toPrecision(3).replace('.', ',')} %</p>
  <p>${how} = <b>${N}</b>${sat ? ' <span class="sn-warn">(saturé : V<sub>E</sub> hors plage)</span>' : ''}</p>
  <p class="calc-res">N<sub>(10)</sub> = <b>${N}</b> · N<sub>(2)</sub> = <b>${bin}</b> · N<sub>(16)</sub> = <b>0x${N.toString(16).toUpperCase()}</b>${n === 12 ? ` · ADCRESULTx = N × 16 = <b>${hex4(N * 16)}</b>` : ''}</p>
  <p class="hint">Tension correspondant à N : N × q + V<sub>REF−</sub> = ${fv(N * q + lo, 4)} V · q : plus petite variation de V<sub>E</sub> qui fait passer N à N + 1 ; PE : tension de pleine échelle ; n : nombre de bits.</p>`;
}
function renderAdc(force) {
  if (bottomTab !== 'adc' && !force) return;
  if (adcBuilt !== cur.id || !$('adc-live')) buildAdcPane();
  const a = hw.adc.snapshot();
  const R = AdcSim.REG; const fld = (reg) => R[reg].fields.map(f => { const v = (a.regs[reg] >> f.lo) & ((1 << f.w) - 1); return `<span class="fd${v ? ' on' : ''}" title="${esc(f.desc)}">${f.name}=${v}</span>`; }).join('');
  const chip = (ok, on, off, why) => `<span class="sn-c ${ok ? 'ok' : 'ko'}" title="${esc(why || '')}">${ok ? on : off}</span>`;
  let h = `<div class="adc-chips">${chip(a.clockOn, 'Horloge ADCENCLK ✓', 'Horloge ADCENCLK = 0', 'SysCtrlRegs.PCLKCR0.bit.ADCENCLK')}${chip(a.powered, 'Alimenté ✓', 'Non alimenté', 'InitAdc() / initADC() ou ADCTRL3')}
    <span class="sn-c">${a.cascaded ? 'Cascadé (SEQ, 16 voies)' : 'Double séquenceur (SEQ1 + SEQ2)'}</span><span class="sn-c">${a.contRun ? 'Continu' : 'Start-stop'}</span>
    <span class="sn-c" title="ADCCLK = HSPCLK / (2 × ADCCLKPS), divisé par 2 si CPS = 1 ; HSPCLK = 75 MHz">ADCCLK ${fnum(Math.round(a.adcclk * 1000) / 1000)} MHz · ${fnum(Math.round(a.tConv * 1000) / 1000)} µs / conversion</span>
    <span class="sn-c">${a.seqCount} séquence${a.seqCount > 1 ? 's' : ''} · ${a.convTotal} conversion${a.convTotal > 1 ? 's' : ''}</span>
    ${a.busy ? `<span class="sn-c run">SEQ${a.cascaded ? '' : a.busy.seq} en cours</span>` : ''}${a.int1 ? '<span class="sn-c">INT_SEQ1 = 1</span>' : ''}${a.int2 ? '<span class="sn-c">INT_SEQ2 = 1</span>' : ''}</div>`;
  const seqTable = (title, order, ptr) => `<table class="grid adc-seq"><thead><tr><th colspan="7">${title}</th></tr><tr><th>n°</th><th>CONVxx</th><th>Voie</th><th>RESULTx</th><th>Brut (justifié à gauche)</th><th>N = brut &gt;&gt; 4</th><th>≈ tension</th></tr></thead><tbody>${order.map((o, i) => { const raw = (a.res[o.slot] << 4) & 0xFFF0; return `<tr${o.slot === ptr ? ' class="ptr"' : ''}><td class="mono">${i}</td><td class="mono">CONV${String(o.slot).padStart(2, '0')}</td><td class="mono">${o.ch} · ${AdcSim.CH_NAME(o.ch)}</td><td class="mono">RESULT${o.slot}</td><td class="mono">${hex4(raw)}</td><td class="mono"><b>${a.res[o.slot]}</b></td><td class="mono">${fv(a.res[o.slot] * (P.adc.vref || 3) / 4095)} V</td></tr>`; }).join('')}</tbody></table>`;
  h += `<div class="adc-cols"><div>${a.cascaded ? seqTable(`Séquence SEQ (cascadé) · ${a.count1} conversion${a.count1 > 1 ? 's' : ''} · ▸ = prochaine position (CONV${String(a.ptr1).padStart(2, '0')})`, a.order1, a.ptr1)
      : seqTable(`SEQ1 · ${a.count1} conversion${a.count1 > 1 ? 's' : ''} · ▸ = prochaine (CONV${String(a.ptr1).padStart(2, '0')})`, a.order1, a.ptr1) + seqTable(`SEQ2 · ${a.count2} conversion${a.count2 > 1 ? 's' : ''} · ▸ = prochaine (CONV${String(a.ptr2).padStart(2, '0')})`, a.order2, a.ptr2)}
    <p class="hint pad">RESULTx contient N × 16 (12 bits justifiés à gauche) : lis <code>AdcRegs.ADCRESULTx &gt;&gt; 4</code>, ou directement <code>AdcMirror.ADCRESULTx</code>.</p></div>
    <div><table class="grid adc-regs"><thead><tr><th>Registre</th><th>Hexa</th><th>Champs</th></tr></thead><tbody>
    <tr><td class="mono">PCLKCR0</td><td class="mono">${hex4(a.pclk)}</td><td class="fds"><span class="fd${a.clockOn ? ' on' : ''}">ADCENCLK=${a.clockOn ? 1 : 0}</span></td></tr>
    ${['ADCTRL1', 'ADCTRL2', 'ADCTRL3', 'ADCMAXCONV', 'ADCCHSELSEQ1', 'ADCCHSELSEQ2', 'ADCCHSELSEQ3', 'ADCCHSELSEQ4', 'ADCST', 'ADCASEQSR'].map(r => `<tr><td class="mono">${r}</td><td class="mono">${hex4(a.regs[r])}</td><td class="fds">${fld(r)}</td></tr>`).join('')}
    </tbody></table></div></div>`;
  if (h !== adcSig) { adcSig = h; $('adc-live').innerHTML = h; }
  drawAdcPlot();
}
let plotSig = '';
function drawAdcPlot(force) {
  const cv = $('adc-canvas'); if (!cv) return;
  const src = $('adc-src').value; let data = [], label = '', info = '';
  if (src === 'var') {
    const name = $('adc-var').value.trim();
    const g = prog && progEx === cur.id ? prog.globals.find(x => x.name === name) : null;
    if (!g) info = prog && progEx === cur.id ? `« ${name} » n'est pas une variable globale du programme chargé` : 'lance le programme pour tracer un tableau';
    else { let v = M.G[g.key]; if (Array.isArray(v) && Array.isArray(v[0])) v = v.flat(); data = Array.isArray(v) ? v.map(Number) : [Number(v)]; label = name; info = `${name}[${data.length}] · min ${Math.min(...data)} · max ${Math.max(...data)}`; }
  } else {
    const chSel = +$('adc-ch').value; const H = hw.adc.history.filter(x => chSel < 0 || x.ch === chSel).slice(-400);
    data = H.map(x => x.n); label = chSel < 0 ? 'toutes voies' : 'voie ' + chSel; info = H.length ? `${H.length} dernières conversions${chSel < 0 ? '' : ' de la voie ' + chSel}` : 'aucune conversion pour l\'instant';
    if (chSel >= 0 && H.length >= 3) { const Te = (H[H.length - 1].t - H[0].t) / (H.length - 1); if (Te > 0) info += ` · période moyenne ${fnum(Te < 10 ? Te.toFixed(2) : Te.toFixed(1))} µs (Fe ≈ ${fnum((1000 / Te).toFixed(Te < 100 ? 2 : 3))} kHz)`; }
  }
  const sig = src + info + data.length + (data.length ? data[0] + ',' + data[data.length - 1] + ',' + data[data.length >> 1] : '') + cv.clientWidth + P.theme;
  if (!force && sig === plotSig) return; plotSig = sig;
  $('adc-plot-info').textContent = info;
  const W = Math.max(200, cv.clientWidth || 600), Hh = cv.height; if (cv.width !== W) cv.width = W;
  const g = cv.getContext('2d'); const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink-2').trim() || '#555', line = css.getPropertyValue('--line-2').trim() || '#ddd', acc = css.getPropertyValue('--accent').trim() || '#2F6FB5';
  g.clearRect(0, 0, W, Hh);
  const L = 40, Rr = 8, T = 8, B = 20; const pw = W - L - Rr, ph = Hh - T - B;
  let ymax = data.length ? Math.max(4095, ...data) : 4095; const y = v => T + ph - (v / ymax) * ph;
  g.font = '11px ' + (css.getPropertyValue('--f-ui') || 'sans-serif'); g.fillStyle = ink; g.strokeStyle = line; g.lineWidth = 1;
  for (const v of [0, 1024, 2048, 3072, 4095]) { g.beginPath(); g.moveTo(L, y(v)); g.lineTo(W - Rr, y(v)); g.stroke(); g.fillText(String(v), 4, y(v) + 4); }
  if (ymax > 4095) { g.fillStyle = css.getPropertyValue('--err').trim() || '#C4291C'; g.fillText(`max ${ymax} > 4095 : oubli de >> 4 ?`, L + 6, T + 12); g.fillStyle = ink; }
  if (!data.length) { g.fillText(info, L + 8, T + ph / 2); return; }
  const x = i => L + (data.length === 1 ? pw / 2 : i * pw / (data.length - 1));
  g.fillText('0', L - 2, Hh - 5); g.fillText(String(data.length - 1), W - Rr - 24, Hh - 5);
  g.strokeStyle = acc; g.lineWidth = 1.5; g.beginPath();
  data.forEach((v, i) => i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v))); g.stroke();
  if (data.length <= 64) { g.fillStyle = acc; data.forEach((v, i) => { g.beginPath(); g.arc(x(i), y(v), 2.2, 0, 7); g.fill(); }); }
}

/* ====================== AIDES ADC (console) ====================== */
let lintedProg = null;
function adcHints() {
  if (!prog || lintedProg === prog || !P.hints) return; lintedProg = prog;
  const code = prog.files.filter(f => /\.c$/i.test(f.name)).map(f => f.code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ' ')).join('\n');
  if (!/AdcRegs/.test(code)) return;
  if (/=\s*AdcRegs\s*\.\s*ADCRESULT\d+\s*;/.test(code)) log('info', 'Astuce ADC : une ligne range AdcRegs.ADCRESULTx sans décalage. Le résultat est justifié à gauche (N × 16) : écris « AdcRegs.ADCRESULTx >> 4 » ou lis AdcMirror.ADCRESULTx.');
  if (/SOC_SEQ1\s*=\s*1/.test(code) && !/RST_SEQ1|ADCTRL2\s*\.\s*all/.test(code) && !/CONT_RUN\s*=\s*1/.test(code)) log('info', 'Astuce ADC : SOC_SEQ1 sans RST_SEQ1. En start-stop, chaque nouvelle séquence repart de là où la précédente s\'est arrêtée (CONV02, CONV03…) : remets le séquenceur au début avec AdcRegs.ADCTRL2.bit.RST_SEQ1 = 1 avant chaque SOC.');
  if (!/ADCENCLK|PCLKCR0/.test(code) && !P.adc.clockFromInit) log('info', 'Astuce ADC : l\'horloge de l\'ADC n\'est jamais activée (étape 1 : EALLOW; SysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1; EDIS;). Sans elle, le module ne répond pas.');
}

/* ====================== VÉRIFICATION AUTOMATIQUE (projets qui en définissent une) ====================== */
async function verifyExercise() {
  if (!cur.verify) return;
  if (!prog || progEx !== cur.id || !M) { dialog({ title: 'Vérifier mon programme', cancelLabel: 'Fermer', body: '<p>Compile et lance d\'abord ton programme (Debug F11 puis Resume F8, ou Ctrl+Entrée), laisse-le tourner un instant, puis clique de nouveau sur « Vérifier ».</p>' }); return; }
  if (progStale) toast('Attention : le code a changé depuis la compilation, la vérification porte sur l\'ancienne version');
  const running = M.state === 'running';
  const findG = name => prog.globals.find(g => g.name === name);
  const srcAll = prog.files.map(f => f.code).join('\n');
  const ctx = {
    running, tol: P.verifyTol + 3 * (P.adc.noiseLsb || 0),
    G: name => { const g = findG(name); return g ? M.G[g.key] : undefined; },
    arrays: () => prog.globals.filter(g => Array.isArray(M.G[g.key])).map(g => ({ name: g.name, len: M.G[g.key].length })),
    adc: hw.adc.snapshot(),
    field: (reg, f) => { const F = AdcSim.fieldOf(AdcSim.REG[reg], f); const v = hw.adc.snapshot().regs[reg]; return (v >> F.lo) & ((1 << F.w) - 1); },
    V: ch => sensorVolt(ch, now()), N: v => expN(v),
    getX: ch => { const s = proj().sensors[ch]; return s.type === 'lin' ? +s.x : s.type === 'pot' ? +s.v : NaN; },
    setX: (ch, x) => { const s = proj().sensors[ch]; if (s.type === 'lin') s.x = x; else if (s.type === 'pot') s.v = x; renderSensors(); },
    wait: ms => new Promise(r => setTimeout(r, ms)), gpio: n => hw.level(n),
    define: name => { const m = new RegExp('#\\s*define\\s+' + name + '\\s+\\(?\\s*(-?(?:0x[0-9a-f]+|\\d+))', 'i').exec(srcAll); return m ? Number(m[1]) : null; }
  };
  toast('Vérification en cours…');
  let res;
  try { res = await cur.verify(ctx); } catch (e) { res = [{ ok: false, msg: 'Vérification impossible : ' + (e && e.message ? e.message : e) }]; }
  const nOk = res.filter(r => r.ok === true).length, nKo = res.filter(r => r.ok === false).length;
  const icon = r => r.ok === true ? '<b class="vf ok">✓</b>' : r.ok === false ? '<b class="vf ko">✕</b>' : '<b class="vf in">i</b>';
  dialog({ title: `Vérification : ${cur.tab}`, cancelLabel: 'Fermer', wide: true,
    body: `<p class="vf-sum ${nKo ? 'ko' : 'ok'}">${nKo ? `${nKo} point${nKo > 1 ? 's' : ''} à corriger, ${nOk} correct${nOk > 1 ? 's' : ''}` : `Tout est correct (${nOk} points vérifiés)`}</p>
    <ul class="vf-list">${res.map(r => `<li>${icon(r)}<span>${esc(r.msg)}</span></li>`).join('')}</ul>
    <p class="hint">${running ? 'Programme en cours d\'exécution.' : 'Programme ' + ({ suspended: 'suspendu', finished: 'terminé', terminated: 'arrêté', error: 'en erreur', loaded: 'chargé mais pas lancé' }[M.state] || M.state) + '.'} Tolérance : ± ${ctx.tol} sur N.</p>` });
  log(nKo ? 'warn' : 'ok', `Vérification ${cur.tab} : ${nKo ? nKo + ' point(s) à corriger' : 'tout est correct'}.`);
}

/* ====================== MODULE MOTEUR ====================== */
let motAng = 0, motLast = 0;
function motorHTML() {
  return `<section class="mod"><header>Moteur commandé par A0<span class="grow"></span><span class="chip">GPIO0</span></header><div class="mbody">
  <svg viewBox="0 0 120 120" width="120" height="120" aria-label="Moteur"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="3"/><g id="mot-rot"><path d="M60 14 L68 60 L60 106 L52 60 Z" fill="#2F6FB5"/><path d="M14 60 L60 52 L106 60 L60 68 Z" fill="#7DA6D8"/></g><circle cx="60" cy="60" r="7" fill="currentColor"/><text x="60" y="64" text-anchor="middle" font-size="9" fill="#FFF" font-family="Arial">M</text></svg>
  <div class="wires"><span>A0 (GPIO0)</span><span id="mot-a0" class="lvl">Z</span><span></span><span>Moteur</span><span id="mot-st" class="lvl">arrêté</span><span></span><span>Imot</span><span id="mot-i" class="lvl">—</span><span></span></div>
  <p class="keyhint">Règle le courant avec le curseur Imot de l'onglet « Capteurs ADC » (voie 1). Le moteur tourne tant que A0 est une sortie à 1.</p></div></section>`;
}
function updateMotor() {
  const on = hw.mux[0] === 0 && hw.dir[0] === 1 && hw.lat[0] === 1;
  const t = performance.now(); const dt = Math.min(100, t - (motLast || t)); motLast = t;
  if (on) { motAng = (motAng + dt * 0.6) % 360; const g = $('mot-rot'); if (g) g.setAttribute('transform', `rotate(${motAng} 60 60)`); }
  const st = $('mot-st'); if (st && st._v !== on) { st._v = on; st.textContent = on ? 'en marche' : 'arrêté'; st.className = 'lvl' + (on ? ' h' : ''); }
  const a0 = $('mot-a0'); const lv = hw.level(0); if (a0 && a0._v !== lv) { a0._v = lv; a0.textContent = lvlTxt(lv); a0.className = lvlCls(lv); }
  const s = proj().sensors[1]; const mi = $('mot-i'); if (mi) { const txt = s && s.type === 'lin' ? `${fnum(s.x)} ${s.unit || ''}` : '—'; if (mi._v !== txt) { mi._v = txt; mi.textContent = txt; } }
}

/* ====================== AIDE-MÉMOIRE ADC ====================== */
function helpAdc() {
  dialog({ title: 'Aide-mémoire : module ADC du F28335', cancelLabel: 'Fermer', wide: true, body: `<div class="help">
  <p><b>Conversion</b> : 12 bits, 0 à 3 V (VREFLO = 0 V, VREFHI = 3 V). <code>N = 4095 × V / 3</code> ; quantum q = 3 V / 4096 ≈ 0,73 mV. RESULTx contient N × 16 (justifié à gauche) : <code>N = AdcRegs.ADCRESULTx &gt;&gt; 4</code>, ou <code>AdcMirror.ADCRESULTx</code>.</p>
  <table><tr><th>Étape</th><th>Code</th></tr>
  <tr><td>1. Horloge</td><td><code>EALLOW; SysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1; EDIS;</code></td></tr>
  <tr><td>2. Reset</td><td><code>AdcRegs.ADCTRL1.bit.RESET = 1; asm(" NOP");</code></td></tr>
  <tr><td>3. Calibration</td><td><code>initADC();</code> (InitAdc() chez TI)</td></tr>
  <tr><td>4. Architecture et mode</td><td><code>ADCTRL1</code> : SEQ_CASC (b4), SEQ_OVRD (b5), CONT_RUN (b6), CPS (b7), ACQ_PS (b11-8), SUSMOD (b13-12)</td></tr>
  <tr><td>5. Nombre de conversions</td><td><code>ADCMAXCONV.bit.MAX_CONV1 = N − 1</code> (SEQ ou SEQ1), <code>MAX_CONV2</code> (SEQ2)</td></tr>
  <tr><td>6. Ordre des voies</td><td><code>ADCCHSELSEQ1.bit.CONV00 = voie</code> … CONV15 (SEQ2 : CONV08 à CONV15)</td></tr>
  <tr><td>7. Lancement</td><td><code>ADCTRL2.bit.RST_SEQ1 = 1; ADCTRL2.bit.SOC_SEQ1 = 1;</code></td></tr>
  <tr><td>Fin de séquence</td><td><code>while (AdcRegs.ADCST.bit.SEQ1_BSY == 1);</code> ou drapeau <code>INT_SEQ1</code> (effacé par <code>INT_SEQ1_CLR = 1</code>)</td></tr>
  <tr><td>8. Interruption</td><td><code>ADCTRL2</code> : INT_ENA_SEQ1 (b11), INT_MOD_SEQ1 (b10) ; SEQ2 : b3, b2</td></tr></table>
  <p><b>Cascadé</b> (SEQ_CASC = 1) : un séquenceur de 16 conversions, résultats dans RESULT0, RESULT1… dans l'ordre des conversions. <b>Double séquenceur</b> (0) : SEQ1 = CONV00–07 → RESULT0–7, SEQ2 = CONV08–15 → RESULT8–15.</p>
  <p><b>Start-stop</b> (CONT_RUN = 0) : une séquence par déclenchement ; sans RST_SEQ1, la suivante continue à CONV(N). <b>Continu</b> (1) : la séquence recommence seule.</p>
  <p><b>Dans le simulateur</b> : les interruptions (PIE, routine d'interruption) et les timers ePWM ne sont pas exécutés ; les drapeaux INT_SEQx, SEQx_BSY et les déclenchements SOCA/SOCB/ADCSOC le sont.</p></div>` });
}
function helpExt() {
  dialog({ title: 'L\'extension Simulateur DSP F28335', cancelLabel: 'Fermer', wide: true, body: `<div class="help">
  <p><b>Ouvrir</b> : clic sur l'icône de l'extension (ou Alt+Maj+D). Clic droit sur l'icône : ouvrir dans un onglet ou dans le panneau latéral. Le choix par défaut se règle dans Préférences ▸ Interface.</p>
  <p><b>Tes projets</b> sont enregistrés automatiquement dans l'extension, sur ce PC (Préférences ▸ Données pour les exporter ou les importer). Désinstaller l'extension efface tout : exporte avant.</p>
  <p><b>Autocomplétion</b> : Ctrl+Espace ouvre la liste ; Ctrl+Maj+Espace l'active ou la désactive ; le bouton en bas à droite aussi. Réglages fins dans Préférences ▸ Éditeur.</p>
  <p><b>Capteurs</b> : onglet « Capteurs ADC » à droite, un capteur par voie.</p>
  <p>Ce simulateur sert à s'entraîner : il ne programme pas la carte et n'implémente qu'une partie du C et du F28335. Vérifie toujours sur la vraie carte.</p></div>` });
}

/* potentiomètres VR1 / VR2 de la carte (ADCINA0 / ADCINA1) */
const VR_Y = [150, 206];
function vrPot(i, make) {
  const sens = proj().sensors; let s = sens[i];
  if (s.type !== 'pot' && make) { sens[i] = s = { type: 'pot', label: `VR${i + 1}`, v: 1.5 }; sensSave(); toast(`VR${i + 1} branché sur ADCINA${i} (onglet Capteurs ADC)`); }
  return s.type === 'pot' ? s : null;
}
function bindVR() {
  document.querySelectorAll('.vr').forEach(g => {
    const i = +g.dataset.vr;
    const turn = d => { const s = vrPot(i, true); s.v = Math.max(0, Math.min(3.3, Math.round((+s.v + d) * 1000) / 1000)); sensSave(); renderSensors(); updateSensorsLive(); };
    g.addEventListener('click', () => { vrPot(i, true); showRight('sensors'); const c = document.querySelector(`.sn[data-ch="${i}"]`); if (c) c.scrollIntoView({ block: 'nearest' }); });
    g.addEventListener('wheel', e => { e.preventDefault(); turn(e.deltaY < 0 ? 0.05 : -0.05); }, { passive: false });
    g.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); turn(0.05); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); turn(-0.05); } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new Event('click')); } });
  });
}
function updateVR() {
  for (let i = 0; i < 2; i++) {
    const el = $('vr-ind-' + i); if (!el) continue; const s = proj().sensors[i];
    const ang = s.type === 'pot' ? Math.round(-135 + 270 * Math.max(0, Math.min(3.3, +s.v)) / 3.3) : 35;
    if (el._a !== ang) { el._a = ang; el.setAttribute('transform', `rotate(${ang} 563 ${VR_Y[i] + 15})`); }
  }
}

/* ---------- séparateurs redimensionnables ---------- */
function dragger(el, onMove) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    const mv = ev => onMove(ev); const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); saveLocal(); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  });
}
const rootStyle = document.documentElement.style;
if (S.ui.rightW) rootStyle.setProperty('--rightW', S.ui.rightW + 'px');
if (S.ui.bottomH) rootStyle.setProperty('--bottomH', S.ui.bottomH + 'px');
dragger($('vsplit'), e => { const w = Math.max(320, Math.min(window.innerWidth - 560, window.innerWidth - e.clientX)); rootStyle.setProperty('--rightW', w + 'px'); S.ui.rightW = w; });
dragger($('hsplit'), e => { const r = document.querySelector('.center').getBoundingClientRect(); const h = Math.max(120, Math.min(r.height - 140, r.bottom - e.clientY)); rootStyle.setProperty('--bottomH', h + 'px'); S.ui.bottomH = h; });

/* ---------- démarrage ---------- */
$('boardwrap').innerHTML = boardSVG();
bindBoard(); bindVR();
if (S.ui.nogp) { $('gpvis').checked = false; $('boardsvg').classList.add('nogp'); }
hw.reset(); hw.clearLogs(0);
renderExTabs(); renderTree(); renderFileTabs(); loadEditorText();
applyHighlights(); renderModules(); resetModules(); scopeConfig();
setEnonce();
setPersp(persp); showBottom(bottomTab); renderProblems(); updateToolbar(); updateStatus(); renderDebug();
{
  const ac = document.createElement('button'); ac.id = 'st-ac'; ac.className = 'st-ac'; ac.title = 'Activer / désactiver l\'autocomplétion (Ctrl+Maj+Espace)';
  ac.addEventListener('click', toggleAc); $('st-save').before(ac);
  $('tb-prefs').addEventListener('click', prefsDlg);
  $('tb-speed').addEventListener('change', e => { P.speed = Number(e.target.value) || 1; savePrefs(); applyPrefs(); toast(`Vitesse du temps simulé : × ${fr(P.speed)}`); });
  bindSensors(); applyPrefs(); showRight(cur.right || 'board');
  BRIDGE.on('external', () => warnOnce('external', 'Le simulateur est ouvert à deux endroits (onglet et panneau latéral, ou deux onglets) : les deux enregistrent tes projets et peuvent s\'écraser. Ferme l\'un des deux.', 'warn'));
  BRIDGE.on('prefs', m => { const np = readPrefs(m.prefs); for (const k of Object.keys(np)) P[k] = np[k]; applyPrefs(); renderSensors(); });
}
log('info', 'Simulateur prêt. Choisis un projet en haut, écris ton code, puis Debug (F11) ou Resume (F8).', { not: true });
log('info', 'Capteurs à droite (onglet Capteurs ADC), registres et tracé en bas (onglet ADC). Autocomplétion : Ctrl+Espace ; Ctrl+Maj+Espace pour l\'activer ou la désactiver.', { not: true });
log('info', 'Câblage de la carte : LD1 = GPIO9, LD2 = GPIO11, LD3 = GPIO34, LD4 = GPIO49, PB1 = GPIO17, PB2 = GPIO48, roue codeuse SW2 = GPIO12 à 15.', { not: true });
setSave('local');
initCloud();
requestAnimationFrame(frame);
})();

