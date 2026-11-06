/* ==========================================================================
   MODULE ADC DU TMS320F28335 (simulation)
   Registres AdcRegs / AdcMirror / SysCtrlRegs.PCLKCR0, séquenceurs SEQ1/SEQ2
   ou cascadé, modes start-stop et continu, drapeaux ADCST, résultats
   justifiés à gauche (RESULTx = N << 4) et copiés à droite dans AdcMirror.
   Noms et positions des bits : en-têtes TI DSP2833x_Adc.h / DSP2833x_SysCtrl.h.
   Le modèle est « paresseux » : il rattrape le temps simulé à chaque accès.
   ========================================================================== */
const AdcSim = (() => {
'use strict';

const F = (name, lo, w, desc, ro) => ({ name, lo, w: w || 1, desc: desc || '', ro: !!ro });
const REG = {
  ADCTRL1: { addr: 0x7100, desc: 'contrôle 1 : architecture, mode, fenêtre, reset', fields: [
    F('SEQ_CASC', 4, 1, '1 = cascadé (1 séquenceur 16 voies), 0 = double séquenceur (2 × 8)'),
    F('SEQ_OVRD', 5, 1, 'continu : 0 = retour à CONV00 en fin de séquence, 1 = continue'),
    F('CONT_RUN', 6, 1, '0 = start-stop (une séquence), 1 = continu'),
    F('CPS', 7, 1, '1 = horloge du cœur ADC divisée par 2'),
    F('ACQ_PS', 8, 4, 'fenêtre d\'acquisition = ACQ_PS + 1 périodes ADCCLK'),
    F('SUSMOD', 12, 2, 'comportement au point d\'arrêt (00 continue … 11 arrêt immédiat)'),
    F('RESET', 14, 1, '1 = reset de tout le module ADC (revient seul à 0)')] },
  ADCTRL2: { addr: 0x7101, desc: 'contrôle 2 : déclenchements, interruptions, reset séquenceurs', fields: [
    F('EPWM_SOCB_SEQ2', 0, 1, 'SOCB de l\'ePWM démarre SEQ2 (double séquenceur)'),
    F('INT_MOD_SEQ2', 2, 1, '0 = INT_SEQ2 à chaque fin de séquence, 1 = une fin sur deux'),
    F('INT_ENA_SEQ2', 3, 1, 'autorise l\'interruption de SEQ2'),
    F('SOC_SEQ2', 5, 1, '1 = démarrage logiciel de SEQ2'),
    F('RST_SEQ2', 6, 1, '1 = SEQ2 revient à CONV08'),
    F('EXT_SOC_SEQ1', 7, 1, 'la broche ADCSOC démarre SEQ1 / SEQ'),
    F('EPWM_SOCA_SEQ1', 8, 1, 'SOCA de l\'ePWM démarre SEQ1 / SEQ'),
    F('INT_MOD_SEQ1', 10, 1, '0 = INT_SEQ1 à chaque fin de séquence, 1 = une fin sur deux'),
    F('INT_ENA_SEQ1', 11, 1, 'autorise l\'interruption de SEQ1 / SEQ'),
    F('SOC_SEQ1', 13, 1, '1 = démarrage logiciel de SEQ1 / SEQ'),
    F('RST_SEQ1', 14, 1, '1 = SEQ1 / SEQ revient à CONV00'),
    F('EPWM_SOCB_SEQ', 15, 1, 'SOCB de l\'ePWM démarre SEQ (mode cascadé)')] },
  ADCMAXCONV: { addr: 0x7102, desc: 'nombre de conversions − 1 par séquence', fields: [
    F('MAX_CONV1', 0, 4, 'SEQ1 (ou SEQ en cascadé) : N − 1 conversions'),
    F('MAX_CONV2', 4, 3, 'SEQ2 : N − 1 conversions')] },
  ADCCHSELSEQ1: { addr: 0x7103, desc: 'voies converties en 1re à 4e position', fields: [0, 1, 2, 3].map(i => F('CONV0' + i, i * 4, 4, `voie (0–15) de la conversion n° ${i}`)) },
  ADCCHSELSEQ2: { addr: 0x7104, desc: 'voies converties en 5e à 8e position', fields: [4, 5, 6, 7].map((n, i) => F('CONV0' + n, i * 4, 4, `voie (0–15) de la conversion n° ${n}`)) },
  ADCCHSELSEQ3: { addr: 0x7105, desc: 'voies converties en 9e à 12e position', fields: [8, 9, 10, 11].map((n, i) => F('CONV' + String(n).padStart(2, '0'), i * 4, 4, `voie (0–15) de la conversion n° ${n}`)) },
  ADCCHSELSEQ4: { addr: 0x7106, desc: 'voies converties en 13e à 16e position', fields: [12, 13, 14, 15].map((n, i) => F('CONV' + n, i * 4, 4, `voie (0–15) de la conversion n° ${n}`)) },
  ADCASEQSR: { addr: 0x7107, desc: 'état des séquenceurs (lecture seule)', ro: true, fields: [
    F('SEQ1_STATE', 0, 4, 'position du pointeur de SEQ1', true), F('SEQ2_STATE', 4, 3, 'position du pointeur de SEQ2', true), F('SEQ_CNTR', 8, 4, 'conversions restantes', true)] },
  ADCTRL3: { addr: 0x7118, desc: 'contrôle 3 : alimentation et horloge ADCCLK', fields: [
    F('SMODE_SEL', 0, 1, '0 = échantillonnage séquentiel, 1 = simultané'),
    F('ADCCLKPS', 1, 4, 'diviseur d\'horloge : ADCCLK = HSPCLK / (2 × ADCCLKPS)'),
    F('ADCPWDN', 5, 1, '1 = cœur analogique alimenté'),
    F('ADCBGRFDN', 6, 2, '11 = référence et bandgap alimentés')] },
  ADCST: { addr: 0x7119, desc: 'état : drapeaux de fin de séquence et occupation', fields: [
    F('INT_SEQ1', 0, 1, 'drapeau de fin de séquence de SEQ1 / SEQ', true), F('INT_SEQ2', 1, 1, 'drapeau de fin de séquence de SEQ2', true),
    F('SEQ1_BSY', 2, 1, '1 = SEQ1 / SEQ en cours de conversion', true), F('SEQ2_BSY', 3, 1, '1 = SEQ2 en cours de conversion', true),
    F('INT_SEQ1_CLR', 4, 1, 'écrire 1 efface INT_SEQ1'), F('INT_SEQ2_CLR', 5, 1, 'écrire 1 efface INT_SEQ2'),
    F('EOS_BUF1', 6, 1, 'bascule à chaque fin de séquence de SEQ1', true), F('EOS_BUF2', 7, 1, 'bascule à chaque fin de séquence de SEQ2', true)] },
  ADCREFSEL: { addr: 0x711C, desc: 'choix de la référence (fixé par la calibration)', fields: [F('REF_SEL', 14, 2, '00 = référence interne')] },
  ADCOFFTRIM: { addr: 0x711D, desc: 'correction d\'offset (fixée par la calibration)', fields: [F('OFFSET_TRIM', 0, 9, 'offset en LSB')] }
};
for (let i = 0; i < 16; i++) REG['ADCRESULT' + i] = { addr: 0x7108 + i, desc: `résultat de la conversion n° ${i} (12 bits justifiés à gauche : N × 16)`, plain: true, ro: true };
const MIRROR = {};
for (let i = 0; i < 16; i++) MIRROR['ADCRESULT' + i] = { addr: 0x0B00 + i, desc: `résultat n° ${i} justifié à droite (0 à 4095, sans décalage)`, plain: true, ro: true };
const PCLKCR0 = { addr: 0x701C, desc: 'horloges des périphériques (protégé par EALLOW)', fields: [
  F('TBCLKSYNC', 2, 1, 'synchronisation des horloges des ePWM'), F('ADCENCLK', 3, 1, '1 = horloge de l\'ADC activée'),
  F('I2CAENCLK', 4), F('SCICENCLK', 5), F('SPIAENCLK', 8), F('SCIAENCLK', 10), F('SCIBENCLK', 11),
  F('MCBSPAENCLK', 12), F('MCBSPBENCLK', 13), F('ECANAENCLK', 14), F('ECANBENCLK', 15)] };
const PCLK_ALL = 0xFD38;   // ce que fait InitPeripheralClocks() de TI (sauf TBCLKSYNC)

const fieldOf = (R, name) => R && R.fields ? R.fields.find(f => f.name === name) : null;
const maskOf = f => ((1 << f.w) - 1) << f.lo;

function lev(a, b) {
  a = a.toUpperCase(); b = b.toUpperCase();
  if (Math.abs(a.length - b.length) > 3) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function closest(name, list) {
  let best = null, bd = 9;
  for (const n of list) { const d = n.toUpperCase() === name.toUpperCase() ? 0 : lev(name, n); if (d < bd) { bd = d; best = n; } }
  return bd <= 3 ? best : null;
}
const sug = (name, list) => { const b = closest(name, list); return b ? ` Tu voulais dire « ${b} » ?` : ''; };

/* Vérification à la compilation d'un accès AdcRegs.xxx / AdcMirror.xxx / SysCtrlRegs.PCLKCR0.xxx.
   Renvoie null (non géré), { bits: 16 } (accès valide) ou { err } (message en français). */
function checkPath(base, path) {
  let table, bname = base;
  if (base === 'AdcRegs') table = REG;
  else if (base === 'AdcMirror') table = MIRROR;
  else if (base === 'SysCtrlRegs') {
    if (path[0] !== 'PCLKCR0') { if (/^PCLKCR/i.test(path[0]) && path[0] !== 'PCLKCR0' && path[0].toUpperCase() === 'PCLKCR0') return { err: `Le registre s'écrit PCLKCR0 (majuscules).` }; return null; }
    table = { PCLKCR0 }; bname = 'SysCtrlRegs';
  } else return null;
  const rn = path[0];
  const R = table[rn];
  if (!R) {
    let extra = '';
    if (base === 'AdcMirror') extra = ' AdcMirror ne contient que ADCRESULT0 à ADCRESULT15 (résultats justifiés à droite).';
    else if (/RESULT/i.test(rn) && base === 'AdcRegs') extra = ' Les registres de résultat s\'appellent ADCRESULT0 à ADCRESULT15.';
    return { err: `${bname} n'a pas de registre « ${rn} ».${sug(rn, Object.keys(table))}${extra}` };
  }
  if (R.plain) {
    if (path.length > 1) return { err: `${bname}.${rn} est un registre simple de 16 bits : lis-le directement (${bname}.${rn}), sans .bit ni .all.` };
    return { bits: 16 };
  }
  if (path.length === 1) return { err: `${bname}.${rn} s'utilise avec .all (tout le registre) ou .bit.CHAMP (un champ), par exemple ${bname}.${rn}.bit.${R.fields[0].name}.` };
  if (path[1] === 'all') { if (path.length > 2) return { err: `Rien ne se met après .all.` }; return { bits: 16 }; }
  if (path[1] !== 'bit') return { err: `Après ${bname}.${rn}, on écrit .bit ou .all (pas « .${path[1]} »).${path[1].toLowerCase() === 'bits' ? ' C\'est « bit », sans s.' : ''}` };
  if (path.length !== 3) return { err: `Il manque le nom du champ : ${bname}.${rn}.bit.${R.fields[0].name} par exemple.` };
  const fn = path[2];
  if (!fieldOf(R, fn)) {
    let other = '';
    for (const [k, r2] of Object.entries(table)) if (k !== rn && fieldOf(r2, fn)) { other = ` Ce champ existe, mais dans ${bname}.${k}.`; break; }
    return { err: `${bname}.${rn} n'a pas de champ « ${fn} ».${other || sug(fn, R.fields.map(f => f.name))} Champs : ${R.fields.map(f => f.name).join(', ')}.` };
  }
  return { bits: 16 };
}
const owns = p => p.startsWith('AdcRegs.') || p.startsWith('AdcMirror.') || p.startsWith('SysCtrlRegs.PCLKCR0.');

/* ---------------- options (réglables dans Préférences) ---------------- */
const DEFAULTS = {
  vref: 3,                 // plage de conversion VREFHI − VREFLO (V)
  rounding: 'round',       // 'round' : N = arrondi(4095·V/3) ; 'floor' : troncature
  noiseLsb: 0,             // bruit gaussien (écart type, en LSB)
  offsetLsb: 0,            // erreur d'offset (LSB)
  convScale: 1,            // 1 = durée réaliste, 1000 = ralenti pour voir SEQ1_BSY
  floating: 'noise',       // voie non branchée : 'noise' ou 'zero'
  clockFromInit: false,    // InitSysCtrl() active ADCENCLK (comme la bibliothèque TI)
  needPower: false,        // sans InitAdc() / ADCTRL3, les conversions donnent 0
  socaHz: 1000, socbHz: 1000
};
const CH_NAME = ch => (ch < 8 ? 'ADCINA' + ch : 'ADCINB' + (ch - 8));
const fmtV = v => (Math.round(v * 1000) / 1000).toString().replace('.', ',');

class Model {
  constructor(hw) {
    this.hw = hw; this.opts = Object.assign({}, DEFAULTS);
    this.input = () => NaN;          // tension sur la voie ch à l'instant t (µs), fournie par le panneau Capteurs
    this.history = [];               // dernières conversions
    this.full();
  }
  warn(k, m) { this.hw.warn('adc-' + k, m); }
  note(k, m) { (this.hw.note || this.hw.warn)('adc-' + k, m); }
  now() { return typeof this.hw.now === 'function' ? this.hw.now() : 0; }
  full() { this.pclk = 0; this.calibrated = false; this.convTotal = 0; this.history.length = 0; this.reset(); }
  reset() {
    this.r = { ADCTRL1: 0, ADCTRL2: 0, ADCMAXCONV: 0, ADCCHSELSEQ1: 0, ADCCHSELSEQ2: 0, ADCCHSELSEQ3: 0, ADCCHSELSEQ4: 0, ADCTRL3: 0, ADCREFSEL: 0, ADCOFFTRIM: 0 };
    this.res = new Uint16Array(16);
    this.int1 = 0; this.int2 = 0; this.eos1 = 0; this.eos2 = 0; this.eosCnt1 = 0; this.eosCnt2 = 0;
    this.ptr1 = 0; this.ptr2 = 8; this.busy = null; this.pend1 = false; this.pend2 = false;
    this.socaNext = null; this.socbNext = null; this.t = this.now();
    this.lastReset = this.t; this.seqCount = 0;
  }
  /* --- état dérivé --- */
  get cascaded() { return (this.r.ADCTRL1 >> 4) & 1; }
  get contRun() { return (this.r.ADCTRL1 >> 6) & 1; }
  get seqOvrd() { return (this.r.ADCTRL1 >> 5) & 1; }
  get powered() { return ((this.r.ADCTRL3 >> 5) & 7) === 7; }
  get clockOn() { return (this.pclk >> 3) & 1; }
  chAt(p) { const reg = this.r['ADCCHSELSEQ' + (Math.floor(p / 4) + 1)]; return (reg >> ((p % 4) * 4)) & 15; }
  count(seq) {
    const m = this.r.ADCMAXCONV;
    if (seq === 1) return this.cascaded ? (m & 15) + 1 : (m & 7) + 1;
    return ((m >> 4) & 7) + 1;
  }
  adcclkMHz() {
    const hsp = 75; const ps = (this.r.ADCTRL3 >> 1) & 15;
    let f = ps ? hsp / (2 * ps) : hsp;
    if ((this.r.ADCTRL1 >> 7) & 1) f /= 2;
    return f;
  }
  tConv() { const acq = (this.r.ADCTRL1 >> 8) & 15; return ((acq + 2) / this.adcclkMHz()) * (this.opts.convScale || 1); }

  /* --- conversion d'une tension --- */
  sample(ch, t) {
    let v = Number(this.input(ch, t));
    if (!Number.isFinite(v)) {
      this.note('float' + ch, `Conversion de la voie ${ch} (${CH_NAME(ch)}) alors que rien n'y est branché : sur la carte, une entrée en l'air donne une valeur au hasard. Branche un capteur dans l'onglet « Capteurs ADC ».`);
      v = this.opts.floating === 'zero' ? 0 : Math.random() * this.opts.vref;
    }
    return v;
  }
  quantize(v, ch) {
    const VR = this.opts.vref || 3;
    if (v < 0 || v > VR) this.warn('range' + ch, `Voie ${ch} (${CH_NAME(ch)}) : la tension vaut ${fmtV(v)} V, hors de la plage 0–${fmtV(VR)} V. Le résultat sature à ${v < 0 ? 0 : 4095}. Sur la vraie carte, au-delà de 3,3 V ou sous 0 V l'entrée risque d'être détruite.`);
    if (!this.powered) {
      if (this.opts.needPower) { this.warn('pwr', 'ADC non alimenté : il manque l\'appel à InitAdc() / initADC() (ou ADCTRL3.bit.ADCBGRFDN = 3 et ADCPWDN = 1). Les conversions renvoient 0 (réglage « exiger la mise sous tension »).'); return 0; }
      this.note('pwr', 'Rappel : le cœur analogique n\'a pas été mis sous tension (InitAdc() / initADC(), étape de calibration). Le simulateur convertit quand même ; sur la vraie carte les résultats seraient faux.');
    }
    let x = 4095 * Math.max(0, Math.min(VR, v)) / VR + (this.opts.offsetLsb || 0);
    if (this.opts.noiseLsb > 0) { const u = Math.random() || 1e-9, w = Math.random(); x += this.opts.noiseLsb * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); }
    x = this.opts.rounding === 'floor' ? Math.floor(x) : Math.round(x);
    return Math.max(0, Math.min(4095, x));
  }

  /* --- moteur à événements (rattrape le temps simulé) --- */
  update(T) {
    if (T == null) T = this.now();
    let guard = 0;
    while (guard++ < 100000) {
      let tEv = Infinity, kind = null;
      if (this.busy) { tEv = this.busy.tEnd; kind = 'conv'; }
      if (this.socaNext != null && this.socaNext < tEv) { tEv = this.socaNext; kind = 'soca'; }
      if (this.socbNext != null && this.socbNext < tEv) { tEv = this.socbNext; kind = 'socb'; }
      if (tEv > T) break;
      if (kind === 'conv') this.finishConv();
      else if (kind === 'soca') { this.socaNext = tEv + 1e6 / Math.max(1, this.opts.socaHz); this.trigger(1, tEv, 'SOCA'); }
      else { this.socbNext = tEv + 1e6 / Math.max(1, this.opts.socbHz); this.trigger(this.cascaded ? 1 : 2, tEv, 'SOCB'); }
    }
    if (guard >= 100000) {   // retard énorme (mode continu jamais lu) : on saute directement à « maintenant »
      if (this.busy) { this.busy.tStart = T; this.busy.tEnd = T + this.tConv(); }
      if (this.socaNext != null) this.socaNext = T + 1e6 / Math.max(1, this.opts.socaHz);
      if (this.socbNext != null) this.socbNext = T + 1e6 / Math.max(1, this.opts.socbHz);
    }
    this.t = T;
  }
  startSeq(seq, t) {
    const c = this.count(seq);
    if (seq === 1 && !this.cascaded && (this.r.ADCMAXCONV & 15) > 7) this.warn('max1', `En double séquenceur, SEQ1 fait au plus 8 conversions : MAX_CONV1 = ${this.r.ADCMAXCONV & 15} est trop grand (0 à 7).`);
    const ptr = seq === 1 ? this.ptr1 : this.ptr2;
    const ch = this.chAt(ptr);
    this.busy = { seq, left: c, total: c, tStart: t, tEnd: t + this.tConv(), ch, v: this.sample(ch, t) };
    this.seqCount++;
  }
  finishConv() {
    const b = this.busy; const ptr = b.seq === 1 ? this.ptr1 : this.ptr2;
    const n = this.quantize(b.v, b.ch);
    this.res[ptr] = n; this.convTotal++;
    this.history.push({ t: b.tEnd, ch: b.ch, slot: ptr, v: b.v, n, seq: b.seq });
    if (this.history.length > 4000) this.history.splice(0, 1000);
    if (b.seq === 1) { const hi = this.cascaded ? 15 : 7; this.ptr1 = this.ptr1 >= hi ? 0 : this.ptr1 + 1; }
    else this.ptr2 = this.ptr2 >= 15 ? 8 : this.ptr2 + 1;
    b.left--;
    if (b.left > 0) {
      const np = b.seq === 1 ? this.ptr1 : this.ptr2;
      b.ch = this.chAt(np); b.tStart = b.tEnd; b.v = this.sample(b.ch, b.tStart); b.tEnd = b.tStart + this.tConv();
      return;
    }
    this.eos(b.seq, b.tEnd);
  }
  eos(seq, t) {
    const c2 = this.r.ADCTRL2;
    if (seq === 1) {
      this.eosCnt1++; this.eos1 ^= 1;
      if (!((c2 >> 10) & 1) || this.eosCnt1 % 2 === 0) this.int1 = 1;
      if ((c2 >> 11) & 1) this.note('isr1', 'INT_ENA_SEQ1 = 1 : le drapeau INT_SEQ1 passe bien à 1 en fin de séquence, mais les routines d\'interruption (PIE) ne sont pas simulées. Pour tester, détecte la fin de séquence en scrutant AdcRegs.ADCST.bit.INT_SEQ1 ou SEQ1_BSY.');
    } else {
      this.eosCnt2++; this.eos2 ^= 1;
      if (!((c2 >> 2) & 1) || this.eosCnt2 % 2 === 0) this.int2 = 1;
      if ((c2 >> 3) & 1) this.note('isr2', 'INT_ENA_SEQ2 = 1 : le drapeau INT_SEQ2 passe à 1, mais les routines d\'interruption ne sont pas simulées (scrute ADCST.bit.INT_SEQ2 ou SEQ2_BSY).');
    }
    this.busy = null;
    if (this.contRun) {
      if (!this.seqOvrd) { if (seq === 1) this.ptr1 = 0; else this.ptr2 = 8; }
      this.startSeq(seq, t);
      return;
    }
    if (this.pend1) { this.pend1 = false; this.startSeq(1, t); }
    else if (this.pend2) { this.pend2 = false; this.startSeq(2, t); }
  }
  trigger(seq, t, src) {
    if (seq === 2 && this.cascaded) { this.warn('soc2cas', 'SOC_SEQ2 ignoré : en mode cascadé (SEQ_CASC = 1) il n\'y a qu\'un séquenceur, déclenché par SOC_SEQ1.'); return; }
    if (this.busy) {
      if (this.busy.seq === seq && this.contRun) return;
      if (seq === 1) this.pend1 = true; else this.pend2 = true;
      return;
    }
    if (this.r.ADCCHSELSEQ1 === 0 && this.r.ADCCHSELSEQ2 === 0 && this.r.ADCCHSELSEQ3 === 0 && this.r.ADCCHSELSEQ4 === 0 && this.count(seq) > 1)
      this.note('nochsel', 'Séquence lancée alors que ADCCHSELSEQ1 à 4 valent tous 0 : toutes les conversions portent sur la voie 0. As-tu rempli les champs CONVxx ?');
    this.startSeq(seq, t);
  }
  extSoc() {
    this.update();
    if (!this.clockOn) return 'horloge ADC coupée (ADCENCLK = 0) : rien ne se passe';
    if (!((this.r.ADCTRL2 >> 7) & 1)) return 'EXT_SOC_SEQ1 = 0 : la broche ADCSOC n\'est pas autorisée à démarrer la séquence';
    this.trigger(1, this.now(), 'ADCSOC'); return null;
  }
  schedulePwm() {
    const t = this.now();
    const a = (this.r.ADCTRL2 >> 8) & 1, b = this.cascaded ? (this.r.ADCTRL2 >> 15) & 1 : this.r.ADCTRL2 & 1;
    if (a && this.socaNext == null) { const P = 1e6 / Math.max(1, this.opts.socaHz); this.socaNext = Math.ceil(t / P) * P || P; this.note('soca', `Déclenchement par l'ePWM (SOCA) : les timers ePWM ne sont pas simulés, le simulateur envoie un SOCA à ${this.opts.socaHz} Hz (réglable dans « Capteurs ADC »).`); }
    if (!a) this.socaNext = null;
    if (b && this.socbNext == null) { const P = 1e6 / Math.max(1, this.opts.socbHz); this.socbNext = Math.ceil(t / P) * P || P; this.note('socb', `Déclenchement par l'ePWM (SOCB) simulé à ${this.opts.socbHz} Hz (réglable dans « Capteurs ADC »).`); }
    if (!b) this.socbNext = null;
  }

  /* --- accès registres depuis le programme --- */
  split(p) { const a = p.split('.'); return { base: a[0], reg: a[1], sel: a[2] || null, field: a[3] || null }; }
  regValue(name) {
    switch (name) {
      case 'ADCTRL2': return (this.r.ADCTRL2 & ~0x6060) | (this.pend1 ? 1 << 13 : 0) | (this.pend2 ? 1 << 5 : 0);
      case 'ADCST': { const b1 = (this.busy && this.busy.seq === 1) || this.pend1 ? 1 : 0, b2 = (this.busy && this.busy.seq === 2) || this.pend2 ? 1 : 0; return this.int1 | (this.int2 << 1) | (b1 << 2) | (b2 << 3) | (this.eos1 << 6) | (this.eos2 << 7); }
      case 'ADCASEQSR': return (this.ptr1 & 15) | (((this.ptr2 - 8) & 7) << 4) | ((this.busy ? this.busy.left : 0) & 15) << 8;
      case 'ADCTRL1': return this.r.ADCTRL1 & ~(1 << 14);
      default:
        if (/^ADCRESULT\d+$/.test(name)) return (this.res[+name.slice(9)] << 4) & 0xFFF0;
        return this.r[name] || 0;
    }
  }
  read(p) {
    const { base, reg, sel, field } = this.split(p);
    if (base === 'SysCtrlRegs') { if (sel === 'bit') { const f = fieldOf(PCLKCR0, field); return (this.pclk >> f.lo) & ((1 << f.w) - 1); } return this.pclk; }
    this.update();
    if (!this.clockOn) { this.warn('clkr', `Lecture de ${base}.${reg} alors que l'horloge de l'ADC est coupée : sur la carte, le module ne répond pas (lecture = 0). Active-la : SysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1 (entre EALLOW et EDIS).`); return 0; }
    if (base === 'AdcMirror') return this.res[+reg.slice(9)];
    const v = this.regValue(reg);
    if (sel === 'bit') { const f = fieldOf(REG[reg], field); return (v >> f.lo) & ((1 << f.w) - 1); }
    return v;
  }
  write(p, val) {
    val = Number(val) >>> 0;
    const { base, reg, sel, field } = this.split(p);
    if (base === 'SysCtrlRegs') {
      if (!this.hw.eallow) { this.warn('eal-pclk', 'Écriture dans SysCtrlRegs.PCLKCR0 ignorée : ce registre est protégé, il faut EALLOW; avant (et EDIS; après).'); return val; }
      if (sel === 'bit') { const f = fieldOf(PCLKCR0, field); const m = maskOf(f); this.pclk = (this.pclk & ~m) | ((val << f.lo) & m); }
      else this.pclk = val & 0xFFFF;
      return val;
    }
    this.update();
    if (base === 'AdcMirror') { this.warn('mirw', `AdcMirror.${reg} est en lecture seule : l'écriture est sans effet.`); return val; }
    if (!this.clockOn) { this.warn('clkw', `Écriture dans AdcRegs.${reg} sans effet : l'horloge de l'ADC est coupée (PCLKCR0.bit.ADCENCLK = 0). Active-la d'abord, entre EALLOW et EDIS.`); return val; }
    const R = REG[reg];
    if (R.ro) { this.warn('ro' + reg, `AdcRegs.${reg} est en lecture seule : l'écriture est sans effet.`); return val; }
    let mask = 0xFFFF, v = val & 0xFFFF;
    if (sel === 'bit') {
      const f = fieldOf(R, field); mask = maskOf(f);
      if (f.ro) { this.warn('rof' + field, `AdcRegs.${reg}.bit.${field} est en lecture seule.${field === 'INT_SEQ1' || field === 'INT_SEQ2' ? ` Pour effacer ce drapeau, écris 1 dans AdcRegs.ADCST.bit.${field}_CLR.` : ''}`); return val; }
      if ((val >>> 0) > ((1 << f.w) - 1)) this.warn('ovf' + field, `AdcRegs.${reg}.bit.${field} fait ${f.w} bit${f.w > 1 ? 's' : ''} : la valeur ${val} est tronquée à ${val & ((1 << f.w) - 1)}.`);
      v = (val << f.lo) & mask;
    }
    this.writeReg(reg, v, mask);
    return val;
  }
  writeReg(reg, v, mask) {
    const set = bit => (mask >> bit) & 1 && (v >> bit) & 1;
    if (reg === 'ADCTRL1') {
      if (set(14)) { this.reset(); this.lastReset = this.now(); return; }
      this.r.ADCTRL1 = ((this.r.ADCTRL1 & ~mask) | (v & mask)) & 0x3FF0;
      return;
    }
    if (reg === 'ADCTRL2') {
      if (set(14)) { this.ptr1 = 0; this.pend1 = false; if (this.busy && this.busy.seq === 1) this.busy = null; }
      if (set(6)) { this.ptr2 = 8; this.pend2 = false; if (this.busy && this.busy.seq === 2) this.busy = null; }
      this.r.ADCTRL2 = ((this.r.ADCTRL2 & ~mask) | (v & mask)) & 0x8D8D;
      this.schedulePwm();
      if (set(13)) {
        if ((this.r.ADCTRL2 >> 8) & 1) this.note('socsw', 'SOC_SEQ1 écrit alors que le déclenchement par ePWM (EPWM_SOCA_SEQ1) est aussi actif : le cours conseille de désactiver les autres sources pour un déclenchement logiciel.');
        this.trigger(1, this.now(), 'logiciel');
      }
      if (set(5)) this.trigger(2, this.now(), 'logiciel');
      return;
    }
    if (reg === 'ADCST') {
      if (set(4)) this.int1 = 0;
      if (set(5)) this.int2 = 0;
      if (mask === 0xFFFF && (v & 0x00CF)) this.note('stall', 'Dans ADCST, seuls INT_SEQ1_CLR (bit 4) et INT_SEQ2_CLR (bit 5) s\'écrivent ; les autres bits sont en lecture seule.');
      return;
    }
    if (reg === 'ADCMAXCONV') { this.r.ADCMAXCONV = ((this.r.ADCMAXCONV & ~mask) | (v & mask)) & 0x7F; return; }
    if (reg === 'ADCTRL3') { this.r.ADCTRL3 = ((this.r.ADCTRL3 & ~mask) | (v & mask)) & 0xFF; return; }
    this.r[reg] = ((this.r[reg] & ~mask) | (v & mask)) & 0xFFFF;
  }
  lib(name) {
    if (name === 'InitSysCtrl' || name === 'InitPeripheralClocks') { if (this.opts.clockFromInit) this.pclk |= PCLK_ALL; return true; }
    if (name === 'InitAdc' || name === 'initADC' || name === 'InitADC') {
      if (!this.clockOn) { this.warn('initclk', `${name}() appelée alors que l'horloge de l'ADC est coupée : la mise sous tension et la calibration n'ont aucun effet. Active d'abord PCLKCR0.bit.ADCENCLK.`); return true; }
      this.r.ADCTRL3 |= 0xE0; this.calibrated = true; return true;
    }
    if (name === 'ADC_cal') { this.calibrated = true; return true; }
    return false;
  }

  /* --- photo pour l'interface --- */
  snapshot() {
    this.update();
    const regs = {};
    for (const k of Object.keys(REG)) if (!REG[k].plain) regs[k] = this.regValue(k);
    return {
      clockOn: !!this.clockOn, powered: this.powered, calibrated: this.calibrated, pclk: this.pclk,
      cascaded: !!this.cascaded, contRun: !!this.contRun, regs, res: Array.from(this.res), ptr1: this.ptr1, ptr2: this.ptr2,
      busy: this.busy ? { seq: this.busy.seq, left: this.busy.left, total: this.busy.total, ch: this.busy.ch } : null,
      pend1: this.pend1, pend2: this.pend2, int1: this.int1, int2: this.int2, seqCount: this.seqCount, convTotal: this.convTotal,
      count1: this.count(1), count2: this.count(2), tConv: this.tConv(), adcclk: this.adcclkMHz(),
      order1: Array.from({ length: this.count(1) }, (_, i) => { const p = (this.cascaded ? i : i % 8); return { slot: p, ch: this.chAt(p) }; }),
      order2: Array.from({ length: this.count(2) }, (_, i) => { const p = 8 + (i % 8); return { slot: p, ch: this.chAt(p) }; })
    };
  }
}

/* ---------------- autocomplétion ---------------- */
function completions(base, path) {
  if (base === 'AdcRegs' && path.length === 0) return Object.entries(REG).map(([k, R]) => ({ label: k, insert: k + (R.plain ? '' : '.'), desc: R.desc, kind: 'R', reopen: !R.plain }));
  if (base === 'AdcMirror' && path.length === 0) return Object.entries(MIRROR).map(([k, R]) => ({ label: k, insert: k, desc: R.desc, kind: 'R' }));
  if (base === 'SysCtrlRegs' && path.length === 0) return [{ label: 'PCLKCR0', insert: 'PCLKCR0.', desc: PCLKCR0.desc, kind: 'R', reopen: true }];
  const table = base === 'AdcRegs' ? REG : base === 'SysCtrlRegs' ? { PCLKCR0 } : null;
  if (!table) return null;
  const R = table[path[0]];
  if (!R || R.plain) return null;
  if (path.length === 1) return [{ label: 'bit', insert: 'bit.', desc: 'un champ : .bit.CHAMP', kind: 'b', reopen: true }, { label: 'all', insert: 'all', desc: 'tout le registre (16 bits)', kind: 'b' }];
  if (path.length === 2 && path[1] === 'bit') return R.fields.map(f => ({ label: f.name, insert: f.name + (f.ro ? '' : ' = '), desc: `${f.w > 1 ? `bits ${f.lo + f.w - 1}–${f.lo}` : `bit ${f.lo}`}${f.ro ? ' · lecture seule' : ''} · ${f.desc}`, kind: 'P' }));
  return null;
}

return { REG, MIRROR, PCLKCR0, checkPath, owns, Model, DEFAULTS, completions, CH_NAME, fieldOf };
})();
if (typeof module !== 'undefined') module.exports = AdcSim;
