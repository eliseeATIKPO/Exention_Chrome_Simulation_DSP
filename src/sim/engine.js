/* ==========================================================================
   MOTEUR DU SIMULATEUR
   Préprocesseur C, compilateur C -> JavaScript (générateurs), cible
   TMS320F28335 simulée (GPIO), horloge virtuelle, points d'arrêt, pas à pas.
   Sur C28x : int = 16 bits, long = 32 bits, char = 16 bits.
   ========================================================================== */
const Sim = (() => {
"use strict";

/* ---------------- Types ---------------- */
const IT = (bits, u, name) => ({ k: 'int', bits, u, name });
const T = {
  void: { k: 'void', name: 'void' },
  i16: IT(16, false, 'int'), u16: IT(16, true, 'unsigned int'),
  i32: IT(32, false, 'long'), u32: IT(32, true, 'unsigned long'),
  i64: IT(64, false, 'long long'), u64: IT(64, true, 'unsigned long long'),
  f32: { k: 'float', name: 'float' }
};
const named = (t, name) => Object.assign({}, t, { name });
const TYPEDEFS = {
  Uint16: named(T.u16, 'Uint16'), Uint8: named(T.u16, 'Uint8'), Uint32: named(T.u32, 'Uint32'), Uint64: named(T.u64, 'Uint64'),
  int16: named(T.i16, 'int16'), int32: named(T.i32, 'int32'), int64: named(T.i64, 'int64'),
  Int16: named(T.i16, 'Int16'), Int32: named(T.i32, 'Int32'),
  float32: named(T.f32, 'float32'), float64: named(T.f32, 'float64'),
  bool: named(T.u16, 'bool'), _Bool: named(T.u16, '_Bool'),
  uint16_t: named(T.u16, 'uint16_t'), uint8_t: named(T.u16, 'uint8_t'), uint32_t: named(T.u32, 'uint32_t'), uint64_t: named(T.u64, 'uint64_t'),
  int16_t: named(T.i16, 'int16_t'), int32_t: named(T.i32, 'int32_t'), int64_t: named(T.i64, 'int64_t')
};
const BASEWORDS = new Set(['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned']);
const QUALS = new Set(['const', 'volatile', 'static', 'extern', 'register', 'auto', 'inline', 'interrupt', '__interrupt', 'far', '__far', 'near', 'cregister']);
const KEYWORDS = new Set(['if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'sizeof', 'struct', 'union', 'enum', 'typedef', ...BASEWORDS, ...QUALS]);
const STMT_BUILTINS = new Set(['EALLOW', 'EDIS', 'DINT', 'EINT', 'ERTM', 'DRTM', 'ESTOP0']);
const LIB_FUNCS = new Set(['InitSysCtrl', 'InitGpio', 'InitPieCtrl', 'InitPieVectTable', 'InitFlash', 'InitCpuTimers', 'InitAdc', 'DisableDog', 'InitPeripheralClocks', 'InitPll', 'InitXintf', 'InitXintf16Gpio', 'InitECap', 'InitEPwm', 'InitSci', 'InitSpi', 'InitI2C', 'ServiceDog', 'MemCopy', 'ConfigCpuTimer', 'initADC', 'InitADC', 'ADC_cal']);
const GPIO_BASES = new Set(['GpioCtrlRegs', 'GpioDataRegs']);
const GENERIC_BASES = new Set(['SysCtrlRegs', 'PieCtrlRegs', 'PieVectTable', 'CpuTimer0Regs', 'CpuTimer1Regs', 'CpuTimer2Regs', 'CpuTimer0', 'CpuTimer1', 'CpuTimer2', 'AdcRegs', 'AdcMirror', 'EPwm1Regs', 'EPwm2Regs', 'EPwm3Regs', 'EPwm4Regs', 'EPwm5Regs', 'EPwm6Regs', 'ECap1Regs', 'ECap2Regs', 'ECap3Regs', 'ECap4Regs', 'ECap5Regs', 'ECap6Regs', 'EQep1Regs', 'EQep2Regs', 'XIntruptRegs', 'GpioIntRegs', 'SciaRegs', 'ScibRegs', 'ScicRegs', 'SpiaRegs', 'I2caRegs', 'ECanaRegs', 'ECanbRegs', 'McbspaRegs', 'McbspbRegs', 'DmaRegs', 'FlashRegs', 'CsmRegs', 'XintfRegs', 'DevEmuRegs']);
const isArith = t => t.k === 'int' || t.k === 'float';
const sameT = (a, b) => a.k === b.k && (a.k !== 'int' || (a.bits === b.bits && a.u === b.u));

function usual(a, b) {
  if (a.k === 'float' || b.k === 'float') return T.f32;
  if (a.bits === b.bits) return (a.u || b.u) ? (a.bits === 16 ? T.u16 : a.bits === 32 ? T.u32 : T.u64) : (a.bits === 16 ? T.i16 : a.bits === 32 ? T.i32 : T.i64);
  return a.bits > b.bits ? a : b;
}
function wrapC(t, c) {
  if (t.k !== 'int') return c;
  if (t.bits === 16) return t.u ? `((${c})&65535)` : `(((${c})<<16)>>16)`;
  if (t.bits === 32) return t.u ? `((${c})>>>0)` : `((${c})|0)`;
  return `__w64(${c},${t.u ? 1 : 0})`;
}
function wrapVal(t, v) {
  if (t.k === 'float') return v;
  if (t.k !== 'int') return v;
  if (t.bits === 16) return t.u ? (v & 65535) : ((v << 16) >> 16);
  if (t.bits === 32) return t.u ? (v >>> 0) : (v | 0);
  return w64(v, t.u);
}
function w64(v, u) { v = Math.trunc(Number(v)); if (!isFinite(v)) return 0; if (u && v < 0) v += 18446744073709551616; return v; }
function conv(e, to) {
  if (to.k === 'float' || to.k !== 'int') return e.c;
  if (e.t.k === 'int' && e.t.bits === to.bits && e.t.u === to.u) return e.c;
  if (e.lit) return String(wrapVal(to, e.v));
  return wrapC(to, e.c);
}
function sizeOf(t) {
  if (t.k === 'arr') return (t.n || 0) * sizeOf(t.elem);
  if (t.k === 'float') return 2;
  if (t.k === 'int') return t.bits / 16;
  return 1;
}
function typeStr(t) {
  if (t.k === 'arr') { let dims = '', b = t; while (b.k === 'arr') { dims += `[${b.n == null ? '' : b.n}]`; b = b.elem; } return b.name + dims; }
  return t.name;
}

/* ---------------- Erreurs ---------------- */
class CErr extends Error {
  constructor(fr, at, opt = {}) {
    super(fr); this.fr = fr; this.line = (at && at.line) || 0; this.file = (at && at.file) || '';
    this.ccs = opt.ccs || null; this.code = opt.code || null;
  }
}
class RunErr extends Error { constructor(fr) { super(fr); this.fr = fr; } }
const shown = tk => tk.t === 'eof' ? 'fin du fichier' : tk.t === 'str' ? `"${tk.v}"` : tk.t === 'chr' ? `'${tk.v}'` : tk.v;

/* ---------------- GPIO : registres ---------------- */
const PORTS = { A: [0, 31], B: [32, 63], C: [64, 87] };
const portOf = n => n <= 31 ? 'A' : n <= 63 ? 'B' : 'C';
const REGS = [], REGIDX = {};
function addReg(group, P, kind) {
  const [b, e] = PORTS[P]; let lo = b, hi = e, w = 1, field = null;
  if (/^(MUX|QSEL)[12]$/.test(kind)) { lo = b + (kind.endsWith('2') ? 16 : 0); hi = Math.min(lo + 15, e); w = 2; field = kind.startsWith('MUX') ? 'mux' : 'qsel'; }
  else if (kind === 'DIR') field = 'dir'; else if (kind === 'PUD') field = 'pud';
  const r = { id: REGS.length, name: `GP${P}${kind}`, group, P, kind, lo, hi, w, field };
  REGS.push(r); REGIDX[r.name] = r;
}
for (const P of ['A', 'B', 'C']) {
  for (const k of (P === 'C' ? ['MUX1', 'MUX2', 'DIR', 'PUD'] : ['MUX1', 'MUX2', 'DIR', 'PUD', 'QSEL1', 'QSEL2', 'CTRL'])) addReg('ctrl', P, k);
  for (const k of ['DAT', 'SET', 'CLEAR', 'TOGGLE']) addReg('data', P, k);
}
const muxName = n => { const P = portOf(n); return `GP${P}MUX${(n - PORTS[P][0]) < 16 ? 1 : 2}`; };
function suggestReg(kind, n) {
  const P = portOf(n);
  if (/^(MUX|QSEL)/.test(kind)) { const k = kind.replace(/\d$/, ''); return `GP${P}${k}${(n - PORTS[P][0]) < 16 ? 1 : 2}`; }
  return `GP${P}${kind}`;
}

/* ---------------- Lexer ---------------- */
const PUNCT = ['...', '<<=', '>>=', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '##', '#', '{', '}', '[', ']', '(', ')', ';', ',', '.', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '='];
function unesc(s, j) {
  const c = s[j + 1];
  const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '?': '?' };
  if (c === 'x') { const m = /^[0-9A-Fa-f]+/.exec(s.slice(j + 2)); if (m) return { ch: String.fromCharCode(parseInt(m[0], 16) & 0xFFFF), j: j + 2 + m[0].length }; }
  if (/[0-7]/.test(c || '')) { const m = /^[0-7]{1,3}/.exec(s.slice(j + 1)); return { ch: String.fromCharCode(parseInt(m[0], 8)), j: j + 1 + m[0].length }; }
  return { ch: map[c] !== undefined ? map[c] : (c || ''), j: j + 2 };
}
function lexLine(s, line, file, out) {
  let i = 0; const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v') { i++; continue; }
    const at = { line, file, col: i + 1 };
    if (/[A-Za-z_$]/.test(ch)) { let j = i + 1; while (j < n && /[\w$]/.test(s[j])) j++; out.push({ t: 'id', v: s.slice(i, j), line, file, col: i + 1 }); i = j; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1] || ''))) {
      const m = /^(?:0[xX][0-9A-Fa-f]*|0[bB][01]*|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?)[A-Za-z_0-9]*/.exec(s.slice(i));
      out.push({ t: 'num', v: m[0], line, file, col: i + 1 }); i += m[0].length; continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1, val = '';
      while (j < n && s[j] !== ch) { if (s[j] === '\\') { const r = unesc(s, j); val += r.ch; j = r.j; } else val += s[j++]; }
      if (j >= n) throw new CErr(ch === '"' ? 'Chaîne de caractères jamais fermée : il manque le guillemet " de fin.' : "Caractère jamais fermé : il manque l'apostrophe ' de fin.", at, { ccs: 'missing closing quote' });
      out.push({ t: ch === '"' ? 'str' : 'chr', v: val, line, file, col: i + 1 }); i = j + 1; continue;
    }
    let p = null; for (const q of PUNCT) if (s.startsWith(q, i)) { p = q; break; }
    if (!p) throw new CErr(`Caractère inattendu « ${ch} » : il n'a pas de sens en C à cet endroit.`, at, { ccs: 'unrecognized token' });
    out.push({ t: 'p', v: p, line, file, col: i + 1 }); i += p.length;
  }
}
function stripComments(src, file) {
  let o = '', i = 0, line = 1;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '"' || c === "'") {
      const q = c; o += c; i++;
      while (i < src.length && src[i] !== q && src[i] !== '\n') { if (src[i] === '\\') { o += src[i] + (src[i + 1] || ''); i += 2; continue; } o += src[i++]; }
      if (i < src.length && src[i] === q) o += src[i++];
      continue;
    }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { o += ' '; i++; } continue; }
    if (c === '/' && d === '*') {
      const startLine = line; o += '  '; i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') { o += '\n'; line++; } else o += ' '; i++; }
      if (i >= src.length) throw new CErr('Commentaire /* ouvert ici et jamais fermé par */.', { line: startLine, file }, { ccs: 'unclosed comment' });
      o += '  '; i += 2; continue;
    }
    if (c === '\n') line++;
    o += c; i++;
  }
  return o;
}

/* ---------------- Nombres ---------------- */
function numLit(tk) {
  const s = tk.v;
  const hex = /^0[xX]/.test(s), bin = /^0[bB]/.test(s);
  let body = s, suf = '';
  const sm = (hex || bin ? /[uUlL]+$/ : /[uUlLfF]+$/).exec(s);
  if (sm) { suf = sm[0]; body = s.slice(0, -suf.length); }
  const isFloat = !hex && !bin && (/[.eE]/.test(body) || /[fF]/.test(suf));
  const bad = () => new CErr(`Nombre mal écrit : « ${s} ».`, tk, { ccs: 'extra text after expected end of number' });
  if (isFloat) {
    if (!/^(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?$/.test(body) || /[uU]/.test(suf)) throw bad();
    return { v: parseFloat(body), t: T.f32 };
  }
  if (/[fF]/.test(suf) || !/^[uU]?[lL]{0,2}[uU]?$/.test(suf) || (suf.match(/u/gi) || []).length > 1) throw bad();
  let v, base = 10;
  if (hex) { if (!/^0[xX][0-9A-Fa-f]+$/.test(body)) throw bad(); v = parseInt(body.slice(2), 16); base = 16; }
  else if (bin) { if (!/^0[bB][01]+$/.test(body)) throw bad(); v = parseInt(body.slice(2), 2); base = 2; }
  else if (/^0\d/.test(body)) { if (!/^0[0-7]+$/.test(body)) throw new CErr(`« ${s} » : un nombre qui commence par 0 est en octal (chiffres 0 à 7 seulement). Enlève le 0 du début.`, tk, { ccs: 'invalid octal digit' }); v = parseInt(body, 8); base = 8; }
  else { if (!/^\d+$/.test(body)) throw bad(); v = parseInt(body, 10); }
  const U = /u/i.test(suf), Lc = (suf.match(/l/gi) || []).length, dec = base === 10;
  let list;
  if (Lc >= 2) list = U ? [T.u64] : (dec ? [T.i64] : [T.i64, T.u64]);
  else if (Lc === 1) list = U ? [T.u32, T.u64] : (dec ? [T.i32, T.u32, T.i64] : [T.i32, T.u32, T.i64, T.u64]);
  else list = U ? [T.u16, T.u32, T.u64] : (dec ? [T.i16, T.i32, T.u32, T.i64] : [T.i16, T.u16, T.i32, T.u32, T.i64, T.u64]);
  const max = t => t.bits === 16 ? (t.u ? 65535 : 32767) : t.bits === 32 ? (t.u ? 4294967295 : 2147483647) : (t.u ? 18446744073709551615 : 9223372036854775807);
  const t = list.find(x => v <= max(x)) || list[list.length - 1];
  return { v, t };
}

/* ---------------- Préprocesseur ---------------- */
const KNOWN_HEADERS = /^(DSP28x_Project|DSP2833x_\w+|DSP2834x_\w+|DSP280x_\w+|F2806x_\w+|F2837xD_\w+|F28x_Project|IQmathLib|C28x_FPU_FastRTS|stdio|stdlib|string|math|stdint|stdbool|limits|float|ctype|assert|stddef|stdarg|driverlib|device)\.h$/i;
const PREDEF = () => new Map([
  ['TRUE', { name: 'TRUE', params: null, body: [{ t: 'num', v: '1' }] }],
  ['FALSE', { name: 'FALSE', params: null, body: [{ t: 'num', v: '0' }] }],
  ['NULL', { name: 'NULL', params: null, body: [{ t: 'num', v: '0' }] }]
]);
function preprocess(file, files) {
  const raw = [];
  const macros = PREDEF();
  const stack = [];
  function evalIf(rest, at) {
    const s = rest.replace(/defined\s*\(\s*(\w+)\s*\)/g, (m, a) => macros.has(a) ? ' 1 ' : ' 0 ').replace(/defined\s+(\w+)/g, (m, a) => macros.has(a) ? ' 1 ' : ' 0 ');
    const toks = []; lexLine(s, at.line, at.file, toks);
    const ex = expandTokens(toks.map(t => t), macros).map(t => t.t === 'id' ? { t: 'num', v: '0', line: t.line, file: t.file } : t);
    const p = new Parser(ex, at.file);
    const e = p.expr();
    return !!constEval(e);
  }
  function doFile(f, depth) {
    if (depth > 16) throw new CErr("Inclusions imbriquées trop profondes : un .h s'inclut lui-même ?", { line: 1, file: f.name }, { ccs: '#include nested too deeply' });
    const text = stripComments(f.code, f.name);
    const lines = text.split('\n');
    const cond = [];
    const active = () => cond.length ? cond[cond.length - 1].on : true;
    for (let li = 0; li < lines.length; li++) {
      let s = lines[li]; const ln = li + 1;
      while (/\\\s*$/.test(s) && li + 1 < lines.length) s = s.replace(/\\\s*$/, ' ') + lines[++li];
      const at = { line: ln, file: f.name };
      const d = /^\s*#\s*([A-Za-z_]*)\s*(.*)$/.exec(s);
      if (d) {
        const dir = d[1], rest = d[2].trim();
        if (dir === 'ifdef' || dir === 'ifndef') {
          const nm = (/^\w+/.exec(rest) || [''])[0];
          if (!nm) throw new CErr(`#${dir} attend un nom de macro.`, at, { ccs: 'expected an identifier' });
          const v = dir === 'ifdef' ? macros.has(nm) : !macros.has(nm);
          const par = active(); cond.push({ on: par && v, taken: v, parent: par }); continue;
        }
        if (dir === 'if') { const par = active(); const v = par ? evalIf(rest, at) : false; cond.push({ on: par && v, taken: v, parent: par }); continue; }
        if (dir === 'elif') { const c = cond[cond.length - 1]; if (!c) throw new CErr('#elif sans #if.', at); if (c.taken) c.on = false; else { const v = c.parent ? evalIf(rest, at) : false; c.on = c.parent && v; c.taken = v; } continue; }
        if (dir === 'else') { const c = cond[cond.length - 1]; if (!c) throw new CErr('#else sans #if correspondant.', at, { ccs: '#else without #if' }); c.on = c.parent && !c.taken; c.taken = true; continue; }
        if (dir === 'endif') { if (!cond.length) throw new CErr('#endif sans #if correspondant.', at, { ccs: '#endif without #if' }); cond.pop(); continue; }
        if (!active()) continue;
        if (dir === 'include') {
          const im = /^(?:"([^"]+)"|<([^>]+)>)/.exec(rest);
          if (!im) throw new CErr('#include attend "fichier.h" ou <fichier.h>.', at, { ccs: 'expected a file name' });
          const nm = (im[1] || im[2]).trim(), base = nm.split(/[\\/]/).pop();
          const inc = files.get(base.toLowerCase());
          if (inc && im[1]) {
            if (stack.includes(inc.name)) throw new CErr(`« ${inc.name} » s'inclut lui-même (directement ou par un autre .h). Ajoute une garde #ifndef / #define / #endif.`, at, { ccs: '#include file includes itself' });
            stack.push(inc.name); doFile(inc, depth + 1); stack.pop(); continue;
          }
          if (KNOWN_HEADERS.test(base) || im[2]) continue;
          throw new CErr(`Le fichier « ${nm} » est introuvable dans le projet. Crée-le (Fichier > Nouveau fichier) ou corrige son nom.`, at, { code: '#1965', ccs: `cannot open source file "${nm}"` });
        }
        if (dir === 'define') {
          const m = /^([A-Za-z_]\w*)(\(([^)]*)\))?\s*(.*)$/.exec(rest);
          if (!m) throw new CErr('#define attend un nom (lettres, chiffres, _).', at, { ccs: 'expected an identifier' });
          const params = (m[2] && rest[m[1].length] === '(') ? m[3].split(',').map(x => x.trim()).filter(Boolean) : null;
          const bodyText = (m[2] && params === null) ? m[2] + ' ' + m[4] : m[4];
          const body = []; lexLine(bodyText, ln, f.name, body);
          const mac = { name: m[1], params, body };
          macros.set(m[1], mac); raw.push({ t: 'def', name: m[1], mac }); continue;
        }
        if (dir === 'undef') { const nm = (/^\w+/.exec(rest) || [''])[0]; macros.delete(nm); raw.push({ t: 'undef', name: nm }); continue; }
        if (dir === 'pragma' || dir === 'line' || dir === '' || dir === 'warning' || dir === 'ident') continue;
        if (dir === 'error') throw new CErr(`#error : ${rest}`, at, { ccs: `#error directive: ${rest}` });
        throw new CErr(`Directive #${dir} inconnue.`, at, { ccs: 'unrecognized preprocessing directive' });
      }
      if (!active()) continue;
      lexLine(s, ln, f.name, raw);
    }
    if (cond.length) throw new CErr('#if / #ifdef / #ifndef sans #endif correspondant.', { line: lines.length, file: f.name }, { ccs: 'expected an #endif' });
  }
  stack.push(file.name); doFile(file, 0);
  return expandTokens(raw, PREDEF());
}
function expandTokens(raw, macros) {
  const cloneAt = (tk, at, mac) => ({ t: tk.t, v: tk.v, line: at.line, file: at.file, col: at.col, mac });
  function collectArgs(src, j) {
    let depth = 0, cur = [], args = [];
    for (let k = j; k < src.length; k++) {
      const tk = src[k];
      if (tk.t === 'def') { macros.set(tk.name, tk.mac); continue; }
      if (tk.t === 'undef') { macros.delete(tk.name); continue; }
      if (tk.t === 'p' && tk.v === '(') { if (depth++ > 0) cur.push(tk); continue; }
      if (tk.t === 'p' && tk.v === ')') { if (--depth === 0) { args.push(cur); return { args, end: k }; } cur.push(tk); continue; }
      if (tk.t === 'p' && tk.v === ',' && depth === 1) { args.push(cur); cur = []; continue; }
      cur.push(tk);
    }
    return null;
  }
  function substitute(mac, args, at, active) {
    let res = [];
    const body = mac.body;
    for (let b = 0; b < body.length; b++) {
      const tk = body[b];
      if (tk.t === 'p' && tk.v === '#' && mac.params && body[b + 1] && body[b + 1].t === 'id' && mac.params.includes(body[b + 1].v)) {
        const a = args[mac.params.indexOf(body[++b].v)] || [];
        res.push({ t: 'str', v: a.map(x => x.t === 'str' ? JSON.stringify(x.v) : x.v).join(' '), line: at.line, file: at.file, col: at.col, mac: mac.name });
        continue;
      }
      if (tk.t === 'id' && mac.params) {
        const pi = mac.params.indexOf(tk.v);
        if (pi >= 0) { res.push(...expandList(args[pi] || [], active).map(x => cloneAt(x, at, mac.name))); continue; }
      }
      res.push(cloneAt(tk, at, mac.name));
    }
    for (let r = 1; r < res.length - 1; r++) {
      if (res[r].t === 'p' && res[r].v === '##') {
        const toks = []; lexLine(String(res[r - 1].v) + String(res[r + 1].v), at.line, at.file, toks);
        res.splice(r - 1, 3, ...toks.map(x => cloneAt(x, at, mac.name))); r -= 1;
      }
    }
    return res;
  }
  function expandOne(list, k, active, out) {
    const tk = list[k];
    const mac = macros.get(tk.v);
    if (mac.params) {
      let j = k + 1; while (j < list.length && (list[j].t === 'def' || list[j].t === 'undef')) j++;
      if (list[j] && list[j].t === 'p' && list[j].v === '(') {
        const r = collectArgs(list, j);
        if (!r) throw new CErr(`Appel de la macro ${tk.v} : parenthèse jamais fermée.`, tk, { ccs: 'unbalanced parentheses in macro call' });
        if (r.args.length === 1 && r.args[0].length === 0 && mac.params.length === 0) r.args = [];
        if (r.args.length !== mac.params.length) throw new CErr(`La macro ${tk.v} attend ${mac.params.length} argument(s), ${r.args.length} donné(s).`, tk, { ccs: `macro "${tk.v}" requires ${mac.params.length} arguments` });
        const act = new Set(active); act.add(tk.v);
        out.push(...expandList(substitute(mac, r.args, tk, act), act));
        return r.end;
      }
      out.push(tk); return k;
    }
    const act = new Set(active); act.add(tk.v);
    out.push(...expandList(substitute(mac, [], tk, act), act));
    return k;
  }
  function expandList(list, active) {
    const res = [];
    for (let k = 0; k < list.length; k++) {
      const tk = list[k];
      if (tk.t === 'def') { macros.set(tk.name, tk.mac); continue; }
      if (tk.t === 'undef') { macros.delete(tk.name); continue; }
      if (tk.t === 'id' && macros.has(tk.v) && !active.has(tk.v)) { k = expandOne(list, k, active, res); continue; }
      res.push(tk);
    }
    return res;
  }
  return expandList(raw, new Set());
}

/* ---------------- Parseur ---------------- */
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);
const BIN_PREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
const PTR_MSG = "Les pointeurs (*, &, ->) ne sont pas pris en charge par ce simulateur. Pour les registres, écris GpioDataRegs.GPADAT.bit.GPIOxx.";
class Parser {
  constructor(toks, file) { this.t = toks; this.i = 0; this.file = file; }
  eof() { const last = this.t[this.t.length - 1]; return { t: 'eof', v: 'fin du fichier', line: last ? last.line : 1, file: last ? last.file : this.file, col: 1 }; }
  get cur() { return this.t[this.i] || this.eof(); }
  peek(k = 0) { return this.t[this.i + k] || this.eof(); }
  next() { const tk = this.cur; this.i++; return tk; }
  isP(v, k = 0) { const tk = this.peek(k); return tk.t === 'p' && tk.v === v; }
  isId(v, k = 0) { const tk = this.peek(k); return tk.t === 'id' && (v === undefined || tk.v === v); }
  accept(v) { if (this.isP(v)) { this.i++; return true; } return false; }
  expect(v) { if (this.isP(v)) return this.next(); this.missing(v); }
  missing(v) {
    const tk = this.cur, prev = this.t[this.i - 1];
    if (v === ';') throw new CErr(`Il manque un point-virgule « ; »${prev ? ` après « ${shown(prev)} »` : ''}.`, prev || tk, { code: '#65', ccs: 'expected a ";"' });
    if (v === ')') throw new CErr(`Il manque une parenthèse fermante « ) » (trouvé « ${shown(tk)} »).`, tk, { code: '#18', ccs: 'expected a ")"' });
    if (v === ']') throw new CErr(`Il manque un crochet fermant « ] » (trouvé « ${shown(tk)} »).`, tk, { ccs: 'expected a "]"' });
    if (v === '(') throw new CErr(`Il manque une parenthèse ouvrante « ( » (trouvé « ${shown(tk)} »).`, tk, { ccs: 'expected a "("' });
    if (v === '{') throw new CErr(`Il manque une accolade ouvrante « { » (trouvé « ${shown(tk)} »).`, tk, { ccs: 'expected a "{"' });
    if (v === ':') throw new CErr(`Il manque « : » (trouvé « ${shown(tk)} »).`, tk, { ccs: 'expected a ":"' });
    throw new CErr(`« ${v} » attendu, trouvé « ${shown(tk)} ».`, tk, { ccs: `expected a "${v}"` });
  }
  isTypeAt(k) { const tk = this.peek(k); return tk.t === 'id' && (BASEWORDS.has(tk.v) || QUALS.has(tk.v) || TYPEDEFS[tk.v] !== undefined || tk.v === 'struct' || tk.v === 'union' || tk.v === 'enum' || tk.v === 'typedef'); }
  parseSpecs() {
    const start = this.cur; const words = []; const q = { static: false, extern: false, const: false, volatile: false };
    let td = null;
    for (;;) {
      const tk = this.cur; if (tk.t !== 'id') break; const v = tk.v;
      if (v === 'struct' || v === 'union') throw new CErr(`Les ${v} ne sont pas pris en charge par ce simulateur (seules les structures de registres du DSP le sont).`, tk, { ccs: `${v} not supported by the simulator` });
      if (v === 'enum') throw new CErr("enum n'est pas pris en charge par ce simulateur : utilise des #define.", tk, { ccs: 'enum not supported by the simulator' });
      if (v === 'typedef') throw new CErr("typedef n'est pas pris en charge par ce simulateur : utilise directement Uint16, Uint32, int…", tk, { ccs: 'typedef not supported by the simulator' });
      if (QUALS.has(v)) { if (v in q) q[v] = true; this.i++; continue; }
      if (BASEWORDS.has(v)) { if (td) throw new CErr(`« ${v} » ne peut pas suivre ${td.name}.`, tk, { ccs: 'invalid combination of type specifiers' }); words.push(v); this.i++; continue; }
      if (TYPEDEFS[v] && !td && !words.length) { td = TYPEDEFS[v]; this.i++; continue; }
      break;
    }
    if (!td && !words.length) throw new CErr(`Type manquant avant « ${shown(this.cur)} » : précise le type (Uint16, int, void…).`, start, { ccs: 'expected a type specifier' });
    let t = td;
    if (!t) {
      const c = w => words.filter(x => x === w).length;
      if (c('void')) { if (words.length > 1) throw new CErr('void ne se combine avec aucun autre type.', start, { ccs: 'invalid combination of type specifiers' }); t = T.void; }
      else if (c('float') || c('double')) t = named(T.f32, words.join(' '));
      else {
        const u = c('unsigned') > 0;
        if (c('unsigned') && c('signed')) throw new CErr('signed et unsigned à la fois ?', start, { ccs: 'invalid combination of type specifiers' });
        if (c('long') >= 2) t = named(u ? T.u64 : T.i64, words.join(' '));
        else if (c('long') === 1) t = named(u ? T.u32 : T.i32, words.join(' '));
        else t = named(u ? T.u16 : T.i16, words.join(' '));
      }
    }
    return Object.assign({ t, tok: start }, q);
  }
  typeName() {
    const sp = this.parseSpecs();
    if (this.isP('*')) throw new CErr(PTR_MSG, this.cur, { ccs: 'pointers not supported by the simulator' });
    return sp.t;
  }
  parseTU() {
    const decls = [];
    while (this.cur.t !== 'eof') {
      if (this.accept(';')) continue;
      const tk = this.cur;
      if (!this.isTypeAt(0)) {
        if (tk.t === 'p' && tk.v === '}') throw new CErr("Accolade « } » en trop : elle ne ferme rien. Compte les { et les } de la fonction au-dessus.", tk, { ccs: 'expected a declaration' });
        if (tk.t === 'id' && STMT_BUILTINS.has(tk.v)) throw new CErr(`« ${tk.v}; » est en dehors de toute fonction : une instruction s'écrit à l'intérieur d'une fonction (entre { et }). Une accolade } a peut-être été fermée trop tôt.`, tk, { ccs: 'expected a declaration' });
        if (tk.t === 'id' && (this.isP('(', 1) || this.isP('=', 1) || this.isP('.', 1))) throw new CErr(`« ${tk.v} » est en dehors de toute fonction : une instruction s'écrit à l'intérieur d'une fonction (entre { et }). S'il s'agit d'une fonction, il manque son type de retour (void, Uint16…).`, tk, { ccs: 'expected a declaration' });
        throw new CErr(`« ${shown(tk)} » inattendu ici : on attend une déclaration (variable ou fonction).`, tk, { ccs: 'expected a declaration' });
      }
      const sp = this.parseSpecs();
      if (this.accept(';')) continue;
      this.declarators(sp, decls, true);
    }
    return decls;
  }
  declarator() {
    if (this.isP('*')) throw new CErr(PTR_MSG, this.cur, { ccs: 'pointers not supported by the simulator' });
    const tk = this.cur;
    if (tk.t !== 'id' || KEYWORDS.has(tk.v)) {
      if (tk.t === 'p' && tk.v === '(') throw new CErr('Nom attendu après le type (une fonction s\'écrit : void nom(void)).', tk, { ccs: 'expected an identifier' });
      throw new CErr(`Nom de variable ou de fonction attendu après le type, trouvé « ${shown(tk)} ».`, tk, { ccs: 'expected an identifier' });
    }
    this.i++;
    const dims = [];
    while (this.accept('[')) { if (this.isP(']')) dims.push(null); else dims.push(this.cond()); this.expect(']'); }
    return { name: tk.v, tok: tk, dims };
  }
  declarators(sp, out, fileScope) {
    for (;;) {
      const d = this.declarator();
      if (this.isP('(') && !d.dims.length) {
        const params = this.params();
        if (this.isP('{')) {
          if (!fileScope) throw new CErr(`La fonction ${d.name}() est définie à l'intérieur d'une autre fonction. En C, chaque fonction se définit séparément : il manque sans doute une accolade « } » pour fermer la fonction précédente.`, d.tok, { ccs: 'function definition is not allowed here' });
          const body = this.block();
          out.push({ k: 'func', name: d.name, ret: sp.t, params, body, static: sp.static, tok: d.tok, endLine: this.t[this.i - 1].line });
          return;
        }
        out.push({ k: 'proto', name: d.name, ret: sp.t, params, static: sp.static, tok: d.tok });
      } else {
        let init = null;
        if (this.accept('=')) init = this.initializer();
        if (sp.t.k === 'void') throw new CErr(`Une variable ne peut pas être de type void (« ${d.name} »).`, d.tok, { ccs: 'incomplete type is not allowed' });
        out.push({ k: 'var', name: d.name, t: sp.t, dims: d.dims, init, static: sp.static, extern: sp.extern, const: sp.const, tok: d.tok });
      }
      if (this.accept(',')) continue;
      this.expect(';'); return;
    }
  }
  params() {
    this.expect('(');
    const ps = [];
    if (this.accept(')')) return ps;
    if (this.isId('void') && this.isP(')', 1)) { this.i += 2; return ps; }
    for (;;) {
      if (this.isP('...')) throw new CErr("Les fonctions à nombre variable d'arguments ne sont pas prises en charge.", this.cur);
      if (!this.isTypeAt(0)) throw new CErr(`Type du paramètre attendu, trouvé « ${shown(this.cur)} ». Exemple : void f(Uint16 x)`, this.cur, { ccs: 'expected a type specifier' });
      const sp = this.parseSpecs();
      if (this.isP('*')) throw new CErr(PTR_MSG, this.cur, { ccs: 'pointers not supported by the simulator' });
      let name = null; const tok = this.cur;
      if (this.cur.t === 'id' && !KEYWORDS.has(this.cur.v)) name = this.next().v;
      const dims = [];
      while (this.accept('[')) { if (this.isP(']')) dims.push(null); else dims.push(this.cond()); this.expect(']'); }
      if (sp.t.k === 'void' && !dims.length) throw new CErr('void ne peut être qu\'un paramètre unique : f(void).', tok, { ccs: 'type void is not allowed here' });
      ps.push({ name, t: sp.t, dims, tok });
      if (this.accept(',')) continue;
      this.expect(')'); return ps;
    }
  }
  initializer() {
    if (this.isP('{')) {
      const tk = this.next(); const items = [];
      while (!this.isP('}')) {
        items.push(this.initializer());
        if (!this.accept(',')) break;
      }
      if (!this.isP('}')) this.missing('}');
      this.next();
      return { k: 'list', items, tok: tk };
    }
    return this.assign();
  }
  block() {
    const open = this.expect('{'); const items = [];
    while (!this.isP('}')) {
      if (this.cur.t === 'eof') throw new CErr('Accolade « { » ouverte ici et jamais fermée.', open, { ccs: 'expected a "}"' });
      items.push(this.statement());
    }
    const close = this.next();
    return { k: 'block', items, tok: open, end: close };
  }
  parenCond() { this.expect('('); const e = this.expr(); this.expect(')'); return e; }
  statement() {
    const tk = this.cur;
    if (tk.t === 'p') {
      if (tk.v === '{') return this.block();
      if (tk.v === ';') { this.i++; return { k: 'empty', tok: tk }; }
    }
    if (tk.t === 'id') {
      switch (tk.v) {
        case 'if': {
          this.i++; const c = this.parenCond();
          const semi = this.isP(';');
          const a = this.statement(); let b = null;
          if (this.isId('else')) { this.i++; b = this.statement(); }
          return { k: 'if', c, a, b, tok: tk, semi };
        }
        case 'while': { this.i++; const c = this.parenCond(); const body = this.statement(); return { k: 'while', c, body, tok: tk }; }
        case 'do': {
          this.i++; const body = this.statement();
          if (!this.isId('while')) throw new CErr('« do { … } » doit être suivi de « while (condition); ».', this.cur, { ccs: 'expected a "while"' });
          const wt = this.next(); const c = this.parenCond(); this.expect(';');
          return { k: 'do', body, c, tok: tk, wtok: wt };
        }
        case 'for': {
          this.i++; this.expect('(');
          let init = null;
          if (this.isTypeAt(0)) { const sp = this.parseSpecs(); const out = []; this.declarators(sp, out, false); init = { k: 'decl', decls: out, tok: tk }; }
          else { if (!this.isP(';')) init = this.expr(); this.expect(';'); }
          let c = null; if (!this.isP(';')) c = this.expr(); this.expect(';');
          let inc = null; if (!this.isP(')')) inc = this.expr(); this.expect(')');
          const body = this.statement();
          return { k: 'for', init, c, inc, body, tok: tk };
        }
        case 'switch': { this.i++; const e = this.parenCond(); const body = this.statement(); return { k: 'switch', e, body, tok: tk }; }
        case 'case': { this.i++; const e = this.cond(); this.expect(':'); return { k: 'case', e, tok: tk }; }
        case 'default': { this.i++; this.expect(':'); return { k: 'default', tok: tk }; }
        case 'break': { this.i++; this.expect(';'); return { k: 'break', tok: tk }; }
        case 'continue': { this.i++; this.expect(';'); return { k: 'continue', tok: tk }; }
        case 'return': { this.i++; let e = null; if (!this.isP(';')) e = this.expr(); this.expect(';'); return { k: 'return', e, tok: tk }; }
        case 'goto': throw new CErr("goto n'est pas pris en charge par ce simulateur.", tk, { ccs: 'goto not supported by the simulator' });
        case 'else': throw new CErr("« else » sans « if » juste avant. Vérifie les accolades, et qu'il n'y a pas de « ; » juste après la parenthèse du if.", tk, { ccs: 'expected a statement' });
        case 'asm': case '__asm': {
          this.i++; this.expect('(');
          if (this.cur.t !== 'str') throw new CErr('asm attend une chaîne, par exemple asm(" EALLOW");', this.cur);
          let text = this.next().v; while (this.cur.t === 'str') text += this.next().v;
          this.expect(')'); this.expect(';');
          return { k: 'asm', text, tok: tk };
        }
      }
      if (STMT_BUILTINS.has(tk.v)) {
        if (this.isP(';', 1)) { this.i += 2; return { k: 'builtin', name: tk.v, tok: tk }; }
        if (this.isP('(', 1)) throw new CErr(`Écris « ${tk.v}; » sans parenthèses : c'est une macro du DSP, pas une fonction.`, tk, { ccs: 'expected a ";"' });
        this.i++; this.missing(';');
      }
      if (this.isTypeAt(0)) {
        const sp = this.parseSpecs(); const out = [];
        if (this.accept(';')) return { k: 'empty', tok: tk };
        this.declarators(sp, out, false);
        return { k: 'decl', decls: out, tok: tk };
      }
      if (this.isP(':', 1) && !KEYWORDS.has(tk.v)) throw new CErr('Les étiquettes (nom:) et goto ne sont pas pris en charge.', tk, { ccs: 'labels not supported by the simulator' });
    }
    const e = this.expr();
    this.expect(';');
    return { k: 'expr', e, tok: tk };
  }
  expr() { let e = this.assign(); while (this.isP(',')) { const tk = this.next(); e = { k: 'comma', a: e, b: this.assign(), tok: tk }; } return e; }
  assign() {
    const lhs = this.cond(); const tk = this.cur;
    if (tk.t === 'p' && ASSIGN_OPS.has(tk.v)) { this.i++; const rhs = this.assign(); return { k: 'assign', op: tk.v, a: lhs, b: rhs, tok: tk }; }
    return lhs;
  }
  cond() {
    const c = this.bin(1);
    if (this.isP('?')) { const tk = this.next(); const a = this.expr(); this.expect(':'); const b = this.cond(); return { k: 'cond', c, a, b, tok: tk }; }
    return c;
  }
  bin(minPrec) {
    let left = this.castExpr();
    for (;;) {
      const tk = this.cur; const p = tk.t === 'p' ? BIN_PREC[tk.v] : undefined;
      if (p === undefined || p < minPrec) return left;
      this.i++;
      const right = this.bin(p + 1);
      left = { k: 'bin', op: tk.v, a: left, b: right, tok: tk };
    }
  }
  castExpr() {
    if (this.isP('(') && this.isTypeAt(1)) { const tk = this.next(); const t = this.typeName(); this.expect(')'); return { k: 'cast', t, e: this.castExpr(), tok: tk }; }
    return this.unary();
  }
  unary() {
    const tk = this.cur;
    if (tk.t === 'p') {
      if (tk.v === '++' || tk.v === '--') { this.i++; return { k: 'pre', op: tk.v, e: this.unary(), tok: tk }; }
      if (tk.v === '-' || tk.v === '+' || tk.v === '!' || tk.v === '~') { this.i++; return { k: 'un', op: tk.v, e: this.castExpr(), tok: tk }; }
      if (tk.v === '&') { this.i++; return { k: 'addr', e: this.castExpr(), tok: tk }; }
      if (tk.v === '*') throw new CErr(PTR_MSG, tk, { ccs: 'pointers not supported by the simulator' });
    }
    if (tk.t === 'id' && tk.v === 'sizeof') {
      this.i++;
      if (this.isP('(') && this.isTypeAt(1)) { this.i++; const t = this.typeName(); this.expect(')'); return { k: 'sizeofT', t, tok: tk }; }
      return { k: 'sizeofE', e: this.unary(), tok: tk };
    }
    return this.postfix();
  }
  postfix() {
    let e = this.primary();
    for (;;) {
      const tk = this.cur;
      if (tk.t !== 'p') return e;
      if (tk.v === '[') { this.i++; const idx = this.expr(); this.expect(']'); e = { k: 'index', a: e, i: idx, tok: tk }; continue; }
      if (tk.v === '(') {
        this.i++; const args = [];
        if (!this.isP(')')) { for (;;) { args.push(this.assign()); if (this.accept(',')) continue; break; } }
        this.expect(')'); e = { k: 'call', f: e, args, tok: tk }; continue;
      }
      if (tk.v === '.') {
        this.i++; const nm = this.cur;
        if (nm.t !== 'id') throw new CErr('Nom de champ attendu après le point « . ».', nm, { ccs: 'expected a field name' });
        this.i++; e = { k: 'member', a: e, name: nm.v, tok: nm }; continue;
      }
      if (tk.v === '->') throw new CErr(PTR_MSG, tk, { ccs: 'pointers not supported by the simulator' });
      if (tk.v === '++' || tk.v === '--') { this.i++; e = { k: 'post', op: tk.v, e, tok: tk }; continue; }
      return e;
    }
  }
  primary() {
    const tk = this.cur;
    if (tk.t === 'num') { this.i++; const r = numLit(tk); return { k: 'num', v: r.v, t: r.t, tok: tk }; }
    if (tk.t === 'chr') { this.i++; return { k: 'num', v: tk.v.length ? tk.v.charCodeAt(0) : 0, t: T.i16, tok: tk }; }
    if (tk.t === 'str') { this.i++; let s = tk.v; while (this.cur.t === 'str') s += this.next().v; return { k: 'str', v: s, tok: tk }; }
    if (tk.t === 'id') {
      if (KEYWORDS.has(tk.v)) {
        if (this.isTypeAt(0)) throw new CErr(`Type « ${tk.v} » inattendu ici : une déclaration ne peut pas se placer au milieu d'une expression.`, tk, { code: '#29', ccs: 'expected an expression' });
        throw new CErr(`Mot-clé « ${tk.v} » inattendu ici.`, tk, { code: '#29', ccs: 'expected an expression' });
      }
      this.i++; return { k: 'id', name: tk.v, tok: tk };
    }
    if (tk.t === 'p' && tk.v === '(') { this.i++; const e = this.expr(); this.expect(')'); return Object.assign({}, e, { paren: true }); }
    if (tk.t === 'eof') throw new CErr("Fin du fichier inattendue : une accolade ou une parenthèse n'est pas fermée ?", tk, { code: '#29', ccs: 'expected an expression' });
    throw new CErr(`Expression attendue, trouvé « ${shown(tk)} ».`, tk, { code: '#29', ccs: 'expected an expression' });
  }
}

/* ---------------- Évaluation de constantes ---------------- */
function constEval(n) {
  const bad = () => new CErr('Une valeur constante est attendue ici (un nombre ou un #define).', n.tok, { ccs: 'expression must have a constant value' });
  switch (n.k) {
    case 'num': return n.v;
    case 'un': { const v = constEval(n.e); return n.op === '-' ? -v : n.op === '+' ? v : n.op === '!' ? (v ? 0 : 1) : ~v; }
    case 'bin': {
      const a = constEval(n.a), b = constEval(n.b);
      switch (n.op) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b;
        case '/': if (b === 0) throw new CErr('Division par zéro dans une constante.', n.tok); return Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(a / b) : a / b;
        case '%': if (b === 0) throw new CErr('Modulo par zéro dans une constante.', n.tok); return a % b;
        case '<<': return a * Math.pow(2, b); case '>>': return Math.floor(a / Math.pow(2, b));
        case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
        case '==': return +(a === b); case '!=': return +(a !== b); case '<': return +(a < b); case '>': return +(a > b); case '<=': return +(a <= b); case '>=': return +(a >= b);
        case '&&': return +(a && b); case '||': return +(a || b);
      }
      throw bad();
    }
    case 'cond': return constEval(n.c) ? constEval(n.a) : constEval(n.b);
    case 'cast': { const v = constEval(n.e); return n.t.k === 'int' ? wrapVal(n.t, Math.trunc(v)) : v; }
    case 'sizeofT': return sizeOf(n.t);
    case 'comma': return constEval(n.b);
  }
  throw bad();
}

/* ---------------- printf ---------------- */
function cfmt(fmt, args, types) {
  let i = 0;
  return String(fmt).replace(/%([-+ 0#]*)(\d*|\*)(?:\.(\d+))?(hh|h|ll|l|L)?([diuxXoXcsfeEgGp%])/g, (m, flags, width, prec, len, cv) => {
    if (cv === '%') return '%';
    let v = args[i]; const t = types[i] || { k: 'int', bits: 16, u: false }; i++;
    if (v === undefined) return '';
    let s;
    const asUns = x => { const bits = (len === 'l' || len === 'll') ? Math.max(32, t.bits || 16) : (t.bits || 16); x = Math.trunc(Number(x)); if (x < 0) x += Math.pow(2, bits); return x; };
    switch (cv) {
      case 'd': case 'i': s = String(Math.trunc(Number(v))); break;
      case 'u': s = String(asUns(v)); break;
      case 'x': s = asUns(v).toString(16); break;
      case 'X': s = asUns(v).toString(16).toUpperCase(); break;
      case 'o': s = asUns(v).toString(8); break;
      case 'c': s = typeof v === 'number' ? String.fromCharCode(v & 0xFFFF) : String(v); break;
      case 's': s = String(v); break;
      case 'f': case 'F': s = Number(v).toFixed(prec !== undefined ? +prec : 6); break;
      case 'e': case 'E': s = Number(v).toExponential(prec !== undefined ? +prec : 6); if (cv === 'E') s = s.toUpperCase(); break;
      case 'g': case 'G': s = String(Number(Number(v).toPrecision(prec !== undefined ? Math.max(1, +prec) : 6))); break;
      default: s = String(v);
    }
    if (prec !== undefined && /[diuxXo]/.test(cv)) s = s.padStart(+prec, '0');
    const w = width && width !== '*' ? +width : 0;
    if (s.length < w) s = flags.includes('-') ? s.padEnd(w) : (flags.includes('0') && !/[cs]/.test(cv) ? s.padStart(w, '0') : s.padStart(w));
    return s;
  });
}

/* ---------------- Générateur de code ---------------- */
const CMP = new Set(['==', '!=', '<', '>', '<=', '>=']);
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

class Gen {
  constructor(files) {
    this.files = files; this.fileIdx = new Map(files.map((f, i) => [f.name, i]));
    this.errors = []; this.warns = [];
    this.funcs = new Map();      // nom -> symbole global de fonction
    this.sfuncs = new Map();     // tu:nom -> fonction static
    this.globals = new Map();    // nom -> variable globale
    this.sglobals = new Map();   // tu:nom -> globale static
    this.fnList = [];            // métadonnées des fonctions (pour le débogueur)
    this.code = [];
    this.inits = [];
    this.missing = new Map();
    this.warnKeys = new Set();
  }
  fi(file) { const i = this.fileIdx.get(file); return i === undefined ? 0 : i; }
  warn(fr, at, opt = {}) {
    const key = (at && at.file) + ':' + (at && at.line) + ':' + (opt.ccs || fr);
    if (this.warnKeys.has(key)) return; this.warnKeys.add(key);
    this.warns.push({ fr, file: at && at.file, line: at && at.line, ccs: opt.ccs || null, code: opt.code || null, warn: true });
  }
  error(e) { this.errors.push({ fr: e.fr, file: e.file, line: e.line, ccs: e.ccs, code: e.code }); }

  /* --- type d'une déclaration (tableaux) --- */
  declType(base, dims, init, tok, isParam) {
    let t = base;
    for (let k = dims.length - 1; k >= 0; k--) {
      let n = null;
      if (dims[k] !== null) {
        n = constEval(dims[k]);
        if (!Number.isInteger(n) || n <= 0) throw new CErr(`La taille d'un tableau doit être un entier positif (ici : ${n}).`, tok, { ccs: 'the size of an array must be greater than zero' });
        if (n > 65536) throw new CErr(`Tableau trop grand (${n} cases) pour ce simulateur.`, tok);
      } else if (k === 0 && !isParam) {
        if (init && init.k === 'list') n = init.items.length;
        else if (init && init.k === 'str') n = init.v.length + 1;
        else throw new CErr(`Taille du tableau ${tok.v}[] manquante : écris-la entre crochets ou donne des valeurs initiales.`, tok, { ccs: 'incomplete type is not allowed' });
      } else if (k !== 0) throw new CErr('Seule la première dimension d\'un tableau peut être vide.', tok, { ccs: 'an array may not have elements of this type' });
      t = { k: 'arr', elem: t, n, name: typeStr({ k: 'arr', elem: t, n }) };
    }
    return t;
  }

  /* --- programme --- */
  run(tus) {
    // 1. définitions (édition des liens)
    tus.forEach((tu, ti) => {
      for (const d of tu.decls) {
        try {
          if (d.k === 'func') {
            const key = d.static ? `${ti}:${d.name}` : d.name;
            const map = d.static ? this.sfuncs : this.funcs;
            const prev = map.get(key);
            if (prev && prev.def) {
              if (prev.def.tok.file === d.tok.file) throw new CErr(`La fonction ${d.name}() est définie deux fois dans ce fichier (première définition ligne ${prev.def.tok.line}). Garde une seule définition : ailleurs, mets seulement son prototype terminé par « ; ».`, d.tok, { ccs: `function "${d.name}" has already been defined` });
              throw new CErr(`La fonction ${d.name}() est définie dans ${prev.def.tok.file} et dans ${d.tok.file}. Une fonction ne doit être définie qu'une seule fois dans tout le projet.`, d.tok, { ccs: `symbol "_${d.name}" redefined: first defined in "./${prev.def.tok.file.replace(/\.c$/i, '.obj')}"` });
            }
            if (d.name === 'main' && d.static) throw new CErr('main() ne peut pas être static.', d.tok);
            const fid = this.fnList.length;
            const sym = { name: d.name, js: d.static ? `F${ti}_${d.name}` : `F_${d.name}`, ret: d.ret, params: d.params, def: d, tu: ti, fid };
            this.fnList.push({ name: d.name, file: d.tok.file, line: d.tok.line, locals: [], ret: d.ret });
            map.set(key, sym);
          } else if (d.k === 'var' && !d.extern) {
            const t = this.declType(d.t, d.dims, d.init, d.tok, false);
            if (d.static) { this.sglobals.set(`${ti}:${d.name}`, { name: d.name, key: `s${ti}_${d.name}`, t, def: d, tu: ti, const: d.const }); continue; }
            const prev = this.globals.get(d.name);
            if (prev) {
              if (!sameT(prev.t.k === 'arr' ? { k: 'x' } : prev.t, t.k === 'arr' ? { k: 'x' } : t) || (prev.t.k === 'arr') !== (t.k === 'arr')) throw new CErr(`La variable globale « ${d.name} » est déclarée avec deux types différents (${typeStr(prev.t)} et ${typeStr(t)}).`, d.tok, { ccs: `declaration is incompatible with "${typeStr(prev.t)} ${d.name}"` });
              if (prev.def.init && d.init) throw new CErr(`La variable globale « ${d.name} » est initialisée deux fois (dans ${prev.def.tok.file} et ${d.tok.file}). Dans un .h ou un 2e fichier, écris : extern ${typeStr(t)} ${d.name};`, d.tok, { ccs: `symbol "_${d.name}" redefined` });
              if (d.init) prev.def = d;
              continue;
            }
            this.globals.set(d.name, { name: d.name, key: `v_${d.name}`, t, def: d, tu: ti, const: d.const });
          }
        } catch (e) { if (e instanceof CErr) this.error(e); else throw e; }
      }
    });
    // 2. génération par unité de compilation
    tus.forEach((tu, ti) => this.genTU(tu, ti));
    // 3. édition des liens
    if (!this.funcs.get('main') && !this.errors.length) this.errors.push({ fr: "Pas de fonction main() dans le projet : écris void main(void) { … } dans un des fichiers .c.", file: this.files[0] ? this.files[0].name : '', line: 0, ccs: 'unresolved symbols remain: _c_int00 needs "_main"', code: '#10234-D', link: true });
    for (const [name, at] of this.missing) {
      this.errors.push({ fr: `La fonction ${name}() est appelée mais n'est définie nulle part dans le projet (faute de frappe ? fonction oubliée ? fichier .c manquant ?).`, file: at.file, line: at.line, ccs: `unresolved symbols remain: undefined first referenced symbol "_${name}"`, code: '#10234-D', link: true });
    }
  }
  genTU(tu, ti) {
    const vis = new Map();     // variables globales visibles dans cette unité
    const visF = new Set();    // fonctions déclarées dans cette unité
    const tuCtx = { ti, vis, visF, file: tu.file };
    for (const d of tu.decls) {
      try {
        if (d.k === 'proto') {
          const sym = d.static ? this.sfuncs.get(`${ti}:${d.name}`) : this.funcs.get(d.name);
          if (sym) this.checkProto(d, sym);
          visF.add(d.name);
          if (!sym && !d.static) { /* prototype sans définition : erreur seulement si appelée */ }
        } else if (d.k === 'func') {
          visF.add(d.name);
          const sym = d.static ? this.sfuncs.get(`${ti}:${d.name}`) : this.funcs.get(d.name);
          if (!sym || sym.def !== d) continue;
          this.genFunc(d, sym, tuCtx);
        } else if (d.k === 'var') {
          if (d.extern) {
            const g = this.globals.get(d.name);
            if (!g) { this.missing.set(d.name, d.tok); vis.set(d.name, { c: `G.x_${d.name}`, t: this.declType(d.t, d.dims, null, d.tok, true), name: d.name }); continue; }
            vis.set(d.name, { c: `G.${g.key}`, t: g.t, name: d.name, const: g.const });
            continue;
          }
          const g = d.static ? this.sglobals.get(`${ti}:${d.name}`) : this.globals.get(d.name);
          if (!g) continue;
          vis.set(d.name, { c: `G.${g.key}`, t: g.t, name: d.name, const: g.const });
          if (g.def === d || (!g.inited && !g.def.init)) {
            if (g.inited) continue; g.inited = true;
            const ctx = this.ctx(tuCtx, null); ctx.noCalls = 'init';
            this.inits.push(`G.${g.key}=${this.initValue(g.t, d.init, ctx, d.tok)};`);
          }
        }
      } catch (e) { if (e instanceof CErr) this.error(e); else throw e; }
    }
  }
  checkProto(p, sym) {
    const f = sym.def;
    const ok = sameT(p.ret, f.ret) && p.params.length === f.params.length && p.params.every((q, i) => sameT(q.t, f.params[i].t) && (q.dims.length > 0) === (f.params[i].dims.length > 0));
    if (!ok) throw new CErr(`Le prototype de ${p.name}() ne correspond pas à sa définition (ligne ${f.tok.line}${f.tok.file !== p.tok.file ? ' de ' + f.tok.file : ''}) : vérifie le type de retour et les paramètres.`, p.tok, { ccs: `declaration is incompatible with previous "${p.name}"` });
  }
  ctx(tuCtx, fn) { return { tu: tuCtx, sc: [], fn, loop: 0, sw: 0, noCalls: false, temps: fn ? fn.temps : { n: 0 } }; }
  tmp(ctx) { const n = ++ctx.temps.n; return `__t${n}`; }
  localKey(fn, name) { const c = (fn.keys.get(name) || 0); fn.keys.set(name, c + 1); return c ? `${name}_${c}` : name; }
  M(tok, ctx) { return `if(__s(${tok.line},${this.fi(tok.file)}))yield 0;`; }

  genFunc(d, sym, tuCtx) {
    const meta = this.fnList[sym.fid];
    const fn = { name: d.name, ret: d.ret, keys: new Map(), temps: { n: 0 }, meta };
    const ctx = this.ctx(tuCtx, fn);
    ctx.sc.push(new Map());
    const pcode = [];
    d.params.forEach((p, i) => {
      if (!p.name) throw new CErr(`Le paramètre n°${i + 1} de ${d.name}() n'a pas de nom.`, p.tok, { ccs: 'expected an identifier' });
      if (ctx.sc[0].has(p.name)) throw new CErr(`Deux paramètres s'appellent « ${p.name} ».`, p.tok, { ccs: `duplicate parameter name` });
      const key = this.localKey(fn, p.name);
      const t = p.dims.length ? this.declType(p.t, p.dims, null, p.tok, true) : p.t;
      ctx.sc[0].set(p.name, { c: `L.${key}`, t, name: p.name });
      meta.locals.push({ name: p.name, key, t, param: true });
      pcode.push(`L.${key}=a${i};`);
    });
    if (d.name === 'main' && d.params.length) this.warn('main() ne reçoit pas de paramètres sur le DSP.', d.tok);
    let body = '';
    for (const s of d.body.items) {
      try { body += this.stmt(s, ctx); }
      catch (e) { if (e instanceof CErr) { this.error(e); return; } throw e; }
    }
    const temps = ctx.temps.n ? `let ${Array.from({ length: ctx.temps.n }, (_, i) => `__t${i + 1}`).join(',')};` : '';
    const endTok = { line: d.endLine || d.body.end.line, file: d.tok.file };
    this.code.push(`function* ${sym.js}(${d.params.map((_, i) => 'a' + i).join(',')}){const L={};${pcode.join('')}${temps}__enter(${sym.fid},L);${body}${this.M(endTok, ctx)}__leave();return 0;}`);
  }

  /* --- valeurs initiales --- */
  initValue(t, init, ctx, tok) {
    if (t.k === 'arr') return this.arrInit(t, init, ctx, tok);
    if (!init) return '0';
    let e = init;
    if (init.k === 'list') { if (init.items.length !== 1 || init.items[0].k === 'list') throw new CErr(`« ${tok.v} » n'est pas un tableau : une seule valeur, sans accolades.`, tok, { ccs: 'too many initializer values' }); e = init.items[0]; }
    const E = this.expr(e, ctx); this.needArith(E, e);
    return conv(E, t);
  }
  arrInit(t, init, ctx, tok) {
    if (!init) return this.zeros(t);
    if (init.k === 'str') {
      if (t.elem.k !== 'int') throw new CErr('Une chaîne ne peut initialiser qu\'un tableau de char.', tok);
      const codes = Array.from(init.v).map(c => c.charCodeAt(0)); codes.push(0);
      if (codes.length - 1 > t.n) throw new CErr(`Chaîne trop longue pour ${tok.v}[${t.n}].`, tok, { ccs: 'too many initializer values' });
      while (codes.length < t.n) codes.push(0);
      return `[${codes.slice(0, t.n).join(',')}]`;
    }
    if (init.k !== 'list') throw new CErr(`Un tableau s'initialise avec des accolades : ${tok.v}[] = { 1, 2, 3 };`, tok, { ccs: 'initialization with "{...}" expected' });
    let items = init.items;
    if (t.elem.k === 'arr') {
      if (!items.every(x => x.k === 'list')) {
        const per = sizeOf(t.elem) / sizeOf(this.base(t.elem));
        const groups = []; for (let i = 0; i < items.length; i += per) groups.push({ k: 'list', items: items.slice(i, i + per), tok: init.tok });
        items = groups;
      }
      if (items.length > t.n) throw new CErr(`Trop de valeurs : ${tok.v} a ${t.n} lignes.`, tok, { ccs: 'too many initializer values' });
      const rows = []; for (let i = 0; i < t.n; i++) rows.push(items[i] ? this.arrInit(t.elem, items[i], ctx, tok) : this.zeros(t.elem));
      return `[${rows.join(',')}]`;
    }
    if (items.length > t.n) throw new CErr(`Trop de valeurs : le tableau ${tok.v} a ${t.n} cases mais ${items.length} valeurs sont données.`, tok, { ccs: 'too many initializer values' });
    const vals = items.map(x => {
      if (x.k === 'list') throw new CErr('Accolades en trop dans les valeurs du tableau.', x.tok, { ccs: 'expected an expression' });
      const E = this.expr(x, ctx); this.needArith(E, x); return conv(E, t.elem);
    });
    if (vals.length < t.n) return t.n - vals.length > 64 ? `__pad([${vals.join(',')}],${t.n})` : `[${vals.concat(Array(t.n - vals.length).fill('0')).join(',')}]`;
    return `[${vals.join(',')}]`;
  }
  base(t) { while (t.k === 'arr') t = t.elem; return t; }
  zeros(t) { if (t.elem.k === 'arr') return `__arr2(${t.n},()=>${this.zeros(t.elem)})`; return `__zeros(${t.n})`; }

  /* --- instructions --- */
  sub(s, ctx) {
    if (s.k === 'decl') throw new CErr('Une déclaration de variable doit être dans un bloc { } ici.', s.tok, { ccs: 'a declaration cannot have a label' });
    if (s.k === 'block') return this.block(s, ctx);
    return this.stmt(s, ctx);
  }
  block(b, ctx) {
    ctx.sc.push(new Map());
    let code = '';
    try { for (const s of b.items) code += this.stmt(s, ctx); }
    finally { ctx.sc.pop(); }
    return code;
  }
  condCode(e, ctx, kw) {
    if (e.k === 'assign' && e.op === '=' && !e.paren) this.warn(`Dans la condition du ${kw}, « = » est une affectation (elle change la variable). Pour comparer, écris « == ».`, e.tok, { code: '#187-D', ccs: 'use of "=" where "==" may have been intended' });
    const E = this.expr(e, ctx); this.needArith(E, e);
    return E.c;
  }
  localDecl(d, ctx) {
    const fn = ctx.fn, scope = ctx.sc[ctx.sc.length - 1];
    if (d.k === 'proto') { ctx.tu.visF.add(d.name); return ''; }
    if (scope.has(d.name)) throw new CErr(`La variable « ${d.name} » est déjà déclarée dans ce bloc.`, d.tok, { ccs: `"${d.name}" has already been declared in the current scope` });
    if (d.extern) {
      const g = this.globals.get(d.name);
      if (!g) { this.missing.set(d.name, d.tok); return ''; }
      scope.set(d.name, { c: `G.${g.key}`, t: g.t, name: d.name }); return '';
    }
    const t = this.declType(d.t, d.dims, d.init, d.tok, false);
    if (d.static) {
      const key = `l${fn.meta === undefined ? 0 : this.fnList.indexOf(fn.meta)}_${this.localKey(fn, d.name)}`;
      const ictx = this.ctx(ctx.tu, null); ictx.sc = ctx.sc.slice(0, 0); ictx.noCalls = 'init';
      this.inits.push(`G.${key}=${this.initValue(t, d.init, ictx, d.tok)};`);
      scope.set(d.name, { c: `G.${key}`, t, name: d.name, const: d.const });
      fn.meta.locals.push({ name: d.name, key, t, static: true, g: true });
      return '';
    }
    const key = this.localKey(fn, d.name);
    const val = this.initValue(t, d.init, ctx, d.tok);
    scope.set(d.name, { c: `L.${key}`, t, name: d.name, const: d.const });
    fn.meta.locals.push({ name: d.name, key, t });
    return (d.init ? this.M(d.tok, ctx) : '') + `L.${key}=${val};`;
  }
  stmt(s, ctx) {
    switch (s.k) {
      case 'block': return this.block(s, ctx);
      case 'empty': return '';
      case 'decl': return s.decls.map(d => this.localDecl(d, ctx)).join('');
      case 'expr': {
        const E = this.expr(s.e, ctx);
        const e = s.e;
        if (e.k === 'bin' && CMP.has(e.op)) this.warn(`Cette ligne compare (${e.op}) sans rien faire du résultat. Pour donner une valeur, écris « = » et pas « == ».`, e.tok, { code: '#174-D', ccs: 'expression has no effect' });
        else if (e.k === 'id' || e.k === 'num' || (e.k === 'bin' && !['&&', '||'].includes(e.op))) this.warn('Cette ligne calcule une valeur mais ne la range nulle part : elle n\'a aucun effet.', e.tok || s.tok, { code: '#174-D', ccs: 'expression has no effect' });
        return `${this.M(s.tok, ctx)}${E.c};`;
      }
      case 'if': {
        if (s.semi) this.warn("Point-virgule juste après la parenthèse du if : le if ne contrôle rien, la ligne suivante s'exécute toujours.", s.tok, { ccs: 'empty controlled statement' });
        const c = this.condCode(s.c, ctx, 'if');
        const a = this.sub(s.a, ctx), b = s.b ? this.sub(s.b, ctx) : null;
        return `${this.M(s.tok, ctx)}if(${c}){${a}}${b !== null ? `else{${b}}` : ''}`;
      }
      case 'while': {
        const c = this.condCode(s.c, ctx, 'while');
        ctx.loop++; const b = this.sub(s.body, ctx); ctx.loop--;
        return `for(;;){${this.M(s.tok, ctx)}if(!(${c}))break;${b}}`;
      }
      case 'do': {
        ctx.loop++; const b = this.sub(s.body, ctx); ctx.loop--;
        const c = this.condCode(s.c, ctx, 'while');
        return `do{${b}}while((__s(${s.wtok.line},${this.fi(s.wtok.file)})?((yield 0),1):1)&&(${c}));`;
      }
      case 'for': {
        ctx.sc.push(new Map());
        try {
          let init = '';
          if (s.init) init = s.init.k === 'decl' ? s.init.decls.map(d => this.localDecl(d, ctx)).join('') : `${this.M(s.tok, ctx)}${this.expr(s.init, ctx).c};`;
          const c = s.c ? this.condCode(s.c, ctx, 'for') : null;
          const inc = s.inc ? this.expr(s.inc, ctx).c : '';
          ctx.loop++; const b = this.sub(s.body, ctx); ctx.loop--;
          return `{${init}for(;;${inc}){${this.M(s.tok, ctx)}${c !== null ? `if(!(${c}))break;` : ''}${b}}}`;
        } finally { ctx.sc.pop(); }
      }
      case 'switch': {
        const E = this.expr(s.e, ctx);
        if (E.t.k !== 'int') throw new CErr('switch attend une valeur entière (pas un float ni un tableau).', s.e.tok || s.tok, { ccs: 'expression must have integral type' });
        const items = s.body.k === 'block' ? s.body.items : [s.body];
        ctx.sw++; ctx.sc.push(new Map());
        let code = ''; const seen = new Set(); let def = false;
        try {
          for (const it of items) {
            if (it.k === 'case') {
              let v = constEval(it.e); v = wrapVal(E.t, Math.trunc(v));
              if (seen.has(v)) throw new CErr(`case ${v} apparaît deux fois dans ce switch.`, it.tok, { ccs: 'duplicate case label value' });
              seen.add(v); code += `case ${v}:`; continue;
            }
            if (it.k === 'default') { if (def) throw new CErr('Deux « default: » dans le même switch.', it.tok, { ccs: 'switch statement already has a default' }); def = true; code += 'default:'; continue; }
            code += this.stmt(it, ctx);
          }
        } finally { ctx.sc.pop(); ctx.sw--; }
        return `${this.M(s.tok, ctx)}switch(${E.c}){${code}}`;
      }
      case 'case': case 'default': throw new CErr(`« ${s.k} » doit se trouver directement dans un switch.`, s.tok, { ccs: 'a case label may only be used within a switch' });
      case 'break': if (!ctx.loop && !ctx.sw) throw new CErr("break en dehors d'une boucle ou d'un switch.", s.tok, { ccs: 'a break statement may only be used within a loop or switch' }); return `${this.M(s.tok, ctx)}break;`;
      case 'continue': if (!ctx.loop) throw new CErr("continue en dehors d'une boucle.", s.tok, { ccs: 'a continue statement may only be used within a loop' }); return `${this.M(s.tok, ctx)}continue;`;
      case 'return': {
        const ret = ctx.fn.ret;
        if (!s.e) { if (ret.k !== 'void') this.warn(`${ctx.fn.name}() doit renvoyer une valeur (${typeStr(ret)}) : return seul renvoie une valeur imprévisible.`, s.tok, { ccs: 'return value type does not match the function type' }); return `${this.M(s.tok, ctx)}{__leave();return 0;}`; }
        const E = this.expr(s.e, ctx);
        if (ret.k === 'void') { if (E.t.k !== 'void') this.warn(`${ctx.fn.name}() est void : elle ne peut pas renvoyer de valeur.`, s.tok, { ccs: 'return value type does not match the function type' }); return `${this.M(s.tok, ctx)}{${E.c};__leave();return 0;}`; }
        this.needArith(E, s.e);
        return `${this.M(s.tok, ctx)}{const __rv=${conv(E, ret)};__leave();return __rv;}`;
      }
      case 'builtin': {
        const m = this.M(s.tok, ctx);
        if (s.name === 'EALLOW') return `${m}__eallow(1);`;
        if (s.name === 'EDIS') return `${m}__eallow(0);`;
        if (s.name === 'ESTOP0') return `${m}if(__estop())yield 0;`;
        return `${m}__lib(${JSON.stringify(s.name)});`;
      }
      case 'asm': {
        const op = s.text.trim().toUpperCase();
        const m = this.M(s.tok, ctx);
        if (op === 'EALLOW') return `${m}__eallow(1);`;
        if (op === 'EDIS') return `${m}__eallow(0);`;
        if (op === 'ESTOP0') return `${m}if(__estop())yield 0;`;
        if (op === 'NOP' || op === 'RPT #0 || NOP') return m;
        if (/^(CLRC|SETC)\s+(INTM|DBGM)/.test(op)) return m;
        this.warn(`Instruction assembleur « ${s.text.trim()} » ignorée par le simulateur.`, s.tok);
        return m;
      }
    }
    throw new CErr('Instruction non prise en charge.', s.tok);
  }

  /* --- expressions --- */
  needArith(E, node) {
    const tok = (node && node.tok) || {};
    if (E.t.k === 'void') throw new CErr('Cette fonction est void : elle ne renvoie pas de valeur utilisable.', tok, { ccs: 'expression must have arithmetic type' });
    if (E.t.k === 'arr') throw new CErr(`« ${this.nameOf(node)} » est un tableau : utilise une case, par exemple ${this.nameOf(node)}[0].`, tok, { ccs: 'expression must have arithmetic type' });
    if (E.t.k === 'str') throw new CErr('Les chaînes de caractères ne s\'utilisent que dans printf.', tok, { ccs: 'expression must have arithmetic type' });
  }
  needInt(E, node, op) {
    this.needArith(E, node);
    if (E.t.k !== 'int') throw new CErr(`L'opérateur ${op} ne s'applique qu'aux entiers (pas aux float).`, (node && node.tok) || {}, { ccs: 'expression must have integral type' });
  }
  nameOf(n) { return n && n.k === 'id' ? n.name : n && n.k === 'index' ? this.nameOf(n.a) + '[…]' : 'cette expression'; }
  lookup(name, ctx) {
    for (let s = ctx.sc.length - 1; s >= 0; s--) { const v = ctx.sc[s].get(name); if (v) return v; }
    return ctx.tu.vis.get(name) || null;
  }
  funcSym(name, ctx) { return this.sfuncs.get(`${ctx.tu.ti}:${name}`) || this.funcs.get(name) || null; }
  undefinedErr(name, tok, ctx) {
    const cands = new Set();
    for (const s of ctx.sc) for (const k of s.keys()) cands.add(k);
    for (const k of ctx.tu.vis.keys()) cands.add(k);
    for (const k of this.funcs.keys()) cands.add(k);
    ['GpioCtrlRegs', 'GpioDataRegs', 'EALLOW', 'EDIS', 'DELAY_US', 'InitSysCtrl'].forEach(k => cands.add(k));
    let best = null, bd = 9;
    for (const c of cands) { const d = c.toLowerCase() === name.toLowerCase() ? 0 : lev(c, name); if (d < bd && d <= 2) { bd = d; best = c; } }
    let fr = `« ${name} » n'est pas déclaré.`;
    if (best) fr += ` Tu voulais dire « ${best} » ? (Le C fait la différence entre majuscules et minuscules.)`;
    else if (this.globals.has(name)) { const g = this.globals.get(name); fr += ` Elle est définie dans ${g.def.tok.file} : ajoute « extern ${typeStr(g.t.k === 'arr' ? this.base(g.t) : g.t)} ${name}${g.t.k === 'arr' ? '[]' : ''}; » en haut de ce fichier, ou dans un .h que tu inclus.`; }
    else fr += ' Déclare-la avant de l\'utiliser (ex. Uint16 ' + name + ';).';
    return new CErr(fr, tok, { code: '#20', ccs: `identifier "${name}" is undefined` });
  }
  ident(n, ctx) {
    const v = this.lookup(n.name, ctx);
    if (v) return { c: v.c, t: v.t, lv: v.const ? null : { k: 'ref', c: v.c }, isConst: !!v.const };
    if (n.name === 'IER' || n.name === 'IFR') return { c: `G.$${n.name}`, t: named(T.u16, 'Uint16'), lv: { k: 'ref', c: `G.$${n.name}` } };
    if (GPIO_BASES.has(n.name)) throw new CErr(`${n.name} s'utilise avec un registre et un champ, par exemple ${n.name === 'GpioDataRegs' ? 'GpioDataRegs.GPADAT.bit.GPIO17' : 'GpioCtrlRegs.GPADIR.bit.GPIO9 = 1;'}`, n.tok, { ccs: 'expression must have arithmetic type' });
    if (GENERIC_BASES.has(n.name)) throw new CErr(`${n.name} s'utilise avec un champ (${n.name}.xxx).`, n.tok, { ccs: 'expression must have arithmetic type' });
    if (STMT_BUILTINS.has(n.name)) throw new CErr(`${n.name} s'écrit seul sur sa ligne : « ${n.name}; ».`, n.tok, { code: '#29', ccs: 'expected an expression' });
    if (this.funcSym(n.name, ctx) || LIB_FUNCS.has(n.name) || n.name === 'DELAY_US') throw new CErr(`${n.name} est une fonction : pour l'appeler, écris ${n.name}(…);`, n.tok, { ccs: 'expression must have arithmetic type' });
    throw this.undefinedErr(n.name, n.tok, ctx);
  }
  member(n, ctx) {
    const path = []; let b = n;
    while (b.k === 'member') { path.unshift(b.name); b = b.a; }
    if (b.k !== 'id') throw new CErr("Le point « . » s'utilise après le nom d'une structure de registres (ex. GpioDataRegs.GPADAT…).", n.tok, { ccs: 'expression must have struct or union type' });
    if (GPIO_BASES.has(b.name)) return this.gpioMember(b.name, path, n);
    if (GENERIC_BASES.has(b.name)) {
      const p = b.name + '.' + path.join('.');
      const chk = typeof AdcSim !== 'undefined' ? AdcSim.checkPath(b.name, path) : null;
      if (chk && chk.err) throw new CErr(chk.err, n.tok, { code: '#137', ccs: `struct has no field "${path[path.length - 1]}"` });
      const t = chk && chk.bits === 16 ? named(T.u16, 'Uint16') : named(T.u32, 'Uint32');
      return { c: `__gr(${JSON.stringify(p)})`, t, lv: { k: 'gen', path: p } };
    }
    const v = this.lookup(b.name, ctx);
    if (v) throw new CErr(`« ${b.name} » est une variable, pas une structure : le point « . » ne s'applique pas ici.`, n.tok, { ccs: 'expression must have struct or union type' });
    if (/^Gpio/i.test(b.name)) throw new CErr(`« ${b.name} » n'existe pas. Les structures GPIO s'écrivent GpioCtrlRegs (configuration) et GpioDataRegs (données).`, b.tok, { code: '#20', ccs: `identifier "${b.name}" is undefined` });
    throw this.undefinedErr(b.name, b.tok, ctx);
  }
  gpioMember(base, path, n) {
    const group = base === 'GpioCtrlRegs' ? 'ctrl' : 'data';
    const rname = path[0]; const R = REGIDX[rname];
    const sname = group === 'ctrl' ? 'GPIO_CTRL_REGS' : 'GPIO_DATA_REGS';
    if (!R) {
      const alt = Object.keys(REGIDX).find(k => k.toLowerCase() === rname.toLowerCase());
      const list = group === 'ctrl' ? 'GPxMUX1/2, GPxDIR, GPxPUD, GPxQSEL1/2, GPxCTRL' : 'GPxDAT, GPxSET, GPxCLEAR, GPxTOGGLE';
      throw new CErr(`${base}.${rname} n'existe pas.${alt ? ` Tu voulais dire ${alt} (en majuscules) ?` : ''} Registres possibles : ${list} (x = A, B ou C).`, n.tok, { ccs: `struct "${sname}" has no field "${rname}"` });
    }
    if (R.group !== group) throw new CErr(group === 'ctrl' ? `${rname} est un registre de données : écris GpioDataRegs.${rname}.` : `${rname} est un registre de configuration : écris GpioCtrlRegs.${rname} (entre EALLOW et EDIS).`, n.tok, { ccs: `struct "${sname}" has no field "${rname}"` });
    if (path.length === 1) throw new CErr(`Il manque la suite : ${base}.${rname}.bit.GPIOxx pour une broche, ou ${base}.${rname}.all pour tout le registre.`, n.tok, { ccs: 'expression must have arithmetic type' });
    const f1 = path[1];
    if (/^GPIO\d+$/.test(f1)) throw new CErr(`Il manque .bit : écris ${base}.${rname}.bit.${f1}.`, n.tok, { ccs: `union "${rname}_REG" has no field "${f1}"` });
    if (f1 === 'all') {
      if (path.length > 2) throw new CErr(`.all est déjà tout le registre : rien après.`, n.tok, { ccs: 'expression must have struct or union type' });
      return { c: `__rra(${R.id})`, t: named(T.u32, 'Uint32'), lv: { k: 'rega', id: R.id } };
    }
    if (f1 !== 'bit') throw new CErr(`${base}.${rname}.${f1} n'existe pas : pour une broche écris .bit.GPIOxx, pour tout le registre .all.`, n.tok, { ccs: `union "${rname}_REG" has no field "${f1}"` });
    const f2 = path[2];
    if (!f2) throw new CErr(`Il manque le nom de la broche : ${base}.${rname}.bit.GPIOxx.`, n.tok, { ccs: 'expression must have arithmetic type' });
    if (path.length > 3) throw new CErr(`Trop de champs après ${base}.${rname}.bit.${f2}.`, n.tok, { ccs: 'expression must have struct or union type' });
    if (R.kind === 'CTRL') {
      const m = /^QUALPRD([0-3])$/.exec(f2);
      if (!m) throw new CErr(`Dans ${rname}, les champs s'appellent QUALPRD0 à QUALPRD3.`, n.tok, { ccs: `struct has no field "${f2}"` });
      return { c: `__rr(${R.id},${+m[1]})`, t: named(T.u16, 'Uint16'), lv: { k: 'regb', id: R.id, n: +m[1] } };
    }
    const m = /^GPIO(\d+)$/.exec(f2);
    if (!m) throw new CErr(`Champ « ${f2} » inconnu dans ${rname} : écris .bit.GPIOxx (xx = numéro de la broche).${/^gpio\d+$/i.test(f2) ? ' Attention aux majuscules : GPIO.' : ''}`, n.tok, { ccs: `struct "${rname}_BITS" has no field "${f2}"` });
    if (m[1].length > 1 && m[1][0] === '0') throw new CErr(`« ${f2} » n'existe pas : les champs s'écrivent sans zéro devant le numéro, par exemple GPIO${+m[1]} (et non ${f2}).`, n.tok, { ccs: `struct "${rname}_BITS" has no field "${f2}"` });
    const pin = +m[1];
    if (pin > 87) throw new CErr(`GPIO${pin} n'existe pas : le F28335 va de GPIO0 à GPIO87.`, n.tok, { ccs: `struct "${rname}_BITS" has no field "${f2}"` });
    const P = portOf(pin);
    if (P !== R.P) throw new CErr(`GPIO${pin} n'est pas dans le port ${R.P} (GPIO${PORTS[R.P][0]} à GPIO${PORTS[R.P][1]}) mais dans le port ${P} : écris ${suggestReg(R.kind, pin)}.bit.GPIO${pin}.`, n.tok, { ccs: `struct "${rname}_BITS" has no field "${f2}"` });
    if (pin < R.lo || pin > R.hi) throw new CErr(`GPIO${pin} n'est pas dans ${rname} (GPIO${R.lo} à GPIO${R.hi}) : écris ${suggestReg(R.kind, pin)}.bit.GPIO${pin}.`, n.tok, { ccs: `struct "${rname}_BITS" has no field "${f2}"` });
    return { c: `__rr(${R.id},${pin})`, t: named(T.u16, 'Uint16'), lv: { k: 'regb', id: R.id, n: pin } };
  }
  index(n, ctx) {
    const A = this.expr(n.a, ctx);
    if (A.t.k !== 'arr') throw new CErr(`« ${this.nameOf(n.a)} » n'est pas un tableau : les crochets [ ] ne s'appliquent pas.`, n.tok, { ccs: 'expression must have pointer-to-object type' });
    const I = this.expr(n.i, ctx);
    if (I.t.k !== 'int') throw new CErr("L'indice d'un tableau doit être un entier.", n.i.tok || n.tok, { ccs: 'expression must have integral type' });
    const size = A.t.n;
    if (size != null) return { c: `${A.c}[__ck(${I.c},${size})]`, t: A.t.elem, lv: { k: 'elem', arr: A.c, idx: I.c, size } };
    const ta = this.tmp(ctx);
    return { c: `(${ta}=${A.c})[__ck(${I.c},${ta}.length)]`, t: A.t.elem, lv: { k: 'elem', arr: A.c, idx: I.c, size: null } };
  }
  store(L, valC, ctx) {
    const lv = L.lv;
    switch (lv.k) {
      case 'ref': return { c: `(${lv.c}=${valC})`, t: L.t };
      case 'elem': {
        if (lv.size != null) return { c: `(${lv.arr}[__ck(${lv.idx},${lv.size})]=${valC})`, t: L.t };
        const ta = this.tmp(ctx); return { c: `((${ta}=${lv.arr})[__ck(${lv.idx},${ta}.length)]=${valC})`, t: L.t };
      }
      case 'regb': return { c: `__rw(${lv.id},${lv.n},${valC})`, t: L.t };
      case 'rega': return { c: `__rwa(${lv.id},${valC})`, t: L.t };
      case 'gen': return { c: `__gw(${JSON.stringify(lv.path)},${valC})`, t: L.t };
    }
  }
  rmw(L, f, ctx) {
    const lv = L.lv;
    switch (lv.k) {
      case 'ref': return { c: `(${lv.c}=${f(lv.c)})`, t: L.t };
      case 'elem': { const ta = this.tmp(ctx), ti = this.tmp(ctx); const cur = `${ta}[${ti}]`; return { c: `(${ta}=${lv.arr},${ti}=__ck(${lv.idx},${lv.size != null ? lv.size : ta + '.length'}),${cur}=${f(cur)})`, t: L.t }; }
      case 'regb': return { c: `__rw(${lv.id},${lv.n},${f(`__rr(${lv.id},${lv.n})`)})`, t: L.t };
      case 'rega': return { c: `__rwa(${lv.id},${f(`__rra(${lv.id})`)})`, t: L.t };
      case 'gen': { const p = JSON.stringify(lv.path); return { c: `__gw(${p},${f(`__gr(${p})`)})`, t: L.t }; }
    }
  }
  lvalue(node, ctx, what) {
    if (ctx.noAssign) throw new CErr('Pas d\'affectation ni de ++/-- dans une expression surveillée.', node.tok || {});
    const L = this.expr(node, ctx);
    if (L.isConst) throw new CErr(`« ${this.nameOf(node)} » est déclarée const : sa valeur ne peut pas changer.`, node.tok || {}, { code: '#137', ccs: 'expression must be a modifiable lvalue' });
    if (!L.lv) throw new CErr(`On ne peut pas ${what} cette expression : à gauche il faut une variable, une case de tableau ou un champ de registre.`, node.tok || {}, { code: '#137', ccs: 'expression must be a modifiable lvalue' });
    if (L.t.k === 'arr') throw new CErr(`On ne peut pas ${what} un tableau entier : travaille case par case (${this.nameOf(node)}[i]).`, node.tok || {}, { code: '#137', ccs: 'expression must be a modifiable lvalue' });
    return L;
  }
  binCode(op, A, B, tok) {
    if (op === '&&' || op === '||') return { c: `(((${A.c})${op}(${B.c}))?1:0)`, t: T.i16 };
    if (A.lit && B.lit && !['/', '%'].includes(op) || (A.lit && B.lit && B.v !== 0)) {
      try {
        const t = (op === '<<' || op === '>>') ? A.t : CMP.has(op) ? T.i16 : usual(A.t, B.t);
        const v = this.foldBin(op, A, B);
        if (v !== null) return { c: String(v), t, lit: true, v };
      } catch (e) { /* pas de pliage */ }
    }
    if (op === '<<' || op === '>>') {
      if (A.t.k !== 'int' || B.t.k !== 'int') throw new CErr(`Le décalage ${op} ne s'applique qu'aux entiers.`, tok, { ccs: 'expression must have integral type' });
      const t = A.t;
      if (t.bits === 64) return { c: `__b64(${JSON.stringify(op)},${A.c},${B.c},${t.u ? 1 : 0})`, t };
      if (op === '<<') return { c: wrapC(t, `(${A.c})<<((${B.c})&31)`), t };
      return { c: (t.u && t.bits === 32) ? `((${A.c})>>>((${B.c})&31))` : `((${A.c})>>((${B.c})&31))`, t };
    }
    const t = usual(A.t, B.t);
    const a = conv(A, t), b = conv(B, t);
    if (CMP.has(op)) { const jo = op === '==' ? '===' : op === '!=' ? '!==' : op; return { c: `((${a})${jo}(${b})?1:0)`, t: T.i16 }; }
    if (t.k === 'float') {
      if (op === '%' || op === '&' || op === '|' || op === '^') throw new CErr(`L'opérateur ${op} ne s'applique qu'aux entiers, pas aux float.`, tok, { ccs: 'expression must have integral type' });
      return { c: `((${a})${op}(${b}))`, t };
    }
    if (t.bits === 64) return { c: `__b64(${JSON.stringify(op)},${a},${b},${t.u ? 1 : 0})`, t };
    switch (op) {
      case '+': case '-': return { c: wrapC(t, `(${a})${op}(${b})`), t };
      case '*': return { c: wrapC(t, `Math.imul(${a},${b})`), t };
      case '/': return { c: wrapC(t, `__div(${a},${b})`), t };
      case '%': return { c: wrapC(t, `__mod(${a},${b})`), t };
      case '&': case '|': case '^': return { c: wrapC(t, `(${a})${op}(${b})`), t };
    }
    throw new CErr(`Opérateur ${op} inconnu.`, tok);
  }
  foldBin(op, A, B) {
    if (op === '<<' || op === '>>') { if (A.t.k !== 'int' || A.t.bits === 64) return null; const v = op === '<<' ? A.v * Math.pow(2, B.v & 31) : (A.t.u ? Math.floor(A.v / Math.pow(2, B.v & 31)) : (A.v >> (B.v & 31))); return wrapVal(A.t, v); }
    const t = CMP.has(op) ? usual(A.t, B.t) : usual(A.t, B.t);
    if (t.k === 'int' && t.bits === 64) return null;
    const a = wrapVal(t, A.v), b = wrapVal(t, B.v);
    let v;
    switch (op) {
      case '+': v = a + b; break; case '-': v = a - b; break;
      case '*': v = t.k === 'float' ? a * b : Math.imul(a, b); break;
      case '/': if (b === 0) return null; v = t.k === 'float' ? a / b : Math.trunc(a / b); break;
      case '%': if (b === 0 || t.k === 'float') return null; v = a % b; break;
      case '&': case '|': case '^': if (t.k === 'float') return null; v = op === '&' ? a & b : op === '|' ? a | b : a ^ b; break;
      case '==': return +(a === b); case '!=': return +(a !== b); case '<': return +(a < b); case '>': return +(a > b); case '<=': return +(a <= b); case '>=': return +(a >= b);
      default: return null;
    }
    return wrapVal(t, v);
  }
  expr(n, ctx) {
    switch (n.k) {
      case 'num': return { c: String(n.v), t: n.t, lit: true, v: n.v };
      case 'str': return { c: JSON.stringify(n.v), t: { k: 'str', name: 'char *' } };
      case 'id': return this.ident(n, ctx);
      case 'member': return this.member(n, ctx);
      case 'index': return this.index(n, ctx);
      case 'un': {
        const A = this.expr(n.e, ctx); this.needArith(A, n.e);
        if (n.op === '!') return A.lit ? { c: String(A.v ? 0 : 1), t: T.i16, lit: true, v: A.v ? 0 : 1 } : { c: `((${A.c})?0:1)`, t: T.i16 };
        if (n.op === '+') return { c: A.c, t: A.t, lit: A.lit, v: A.v };
        if (n.op === '-') {
          if (A.lit && !(A.t.k === 'int' && A.t.bits === 64)) { const v = wrapVal(A.t, -A.v); return { c: String(v), t: A.t, lit: true, v }; }
          if (A.t.k === 'float') return { c: `(-(${A.c}))`, t: A.t };
          return { c: wrapC(A.t, `-(${A.c})`), t: A.t };
        }
        this.needInt(A, n.e, '~');
        if (A.t.bits === 64) return { c: `__b64("~",${A.c},0,${A.t.u ? 1 : 0})`, t: A.t };
        if (A.lit) { const v = wrapVal(A.t, ~A.v); return { c: String(v), t: A.t, lit: true, v }; }
        return { c: wrapC(A.t, `~(${A.c})`), t: A.t };
      }
      case 'bin': {
        const A = this.expr(n.a, ctx), B = this.expr(n.b, ctx);
        this.needArith(A, n.a); this.needArith(B, n.b);
        return this.binCode(n.op, A, B, n.tok);
      }
      case 'assign': {
        const L = this.lvalue(n.a, ctx, 'affecter une valeur à');
        const R = this.expr(n.b, ctx); this.needArith(R, n.b);
        if (n.op === '=') return this.store(L, conv(R, L.t), ctx);
        const op = n.op.slice(0, -1);
        return this.rmw(L, cur => conv(this.binCode(op, { c: cur, t: L.t }, R, n.tok), L.t), ctx);
      }
      case 'pre': case 'post': {
        const L = this.lvalue(n.e, ctx, n.op === '++' ? 'incrémenter' : 'décrémenter');
        this.needArith(L, n.e);
        const op = n.op === '++' ? '+' : '-', one = { c: '1', t: T.i16, lit: true, v: 1 };
        if (n.k === 'pre') return this.rmw(L, cur => conv(this.binCode(op, { c: cur, t: L.t }, one, n.tok), L.t), ctx);
        const to = this.tmp(ctx);
        const r = this.rmw(L, cur => `(${to}=${cur},${conv(this.binCode(op, { c: to, t: L.t }, one, n.tok), L.t)})`, ctx);
        return { c: `(${r.c},${to})`, t: L.t };
      }
      case 'cond': {
        const C = this.expr(n.c, ctx); this.needArith(C, n.c);
        const A = this.expr(n.a, ctx), B = this.expr(n.b, ctx);
        if (A.t.k === 'void' && B.t.k === 'void') return { c: `((${C.c})?(${A.c}):(${B.c}))`, t: T.void };
        this.needArith(A, n.a); this.needArith(B, n.b);
        const t = usual(A.t, B.t);
        return { c: `((${C.c})?(${conv(A, t)}):(${conv(B, t)}))`, t };
      }
      case 'comma': { const A = this.expr(n.a, ctx), B = this.expr(n.b, ctx); return { c: `(${A.c},${B.c})`, t: B.t }; }
      case 'cast': {
        const A = this.expr(n.e, ctx);
        if (n.t.k === 'void') return { c: `(${A.c},0)`, t: T.void };
        this.needArith(A, n.e);
        if (A.lit) { const v = n.t.k === 'int' ? wrapVal(n.t, Math.trunc(A.v)) : A.v; return { c: String(v), t: n.t, lit: true, v }; }
        return { c: conv(A, n.t), t: n.t };
      }
      case 'sizeofT': return { c: String(sizeOf(n.t)), t: named(T.u16, 'size_t'), lit: true, v: sizeOf(n.t) };
      case 'sizeofE': { const save = ctx.temps.n; const A = this.expr(n.e, ctx); ctx.temps.n = Math.max(save, ctx.temps.n); const v = sizeOf(A.t); return { c: String(v), t: named(T.u16, 'size_t'), lit: true, v }; }
      case 'addr': {
        if (n.e.k === 'id' && this.funcSym(n.e.name, ctx)) { this.warn(`L'adresse de ${n.e.name} est ignorée : les interruptions ne sont pas simulées.`, n.tok); return { c: '0', t: T.u32 }; }
        throw new CErr(PTR_MSG, n.tok, { ccs: 'pointers not supported by the simulator' });
      }
      case 'call': return this.call(n, ctx);
    }
    throw new CErr('Expression non prise en charge.', n.tok || {});
  }
  call(n, ctx) {
    if (n.f.k !== 'id') throw new CErr("Seul un nom de fonction peut être suivi de parenthèses ( ).", n.tok, { ccs: 'expression preceding parentheses of apparent call must have (pointer-to-) function type' });
    const name = n.f.name, tok = n.f.tok;
    if (this.lookup(name, ctx)) throw new CErr(`« ${name} » est une variable, pas une fonction : enlève les parenthèses.`, tok, { ccs: 'expression preceding parentheses of apparent call must have (pointer-to-) function type' });
    if (ctx.noCalls === 'watch') throw new CErr('Pas d\'appel de fonction dans une expression surveillée.', tok);
    if (ctx.noCalls === 'init') throw new CErr(`La valeur initiale d'une variable globale doit être une constante : pas d'appel à ${name}().`, tok, { ccs: 'expression must have a constant value' });
    const args = n.args;
    const argc = k => { if (args.length !== k) throw new CErr(`${name}() attend ${k} argument${k > 1 ? 's' : ''}, ${args.length} donné${args.length > 1 ? 's' : ''}.`, tok, { code: args.length > k ? '#140' : '#165', ccs: args.length > k ? 'too many arguments in function call' : 'too few arguments in function call' }); };
    const user = this.funcSym(name, ctx);
    if (!user) {
      if (name === 'DELAY_US') { argc(1); const A = this.expr(args[0], ctx); this.needArith(A, args[0]); return { c: `(yield* __delay(${A.c}))`, t: T.void }; }
      if (name === 'printf') {
        if (!args.length || args[0].k !== 'str') throw new CErr('printf attend d\'abord une chaîne entre guillemets : printf("x = %d\\n", x);', tok);
        const rest = args.slice(1).map(a => { const E = this.expr(a, ctx); if (E.t.k !== 'str') this.needArith(E, a); return E; });
        return { c: `__printf(${JSON.stringify(args[0].v)},[${rest.map(e => e.c).join(',')}],${JSON.stringify(rest.map(e => ({ k: e.t.k, bits: e.t.bits, u: e.t.u })))})`, t: T.i16 };
      }
      if (name === 'abs' || name === 'labs' || name === 'fabs') { argc(1); const A = this.expr(args[0], ctx); this.needArith(A, args[0]); return { c: name === 'fabs' ? `Math.abs(${A.c})` : wrapC(A.t, `Math.abs(${A.c})`), t: A.t }; }
      if (LIB_FUNCS.has(name)) {
        if (name === 'InitGpio') this.warn('InitGpio() : simulée comme un reset des GPIO (toutes en entrée, mode GPIO).', tok);
        args.forEach(a => { if (a.k !== 'addr') { const E = this.expr(a, ctx); if (E.t.k === 'str') throw new CErr('Argument inattendu.', a.tok); } });
        return { c: `__lib(${JSON.stringify(name)})`, t: T.void };
      }
      this.warn(`${name}() est appelée sans avoir été déclarée avant : ajoute son prototype en haut du fichier.`, tok, { code: '#225-D', ccs: `function "${name}" declared implicitly` });
      if (!this.missing.has(name)) this.missing.set(name, tok);
      args.forEach(a => this.expr(a, ctx));
      return { c: '0', t: T.i16 };
    }
    if (!ctx.tu.visF.has(name)) {
      this.warn(`${name}() est utilisée avant d'être déclarée : ajoute son prototype en haut du fichier, par exemple « ${typeStr(user.ret)} ${name}(${user.params.length ? user.params.map(p => typeStr(p.t) + (p.dims.length ? ' ' + (p.name || 't') + '[]' : ' ' + (p.name || 'x'))).join(', ') : 'void'}); ».`, tok, { code: '#225-D', ccs: `function "${name}" declared implicitly` });
    }
    argc(user.params.length);
    const codes = user.params.map((p, i) => {
      const a = args[i]; const E = this.expr(a, ctx);
      if (p.dims.length) {
        if (E.t.k !== 'arr') throw new CErr(`Le paramètre ${i + 1} de ${name}() est un tableau : passe le nom du tableau, sans crochets.`, a.tok || tok, { ccs: 'argument of type is incompatible with parameter' });
        return E.c;
      }
      this.needArith(E, a);
      return conv(E, p.t);
    });
    return { c: `(yield* ${user.js}(${codes.join(',')}))`, t: user.ret };
  }

  /* --- expression surveillée (vue Expressions) --- */
  watch(text, frameLocals, allGlobals) {
    const toks = []; lexLine(text, 1, '(expression)', toks);
    const p = new Parser(toks, '(expression)');
    const node = p.expr();
    if (p.cur.t !== 'eof') throw new CErr(`« ${shown(p.cur)} » en trop.`, p.cur);
    const tuCtx = { ti: -1, vis: allGlobals, visF: new Set(), file: '(expression)' };
    const ctx = { tu: tuCtx, sc: [frameLocals || new Map()], fn: null, loop: 0, sw: 0, noCalls: 'watch', noAssign: true, temps: { n: 0 } };
    const E = this.expr(node, ctx);
    if (E.t.k === 'void' || E.t.k === 'str') throw new CErr('Expression sans valeur.', node.tok || {});
    const temps = ctx.temps.n ? `let ${Array.from({ length: ctx.temps.n }, (_, i) => `__t${i + 1}`).join(',')};` : '';
    return { code: `${temps}return (${E.c});`, t: E.t };
  }
}

/* ---------------- Compilation d'un projet ---------------- */
function compile(files) {
  const errors = [], warns = [];
  const fmap = new Map(files.map(f => [f.name.toLowerCase(), f]));
  const cfiles = files.filter(f => /\.c$/i.test(f.name));
  const tus = [];
  if (!cfiles.length) errors.push({ fr: 'Aucun fichier .c dans le projet.', file: '', line: 0, ccs: 'no input files' });
  for (const f of cfiles) {
    try {
      const toks = preprocess(f, fmap);
      const p = new Parser(toks, f.name);
      tus.push({ file: f.name, decls: p.parseTU() });
    } catch (e) {
      if (e instanceof CErr) errors.push({ fr: e.fr, file: e.file || f.name, line: e.line, ccs: e.ccs, code: e.code, tu: f.name });
      else throw e;
    }
  }
  if (errors.length) return { ok: false, errors, warns, files };
  const g = new Gen(files);
  g.run(tus);
  warns.push(...g.warns);
  if (g.errors.length) return { ok: false, errors: g.errors, warns, files };
  const main = g.funcs.get('main');
  const src = `"use strict";
const {__s,__rr,__rra,__rw,__rwa,__gr,__gw,__ck,__div,__mod,__w64,__b64,__zeros,__pad,__arr2,__enter,__leave,__delay,__eallow,__lib,__printf,__estop}=R;
const G=R.G;
${g.code.join('\n')}
function* __init(){${g.inits.join('')}}
function* __entry(){yield* __init();R.atMain();return yield* ${main.js}();}
return {entry:__entry};`;
  let factory;
  try { factory = new Function('R', src); }
  catch (e) { return { ok: false, errors: [{ fr: 'Erreur interne du simulateur pendant la compilation : ' + e.message + '. Simplifie la ligne en cause et signale-le.', file: files[0].name, line: 0, ccs: 'internal error' }], warns, files }; }
  const globals = [];
  for (const v of g.globals.values()) globals.push({ name: v.name, key: v.key, t: v.t, file: v.def.tok.file });
  for (const v of g.sglobals.values()) globals.push({ name: v.name, key: v.key, t: v.t, file: v.def.tok.file, static: true });
  const visAll = new Map();
  for (const v of globals) if (!visAll.has(v.name)) visAll.set(v.name, { c: `G.${v.key}`, t: v.t, name: v.name });
  return { ok: true, errors: [], warns, files, factory, funcs: g.fnList, globals, visAll, src, gen: g };
}

/* ---------------- Cible : GPIO du F28335 ---------------- */
class HW {
  constructor() {
    this.mux = new Uint8Array(88); this.dir = new Uint8Array(88); this.pud = new Uint8Array(88); this.lat = new Uint8Array(88); this.qsel = new Uint8Array(88);
    this.latT = new Float64Array(88).fill(-1);
    this.ctrlq = {}; this.generic = new Map(); this.eallow = 0;
    this.ext = () => undefined;
    this.adc = typeof AdcSim !== 'undefined' ? new AdcSim.Model(this) : null;
    this.listeners = [];
    this.logs = Array.from({ length: 88 }, () => ({ t: [], v: [] }));
    this.last = new Uint8Array(88).fill(9);
    this.now = () => 0;
    this.warn = () => {};
    this.reset();
  }
  reset() {
    this.mux.fill(0); this.dir.fill(0); this.lat.fill(0); this.qsel.fill(0); this.latT.fill(-1);
    for (let n = 0; n < 88; n++) this.pud[n] = n <= 11 ? 1 : 0;
    this.eallow = 0; this.generic.clear(); this.ctrlq = {};
    if (this.adc) this.adc.full();
    this.touchAll();
  }
  level(n) {
    if (this.mux[n] === 0 && this.dir[n] === 1) return this.lat[n];
    const e = this.ext(n);
    if (e === 0 || e === 1) return e;
    if (e === 'PU') return 1;
    if (e === 'PD') return 0;
    return this.pud[n] === 0 ? 1 : 2;
  }
  read(n, quiet) {
    const v = this.level(n);
    if (v === 2 && quiet) return Math.random() < 0.5 ? 0 : 1;
    if (v === 2) { this.warn('flot' + n, `GPIO${n} est lue alors qu'elle est « en l'air » : entrée, pull-up désactivée et rien ne fixe son niveau. La valeur lue est imprévisible (0 ou 1 au hasard).`); return Math.random() < 0.5 ? 0 : 1; }
    return v;
  }
  touch(n) {
    const v = this.level(n);
    if (this.mux[n] === 0 && this.dir[n] === 1) {
      const e = this.ext(n);
      if ((e === 0 || e === 1) && e !== this.lat[n]) this.warn('short' + n, `Court-circuit sur GPIO${n} : la broche est une SORTIE à ${this.lat[n]} alors que l'élément branché dessus impose ${e}. Une broche qui reçoit un signal (bouton, interrupteur…) doit être une ENTRÉE (DIR = 0).`);
    }
    if (v !== this.last[n]) {
      const old = this.last[n]; this.last[n] = v;
      const t = this.now(); const L = this.logs[n];
      if (L.t.length && L.t[L.t.length - 1] > t) { L.t.push(L.t[L.t.length - 1]); } else L.t.push(t);
      L.v.push(v);
      if (L.t.length > 30000) { L.t.splice(0, 10000); L.v.splice(0, 10000); }
      for (const f of this.listeners) f(n, v, old, t);
    }
  }
  touchAll() { for (let n = 0; n < 88; n++) this.touch(n); }
  clearLogs(t0) {
    for (let n = 0; n < 88; n++) { const L = this.logs[n]; L.t.length = 0; L.v.length = 0; const v = this.level(n); this.last[n] = v; L.t.push(t0); L.v.push(v); }
  }
  rr(id, n) {
    const R = REGS[id];
    if (R.kind === 'CTRL') return (this.ctrlq[id] || [0, 0, 0, 0])[n] || 0;
    if (R.field) return this[R.field][n];
    if (R.kind === 'DAT') return this.read(n);
    return 0;
  }
  rra(id) {
    const R = REGS[id];
    if (R.kind === 'CTRL') { const q = this.ctrlq[id] || [0, 0, 0, 0]; return ((q[0] & 255) | ((q[1] & 255) << 8) | ((q[2] & 255) << 16) | ((q[3] & 255) << 24)) >>> 0; }
    let r = 0;
    for (let n = R.lo; n <= R.hi; n++) {
      const b = n - R.lo;
      if (R.w === 2) r += (this[R.field][n] & 3) * Math.pow(4, b);
      else { const v = R.field ? this[R.field][n] : R.kind === 'DAT' ? this.read(n, !(this.watch && this.watch.has(n))) : 0; if (v) r += Math.pow(2, b); }
    }
    return r >>> 0;
  }
  guard(R) {
    if (R.group === 'ctrl' && !this.eallow) { this.warn('eal' + R.name, `Écriture dans GpioCtrlRegs.${R.name} ignorée : ce registre est protégé et EALLOW n'a pas été exécuté avant. (Sur la vraie carte : aucun message, la ligne est juste sans effet.)`); return false; }
    return true;
  }
  rw(id, n, v) {
    const R = REGS[id]; v = Number(v) || 0;
    if (R.group === 'ctrl') {
      if (R.kind === 'CTRL') { const val = v & 255; if (this.guard(R)) (this.ctrlq[id] || (this.ctrlq[id] = [0, 0, 0, 0]))[n] = val; return val; }
      const val = R.w === 2 ? (v & 3) : (v & 1);
      if (!this.guard(R)) return val;
      this[R.field][n] = val;
      this.touch(n); return val;
    }
    this.dataWrite(R, n, v & 1); return v & 1;
  }
  dataWrite(R, n, b) {
    const k = R.kind;
    if (k === 'SET' && !b) { this.warn('set0' + n, `Écrire 0 dans GpioDataRegs.${R.name}.bit.GPIO${n} ne fait rien. Pour mettre la sortie à 0, écris 1 dans GP${R.P}CLEAR.`); return; }
    if (k === 'CLEAR' && !b) { this.warn('clr0' + n, `Écrire 0 dans GpioDataRegs.${R.name}.bit.GPIO${n} ne fait rien : pour mettre une sortie à 0, on écrit 1 dans GP${R.P}CLEAR (et pas 0).`); return; }
    if (k === 'TOGGLE' && !b) return;
    if (k === 'DAT') this.lat[n] = b; else if (k === 'SET') this.lat[n] = 1; else if (k === 'CLEAR') this.lat[n] = 0; else this.lat[n] ^= 1;
    if (this.mux[n] !== 0) this.warn('mux' + n, `GPIO${n} n'est pas en mode GPIO (${muxName(n)} = ${this.mux[n]}) : un périphérique pilote la broche, ton écriture ne la change pas.`);
    if (this.dir[n] === 0) this.latT[n] = this.now(); else this.latT[n] = -1;
    this.touch(n);
  }
  rwa(id, v) {
    const R = REGS[id]; v = Number(v) >>> 0;
    if (R.group === 'ctrl') {
      if (!this.guard(R)) return v;
      if (R.kind === 'CTRL') { this.ctrlq[id] = [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; return v; }
      for (let n = R.lo; n <= R.hi; n++) { const b = n - R.lo; this[R.field][n] = R.w === 2 ? (Math.floor(v / Math.pow(4, b)) & 3) : ((v >>> b) & 1); this.touch(n); }
      return v;
    }
    for (let n = R.lo; n <= R.hi; n++) {
      const bit = (v >>> (n - R.lo)) & 1;
      if (R.kind === 'DAT') this.lat[n] = bit;
      else if (bit) { if (R.kind === 'SET') this.lat[n] = 1; else if (R.kind === 'CLEAR') this.lat[n] = 0; else this.lat[n] ^= 1; }
      this.touch(n);
    }
    return v;
  }
  gr(p) { if (this.adc && AdcSim.owns(p)) return this.adc.read(p); return this.generic.get(p) || 0; }
  gw(p, v) {
    if (this.adc && AdcSim.owns(p)) return this.adc.write(p, v);
    const base = p.split('.')[0]; this.warn('gen' + base, `${base} : écriture acceptée mais ce périphérique n'est pas simulé (seuls les GPIO, l'ADC et SysCtrlRegs.PCLKCR0 le sont).`); this.generic.set(p, v); return v;
  }
}

/* ---------------- Exécution ---------------- */
const COST_US = 0.05; // ~ 7 cycles à 150 MHz par instruction C
const perfNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
let tick = () => new Promise(r => setTimeout(r, 0));
if (typeof MessageChannel !== 'undefined') {
  const ch = new MessageChannel(); const q = [];
  ch.port1.onmessage = () => { const f = q.shift(); if (f) f(); };
  if (ch.port1.unref) ch.port1.unref();
  tick = () => new Promise(r => { q.push(r); ch.port2.postMessage(0); });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function b64(op, a, b, u) {
  const M = (1n << 64n) - 1n;
  let A = BigInt(Math.trunc(a)), B = BigInt(Math.trunc(b)), r;
  switch (op) {
    case '&': r = A & B; break; case '|': r = A | B; break; case '^': r = A ^ B; break;
    case '~': r = ~A; break; case '<<': r = A << (B & 63n); break; case '>>': r = A >> (B & 63n); break;
    case '+': r = A + B; break; case '-': r = A - B; break; case '*': r = A * B; break;
    case '/': if (B === 0n) throw new RunErr('Division par zéro.'); r = A / B; break;
    case '%': if (B === 0n) throw new RunErr('Modulo par zéro (% 0).'); r = A % B; break;
    default: r = 0n;
  }
  r &= M; if (!u && (r >> 63n)) r -= (1n << 64n);
  return Number(r);
}

class Machine {
  constructor(prog, hw, host) {
    this.prog = prog; this.hw = hw; this.host = host;
    this.vt = 0; this.stack = []; this.G = { $IER: 0, $IFR: 0 };
    this.bp = new Set(); this.step = null; this.pauseReq = null; this.state = 'loaded'; this.watchOn = false;
    this.count = 0; this.next = 256; this.sliceStart = 0; this.realStart = 0; this.pausedMs = 0; this.pauseT0 = 0; this.haltAtMain = false;
    this.base = { fid: -1, L: {}, line: 0, file: 0 }; this.top = this.base;
    const m = this;
    const R = {
      G: this.G,
      __s(line, fi) {
        const fr = m.top; fr.line = line; fr.file = fi; m.vt += COST_US;
        if (m.watchOn) {
          if (m.bp.size && m.bp.has(fi * 100000 + line)) { m.pauseReq = 'bp'; return true; }
          if (m.step && m.stepHit(line, fi)) return true;
        }
        if (++m.count >= m.next) { m.next = m.count + 256; return m.periodic(); }
        return false;
      },
      __rr: (i, n) => hw.rr(i, n), __rra: i => hw.rra(i), __rw: (i, n, v) => hw.rw(i, n, v), __rwa: (i, v) => hw.rwa(i, v),
      __gr: p => hw.gr(p), __gw: (p, v) => hw.gw(p, v),
      __ck(i, n) { if (!(i >= 0 && i < n)) throw new RunErr(`Indice ${i} hors du tableau : les indices valides vont de 0 à ${n - 1}. (Sur la vraie carte, aucune erreur ne s'affiche : le programme écrase une autre variable en mémoire.)`); return i; },
      __div(a, b) { if (b === 0) throw new RunErr('Division par zéro.'); return Math.trunc(a / b); },
      __mod(a, b) { if (b === 0) throw new RunErr('Modulo par zéro (% 0).'); return a % b; },
      __w64: w64, __b64: b64,
      __zeros: n => new Array(n).fill(0),
      __pad: (a, n) => { while (a.length < n) a.push(0); return a; },
      __arr2: (n, f) => Array.from({ length: n }, f),
      __enter(fid, L) { const fr = { fid, L, line: 0, file: 0 }; m.stack.push(fr); m.top = fr; if (m.stack.length > 200) throw new RunErr("Plus de 200 appels de fonctions imbriqués : une fonction s'appelle-t-elle elle-même sans fin ?"); },
      __leave() { m.stack.pop(); m.top = m.stack.length ? m.stack[m.stack.length - 1] : m.base; },
      *__delay(us) { us = Number(us); if (us > 0) m.vt += us; while (m.vt - m.rt() > 1000) yield 0; if (perfNow() - m.sliceStart > 12 || m.pauseReq) yield 0; return 0; },
      __eallow(v) { hw.eallow = v; },
      __lib(name) {
        if (hw.adc && hw.adc.lib(name)) return 0;
        if (name === 'InitGpio') { const e = hw.eallow; hw.eallow = 1; for (let n = 0; n < 88; n++) { hw.mux[n] = 0; hw.dir[n] = 0; hw.touch(n); } hw.eallow = e; }
        else if (name === 'EINT' || name === 'ERTM') m.host.info && m.host.info('int', 'Les interruptions ne sont pas simulées : EINT / ERTM sont sans effet ici.');
        return 0;
      },
      __printf(fmt, args, types) { m.host.print(cfmt(fmt, args, types)); return 0; },
      __estop() { m.pauseReq = 'estop'; return true; },
      atMain() { if (m.haltAtMain) { m.step = { kind: 'main' }; m.watchOn = true; } }
    };
    this.R = R;
    this.it = prog.factory(R).entry();
  }
  rt() { return (perfNow() - this.realStart - this.pausedMs) * 1000 * (this.speed || 1); }
  setSpeed(s) {
    s = Number(s) > 0 ? Number(s) : 1;
    if (this.state === 'running') { const r = this.rt(); this.speed = s; this.realStart = perfNow() - this.pausedMs - r / (1000 * s); }
    else { this.speed = s; this.rebase = true; }
  }
  setBreakpoints(set) { this.bp = set; this.watchOn = this.bp.size > 0 || !!this.step; }
  stepHit(line, fi) {
    const s = this.step, d = this.stack.length; let stop;
    if (s.kind === 'main') stop = true;
    else if (s.kind === 'into') stop = !(d === s.d && line === s.line && fi === s.fi);
    else if (s.kind === 'over') stop = d < s.d || (d === s.d && (line !== s.line || fi !== s.fi));
    else stop = d < s.d;
    if (stop) { this.step = null; this.watchOn = this.bp.size > 0; this.pauseReq = 'step'; }
    return stop;
  }
  periodic() {
    const rt = this.rt();
    // En retard sur l'horloge réelle (onglet en arrière-plan, PC occupé) : on décale l'origine
    // du temps réel plutôt que de sauter dans le temps simulé, qui reste continu.
    if (rt - this.vt > 20000) { this.realStart += (rt - this.vt) / (1000 * (this.speed || 1)); return (perfNow() - this.sliceStart > 12) || !!this.pauseReq; }
    return (this.vt - rt > 2000) || (perfNow() - this.sliceStart > 12) || !!this.pauseReq;
  }
  start(haltAtMain) {
    if (!this.speed) this.speed = Machine.defaultSpeed || 1;
    this.haltAtMain = !!haltAtMain; this.realStart = perfNow(); this.pausedMs = 0; this.state = 'running';
    this.host.state('running');
    this.go();
  }
  async go() {
    if (this.looping) return; this.looping = true;
    try {
      while (this.state === 'running') {
        if (this.pauseReq === 'user') { this.pauseReq = null; this.suspend('user'); return; }
        this.sliceStart = perfNow();
        let r;
        try { r = this.it.next(); }
        catch (e) { this.crash(e); return; }
        if (this.state !== 'running') return;
        if (r.done) { this.state = 'finished'; this.host.state('finished'); return; }
        if (this.pauseReq) { const why = this.pauseReq; this.pauseReq = null; this.suspend(why); return; }
        const ahead = this.vt - this.rt();
        if (ahead > 1000) await sleep(Math.min(ahead / 1000, 40)); else await tick();
      }
    } finally { this.looping = false; }
  }
  suspend(why) { this.state = 'suspended'; this.pauseT0 = perfNow(); this.host.state('suspended', why); }
  resume() {
    if (this.state !== 'suspended') return;
    this.pausedMs += perfNow() - this.pauseT0;
    if (this.rebase) { this.rebase = false; this.realStart = perfNow() - this.pausedMs - this.vt / (1000 * (this.speed || 1)); }
    this.state = 'running'; this.host.state('running'); this.go();
  }
  requestPause() { if (this.state === 'running') this.pauseReq = 'user'; }
  stepCmd(kind) {
    if (this.state !== 'suspended') return;
    const fr = this.top;
    this.step = { kind, d: this.stack.length, line: fr.line, fi: fr.file };
    this.watchOn = true;
    this.resume();
  }
  terminate() { if (this.state === 'running' || this.state === 'suspended' || this.state === 'loaded') { this.state = 'terminated'; this.host.state('terminated'); } }
  crash(e) {
    this.state = 'error';
    const fr = this.top;
    if (e instanceof RunErr) this.host.error(e.fr, fr.line, fr.file);
    else this.host.error('Erreur interne du simulateur : ' + (e && e.message ? e.message : String(e)), fr.line, fr.file);
    this.host.state('error');
  }
}

/* ---------------- Formatage des valeurs ---------------- */
function fmtVal(v, t, mode) {
  if (t.k === 'float') return Number.isInteger(v) ? v.toFixed(1) : String(Math.fround(v));
  if (t.k !== 'int') return String(v);
  const bits = t.bits;
  if (mode === 'hex' || mode === 'bin') {
    let u = Number(v); if (u < 0) u += Math.pow(2, bits);
    if (mode === 'hex') return '0x' + u.toString(16).toUpperCase().padStart(bits / 4, '0');
    const s = u.toString(2).padStart(bits, '0'); return '0b' + s.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  return String(v);
}

return { compile, HW, Machine, REGS, REGIDX, PORTS, portOf, muxName, T, typeStr, fmtVal, CErr, Gen, COST_US, cfmt };
})();
if (typeof module !== 'undefined') module.exports = Sim;

