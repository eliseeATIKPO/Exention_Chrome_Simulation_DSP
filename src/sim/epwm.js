/* ==========================================================================
   MODULES ePWM1 à ePWM6 DU TMS320F28335 (simulation)
   Time-base (TBCTL, TBCTR, TBPRD, TBPHS), compare (CMPA, CMPB, CMPCTL),
   action qualifier (AQCTLA/B, AQSFRC, AQCSFRC), dead-band (DBCTL, DBRED,
   DBFED), trip-zone forcé par logiciel (TZCTL, TZFRC, TZCLR), event-trigger
   (ETSEL, ETPS, ETFLG, ETCLR, ETFRC) vers l'ADC, horloges SysCtrlRegs.PCLKCR1.
   Noms et positions des bits : en-têtes TI DSP2833x_EPwm.h / DSP2833x_SysCtrl.h.
   Comme l'ADC, le modèle est « paresseux » : il rattrape le temps simulé à
   chaque accès, en sautant d'un événement du compteur au suivant.
   ========================================================================== */
const EpwmSim = (() => {
'use strict';

const F = (name, lo, w, desc, ro) => ({ name, lo, w: w || 1, desc: desc || '', ro: !!ro });
const AQ = '00 rien, 01 mise à 0, 10 mise à 1, 11 inversion';
const REG = {
  TBCTL: { desc: 'contrôle du compteur (time-base) — reset : 0x0083', fields: [
    F('CTRMODE', 0, 2, '00 comptage, 01 décomptage, 10 comptage/décomptage, 11 arrêt (reset)'),
    F('PHSEN', 2, 1, '1 = TBCTR chargé avec TBPHS à chaque synchronisation (SYNCI)'),
    F('PRDLD', 3, 1, '0 = TBPRD passe par un registre fantôme, chargé quand TBCTR = 0 ; 1 = immédiat'),
    F('SYNCOSEL', 4, 2, 'sortie SYNCO : 00 = SYNCI recopié, 01 = TBCTR = 0, 10 = TBCTR = CMPB, 11 = aucune'),
    F('SWFSYNC', 6, 1, 'écrire 1 = impulsion de synchronisation logicielle'),
    F('HSPCLKDIV', 7, 3, 'diviseur rapide : 000 /1, 001 /2 (reset), 010 /4, 011 /6, 100 /8, 101 /10, 110 /12, 111 /14'),
    F('CLKDIV', 10, 3, 'diviseur : 000 /1, 001 /2, 010 /4 … 111 /128'),
    F('PHSDIR', 13, 1, 'comptage/décomptage : sens après une synchronisation (0 = décompte, 1 = compte)'),
    F('FREE_SOFT', 14, 2, 'comportement au point d\'arrêt : 1x = le compteur ne s\'arrête jamais')] },
  TBSTS: { desc: 'état du compteur', fields: [
    F('CTRDIR', 0, 1, '1 = le compteur compte, 0 = il décompte', true),
    F('SYNCI', 1, 1, '1 = une synchronisation est arrivée (écrire 1 pour effacer)'),
    F('CTRMAX', 2, 1, '1 = TBCTR a atteint 0xFFFF (écrire 1 pour effacer)')] },
  TBPHS: { desc: 'déphasage chargé dans TBCTR à la synchronisation (32 bits : .half.TBPHS = 16 bits de poids fort)', union: ['TBPHSHR', 'TBPHS'] },
  TBCTR: { desc: 'compteur (16 bits)', plain: true },
  TBPRD: { desc: 'période du compteur (16 bits, 0 à 65535)', plain: true },
  CMPCTL: { desc: 'contrôle des comparateurs (registres fantômes)', fields: [
    F('LOADAMODE', 0, 2, 'chargement de CMPA : 00 quand TBCTR = 0, 01 = TBPRD, 10 les deux, 11 jamais'),
    F('LOADBMODE', 2, 2, 'chargement de CMPB : 00 quand TBCTR = 0, 01 = TBPRD, 10 les deux, 11 jamais'),
    F('SHDWAMODE', 4, 1, '0 = CMPA passe par un registre fantôme (reset), 1 = immédiat'),
    F('SHDWBMODE', 6, 1, '0 = CMPB passe par un registre fantôme (reset), 1 = immédiat'),
    F('SHDWAFULL', 8, 1, '1 = une valeur de CMPA attend son chargement', true),
    F('SHDWBFULL', 9, 1, '1 = une valeur de CMPB attend son chargement', true)] },
  CMPA: { desc: 'comparateur A (32 bits : .half.CMPA = 16 bits de poids fort, .half.CMPAHR = haute résolution)', union: ['CMPAHR', 'CMPA'] },
  CMPB: { desc: 'comparateur B (16 bits)', plain: true },
  AQCTLA: { desc: 'actions sur la sortie ePWMxA', fields: [
    F('ZRO', 0, 2, 'quand TBCTR = 0 : ' + AQ), F('PRD', 2, 2, 'quand TBCTR = TBPRD : ' + AQ),
    F('CAU', 4, 2, 'TBCTR = CMPA en comptant : ' + AQ), F('CAD', 6, 2, 'TBCTR = CMPA en décomptant : ' + AQ),
    F('CBU', 8, 2, 'TBCTR = CMPB en comptant : ' + AQ), F('CBD', 10, 2, 'TBCTR = CMPB en décomptant : ' + AQ)] },
  AQCTLB: { desc: 'actions sur la sortie ePWMxB', fields: null },
  AQSFRC: { desc: 'forçage logiciel ponctuel des sorties', fields: [
    F('ACTSFA', 0, 2, 'action ponctuelle sur A : ' + AQ), F('OTSFA', 2, 1, 'écrire 1 = appliquer ACTSFA maintenant'),
    F('ACTSFB', 3, 2, 'action ponctuelle sur B : ' + AQ), F('OTSFB', 5, 1, 'écrire 1 = appliquer ACTSFB maintenant'),
    F('RLDCSF', 6, 2, 'chargement de AQCSFRC : 00 quand TBCTR = 0, 01 = TBPRD, 10 les deux, 11 immédiat')] },
  AQCSFRC: { desc: 'forçage logiciel permanent des sorties', fields: [
    F('CSFA', 0, 2, 'sortie A : 00 rien, 01 forcée à 0, 10 forcée à 1, 11 rien'),
    F('CSFB', 2, 2, 'sortie B : 00 rien, 01 forcée à 0, 10 forcée à 1, 11 rien')] },
  DBCTL: { desc: 'temps morts (dead-band)', fields: [
    F('OUT_MODE', 0, 2, '00 sans temps mort, 01 retard du front descendant sur B, 10 retard du front montant sur A, 11 les deux'),
    F('POLSEL', 2, 2, '00 AH (rien d\'inversé), 01 ALC (A inversée), 10 AHC (B inversée), 11 AL (les deux)'),
    F('IN_MODE', 4, 2, 'source : 00 A pour les deux retards, 01 B (montant) / A (descendant), 10 A (montant) / B (descendant), 11 B pour les deux')] },
  DBRED: { desc: 'retard du front montant, en périodes de TBCLK (10 bits)', plain: true },
  DBFED: { desc: 'retard du front descendant, en périodes de TBCLK (10 bits)', plain: true },
  TZSEL: { desc: 'choix des entrées de défaut TZ1 à TZ6 (protégé par EALLOW)', eallow: true, fields: [1, 2, 3, 4, 5, 6].map(i => F('CBC' + i, i - 1, 1, `TZ${i} en cycle par cycle`)).concat([1, 2, 3, 4, 5, 6].map(i => F('OSHT' + i, i + 7, 1, `TZ${i} en coup unique`))) },
  TZCTL: { desc: 'état des sorties en défaut (protégé par EALLOW)', eallow: true, fields: [
    F('TZA', 0, 2, 'sortie A en défaut : 00 haute impédance, 01 forcée à 1, 10 forcée à 0, 11 rien'),
    F('TZB', 2, 2, 'sortie B en défaut : 00 haute impédance, 01 forcée à 1, 10 forcée à 0, 11 rien')] },
  TZEINT: { desc: 'interruption de défaut (protégé par EALLOW)', eallow: true, fields: [F('CBC', 1, 1, 'interruption sur défaut cycle par cycle'), F('OST', 2, 1, 'interruption sur défaut coup unique')] },
  TZFLG: { desc: 'drapeaux de défaut', fields: [F('INT', 0, 1, 'interruption de défaut', true), F('CBC', 1, 1, 'défaut cycle par cycle', true), F('OST', 2, 1, 'défaut coup unique', true)] },
  TZCLR: { desc: 'effacement des défauts (protégé par EALLOW)', eallow: true, fields: [F('INT', 0, 1, 'écrire 1 efface TZFLG.INT'), F('CBC', 1, 1, 'écrire 1 efface CBC'), F('OST', 2, 1, 'écrire 1 efface OST (fin du défaut)')] },
  TZFRC: { desc: 'défaut forcé par logiciel (protégé par EALLOW)', eallow: true, fields: [F('CBC', 1, 1, 'écrire 1 = défaut cycle par cycle'), F('OST', 2, 1, 'écrire 1 = défaut coup unique (arrêt d\'urgence)')] },
  ETSEL: { desc: 'choix des événements : interruption et démarrage de l\'ADC', fields: [
    F('INTSEL', 0, 3, 'interruption : 001 TBCTR = 0, 010 = TBPRD, 100 = CMPA en comptant, 101 en décomptant, 110 = CMPB en comptant, 111 en décomptant'),
    F('INTEN', 3, 1, '1 = interruption ePWM autorisée'),
    F('SOCASEL', 8, 3, 'SOCA : 001 TBCTR = 0, 010 = TBPRD, 100 = CMPA en comptant, 101 en décomptant, 110 = CMPB en comptant, 111 en décomptant'),
    F('SOCAEN', 11, 1, '1 = SOCA autorisé (démarrage de l\'ADC)'),
    F('SOCBSEL', 12, 3, 'SOCB : mêmes codes que SOCASEL'),
    F('SOCBEN', 15, 1, '1 = SOCB autorisé')] },
  ETPS: { desc: 'nombre d\'événements avant l\'impulsion', fields: [
    F('INTPRD', 0, 2, 'interruption : 00 jamais, 01 à chaque événement, 10 tous les 2, 11 tous les 3'),
    F('INTCNT', 2, 2, 'événements comptés pour l\'interruption', true),
    F('SOCAPRD', 8, 2, 'SOCA : 00 jamais, 01 à chaque événement, 10 tous les 2, 11 tous les 3'),
    F('SOCACNT', 10, 2, 'événements comptés pour SOCA', true),
    F('SOCBPRD', 12, 2, 'SOCB : 00 jamais, 01 à chaque événement, 10 tous les 2, 11 tous les 3'),
    F('SOCBCNT', 14, 2, 'événements comptés pour SOCB', true)] },
  ETFLG: { desc: 'drapeaux d\'événements (lecture seule)', fields: [F('INT', 0, 1, 'interruption ePWM', true), F('SOCA', 2, 1, 'SOCA émis', true), F('SOCB', 3, 1, 'SOCB émis', true)] },
  ETCLR: { desc: 'effacement des drapeaux', fields: [F('INT', 0, 1, 'écrire 1 efface ETFLG.INT'), F('SOCA', 2, 1, 'écrire 1 efface ETFLG.SOCA'), F('SOCB', 3, 1, 'écrire 1 efface ETFLG.SOCB')] },
  ETFRC: { desc: 'événements forcés par logiciel', fields: [F('INT', 0, 1, 'écrire 1 = interruption forcée'), F('SOCA', 2, 1, 'écrire 1 = SOCA forcé'), F('SOCB', 3, 1, 'écrire 1 = SOCB forcé')] },
  PCCTL: { desc: 'hacheur de porteuse (chopper), non simulé', fields: [F('CHPEN', 0, 1, '1 = chopper actif'), F('OSHTWTH', 1, 4, 'largeur de la première impulsion'), F('CHPFREQ', 5, 3, 'fréquence de la porteuse'), F('CHPDUTY', 8, 3, 'rapport cyclique de la porteuse')] }
};
REG.AQCTLB.fields = REG.AQCTLA.fields.map(f => Object.assign({}, f, { desc: f.desc }));
const PCLKCR1 = { desc: 'horloges des ePWM, eCAP et eQEP (protégé par EALLOW)', fields:
  [1, 2, 3, 4, 5, 6].map(i => F(`EPWM${i}ENCLK`, i - 1, 1, `1 = horloge de ePWM${i} activée`))
    .concat([1, 2, 3, 4, 5, 6].map(i => F(`ECAP${i}ENCLK`, i + 7, 1, `horloge de eCAP${i}`)))
    .concat([F('EQEP1ENCLK', 14, 1, 'horloge de eQEP1'), F('EQEP2ENCLK', 15, 1, 'horloge de eQEP2')]) };
const HSP = [1, 2, 4, 6, 8, 10, 12, 14];
const FCPU = 150; // MHz (SYSCLKOUT)
const FIELD_LO = { ZRO: 0, PRD: 2, CAU: 4, CAD: 6, CBU: 8, CBD: 10 };
const EVCODE = { ZRO: 1, PRD: 2, CAU: 4, CAD: 5, CBU: 6, CBD: 7 };
const PRIO = {
  0: ['ZRO', 'CAU', 'CBU', 'PRD'],                 // comptage : du moins prioritaire au plus prioritaire
  1: ['PRD', 'CAD', 'CBD', 'ZRO'],                 // décomptage
  bot: ['CAD', 'CBD', 'ZRO', 'CAU', 'CBU'],         // comptage/décomptage, en bas (repart en comptant)
  top: ['CAU', 'CBU', 'PRD', 'CAD', 'CBD'],         // en haut (repart en décomptant)
  mid: ['CAD', 'CBD', 'CAU', 'CBU']
};
const MODE_NAME = ['comptage (up)', 'décomptage (down)', 'comptage / décomptage (up-down)', 'arrêt (freeze)'];
const PIN_NAME = n => `EPWM${(n >> 1) + 1}${n & 1 ? 'B' : 'A'}`;

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
function closest(name, list) { let best = null, bd = 9; for (const n of list) { const d = n.toUpperCase() === name.toUpperCase() ? 0 : lev(name, n); if (d < bd) { bd = d; best = n; } } return bd <= 3 ? best : null; }
const sug = (name, list) => { const b = closest(name, list); return b ? ` Tu voulais dire « ${b} » ?` : ''; };
const modIdx = base => { const m = /^EPwm([1-6])Regs$/.exec(base); return m ? +m[1] : 0; };

/* Vérification à la compilation. null = pas pour ce module, { bits } = accès valide, { err } = message. */
function checkPath(base, path) {
  if (base === 'SysCtrlRegs') {
    if (path[0] !== 'PCLKCR1') return null;
    if (path.length === 1) return { err: 'SysCtrlRegs.PCLKCR1 s\'utilise avec .all ou .bit.CHAMP, par exemple SysCtrlRegs.PCLKCR1.bit.EPWM1ENCLK.' };
    if (path[1] === 'all') return path.length > 2 ? { err: 'Rien ne se met après .all.' } : { bits: 16 };
    if (path[1] !== 'bit') return { err: `Après SysCtrlRegs.PCLKCR1, on écrit .bit ou .all (pas « .${path[1]} »).` };
    if (path.length !== 3) return { err: 'Il manque le nom du champ : SysCtrlRegs.PCLKCR1.bit.EPWM1ENCLK par exemple.' };
    if (!fieldOf(PCLKCR1, path[2])) {
      const m = /^EPWM([1-6])/i.exec(path[2]);
      return { err: `SysCtrlRegs.PCLKCR1 n'a pas de champ « ${path[2]} ».${m ? ` Le champ de l'horloge de ePWM${m[1]} s'appelle EPWM${m[1]}ENCLK (EN puis CLK).` : sug(path[2], PCLKCR1.fields.map(f => f.name))}` };
    }
    return { bits: 16 };
  }
  const i = modIdx(base); if (!i) return null;
  const rn = path[0]; const R = REG[rn];
  if (!R) {
    let extra = '';
    if (/^AQCTL$/i.test(rn)) extra = ' Il y en a deux : AQCTLA (sortie A) et AQCTLB (sortie B).';
    if (/^AQSFR$/i.test(rn)) extra = ' Les registres de forçage s\'appellent AQSFRC (ponctuel) et AQCSFRC (permanent).';
    if (/^(GPAMUX|PCLKCR)/i.test(rn)) extra = ` ${rn} n'est pas dans ${base} : c'est GpioCtrlRegs.GPAMUX1 ou SysCtrlRegs.PCLKCR1.`;
    return { err: `${base} n'a pas de registre « ${rn} ».${extra || sug(rn, Object.keys(REG))}` };
  }
  if (R.plain) {
    if (path.length > 1) return { err: `Dans les en-têtes TI (DSP2833x_EPwm.h), ${rn} est un Uint16 simple, sans .bit ni .all : écris ${base}.${rn} = … (Code Composer refuse « .${path[1]} » ici).` };
    return { bits: 16 };
  }
  if (R.union) {
    if (path.length === 1) return { err: `${base}.${rn} s'utilise avec .half.${R.union[1]} (16 bits) ou .all (32 bits).` };
    if (path[1] === 'all') return path.length > 2 ? { err: 'Rien ne se met après .all.' } : { bits: 32 };
    if (path[1] === 'bit') return { err: `${base}.${rn} n'a pas de .bit : écris ${base}.${rn}.half.${R.union[1]} = …` };
    if (path[1] !== 'half') return { err: `Après ${base}.${rn}, on écrit .half.${R.union[1]} ou .all (pas « .${path[1]} »).` };
    if (path.length !== 3) return { err: `Il manque le champ : ${base}.${rn}.half.${R.union[1]}.` };
    if (!R.union.includes(path[2])) return { err: `${base}.${rn}.half n'a pas de champ « ${path[2]} » : les champs sont ${R.union[1]} et ${R.union[0]}.` };
    return { bits: 16 };
  }
  if (path.length === 1) return { err: `${base}.${rn} s'utilise avec .all (tout le registre) ou .bit.CHAMP, par exemple ${base}.${rn}.bit.${R.fields[0].name}.` };
  if (path[1] === 'all') return path.length > 2 ? { err: 'Rien ne se met après .all.' } : { bits: 16 };
  if (path[1] !== 'bit') return { err: `Après ${base}.${rn}, on écrit .bit ou .all (pas « .${path[1]} »).${path[1].toLowerCase() === 'bits' ? ' C\'est « bit », sans s.' : ''}` };
  if (path.length !== 3) return { err: `Il manque le nom du champ : ${base}.${rn}.bit.${R.fields[0].name} par exemple.` };
  if (!fieldOf(R, path[2])) {
    let other = '';
    for (const [k, r2] of Object.entries(REG)) if (k !== rn && fieldOf(r2, path[2])) { other = ` Ce champ existe, mais dans ${base}.${k}.`; break; }
    return { err: `${base}.${rn} n'a pas de champ « ${path[2]} ».${other || sug(path[2], R.fields.map(f => f.name))} Champs : ${R.fields.map(f => f.name).join(', ')}.` };
  }
  return { bits: 16 };
}
const OWN = new Map();
const owns = p => { let r = OWN.get(p); if (r === undefined) { r = /^EPwm[1-6]Regs\./.test(p) || p.startsWith('SysCtrlRegs.PCLKCR1.'); OWN.set(p, r); } return r; };
const SPLIT = new Map();

const DEFAULTS = { clockFromInit: false, needSync: false };

/* ---------------- un module ePWMx ---------------- */
class Mod {
  constructor(i) { this.i = i; this.log = { A: { t: [], v: [] }, B: { t: [], v: [] } }; this.reset(); }
  reset() {
    this.r = { TBCTL: 0x0083, TBPHS: 0, CMPCTL: 0, AQCTLA: 0, AQCTLB: 0, AQSFRC: 0, DBCTL: 0, DBRED: 0, DBFED: 0, TZSEL: 0, TZCTL: 0, TZEINT: 0, ETSEL: 0, ETPS: 0, PCCTL: 0 };
    this.ctr = 0; this.dir = 1; this.t = null; this.ev = undefined; this.prd = 0; this.prdSh = 0;
    this.cmpa = 0; this.cmpaSh = 0; this.cmpahr = 0; this.cmpb = 0; this.cmpbSh = 0; this.shA = false; this.shB = false;
    this.csf = 0; this.csfSh = 0;
    this.aqA = 0; this.aqB = 0; this.out = { A: 0, B: 0 };
    this.redIn = 0; this.fedIn = 0; this.red = 0; this.fed = 0; this.redAt = null; this.fedAt = null;
    this.cnt = { int: 0, soca: 0, socb: 0 }; this.flg = { int: 0, soca: 0, socb: 0 };
    this.synci = 0; this.ost = 0; this.cbc = 0; this.tzint = 0;
    this.nSoca = 0; this.nSocb = 0; this.nInt = 0; this.lastZro = null; this.lastStart = null; this.started = false;
    for (const k of ['A', 'B']) { this.log[k].t.length = 0; this.log[k].v.length = 0; }
  }
  get mode() { return this.r.TBCTL & 3; }
  get tick() { const c = this.r.TBCTL; return HSP[(c >> 7) & 7] * (1 << ((c >> 10) & 7)) / FCPU; } // µs par période de TBCLK
}

class Model {
  constructor(hw) {
    this.hw = hw; this.opts = Object.assign({}, DEFAULTS);
    this.live = true;            // false : ancien comportement (SOCA simulé par l'ADC)
    this.m = [1, 2, 3, 4, 5, 6].map(i => new Mod(i));
    this.pclk1 = 0; this.t = 0; this.busy = false; this.nT = -Infinity; this.dirty = true;
    this.full();
  }
  warn(k, m) { this.hw.warn('pwm-' + k, m); }
  note(k, m) { (this.hw.note || this.hw.warn)('pwm-' + k, m); }
  now() { return typeof this.hw.now === 'function' ? this.hw.now() : 0; }
  full() { this.pclk1 = 0; this.t = this.now(); this.dirty = true; for (const m of this.m) m.reset(); }
  clockOn(m) { return (this.pclk1 >> (m.i - 1)) & 1; }
  tbsync() { const a = this.hw.adc; return a ? (a.pclk >> 2) & 1 : 1; }
  running(m) { return !!this.clockOn(m) && m.mode !== 3 && (!this.opts.needSync || !!this.tbsync()); }

  /* --- démarrage / arrêt d'un compteur --- */
  syncRun(t) {
    this.dirty = true;
    for (const m of this.m) {
      const run = this.running(m);
      if (run && m.t == null) {
        m.ev = undefined; m.t = t; m.lastStart = t; m.started = true;
        if (m.prdSh !== m.prd && !((m.r.TBCTL >> 3) & 1)) { /* chargé au premier TBCTR = 0 */ }
        if (m.prd === 0 && m.prdSh === 0) this.warn('prd0-' + m.i, `ePWM${m.i} démarre avec TBPRD = 0 : la période est nulle, le compteur reste bloqué. Écris EPwm${m.i}Regs.TBPRD avant de lancer le comptage (CTRMODE en dernier).`);
        const names = this.namesAt(m, m.ctr);
        if (names.length) this.events(m, names, m.ctr, t);
        else this.outputs(m, t);
      } else if (!run && m.t != null) { m.t = null; m.ev = undefined; }
    }
  }
  namesAt(m, v) {
    const n = [];
    if (v === 0) n.push('ZRO');
    if (v === m.prd && m.prd > 0) n.push('PRD');
    const dirs = m.mode === 0 ? ['U'] : m.mode === 1 ? ['D'] : (v === 0 || v === m.prd) ? ['U', 'D'] : [m.dir > 0 ? 'U' : 'D'];
    for (const d of dirs) { if (v === m.cmpa) n.push('CA' + d); if (v === m.cmpb) n.push('CB' + d); }
    return n;
  }

  /* --- prochain événement du compteur : nombre de périodes TBCLK et noms --- */
  nextEv(m) {
    const mode = m.mode, prd = m.prd, c = m.ctr;
    if (mode === 3) return null;
    if (prd === 0 || (prd < 3 && mode !== 2) || (mode === 2 && prd < 2)) return null;
    if (m.tick * (mode === 2 ? 2 * prd : prd + 1) < 1) {   // période < 1 µs : trop d'événements à simuler
      this.warn('fast-' + m.i, `ePWM${m.i} : la période du compteur est inférieure à 1 µs (plus de 1 MHz). Le simulateur ne sait pas suivre ce rythme : le compteur est figé. Vérifie TBPRD et les diviseurs CLKDIV / HSPCLKDIV.`);
      return null;
    }
    let best = Infinity, names = [], val = 0;
    const add = (d, name, v) => { if (!(d > 0) || d === Infinity) return; if (d < best) { best = d; names = [name]; val = v; } else if (d === best) names.push(name); };
    if (mode === 0) {
      const max = c <= prd ? prd : 0xFFFF;
      const du = v => (v > c && v <= max) ? v - c : (v <= prd ? (max - c) + 1 + v : Infinity);
      add(du(0), 'ZRO', 0); add(du(prd), 'PRD', prd); add(du(m.cmpa), 'CAU', m.cmpa); add(du(m.cmpb), 'CBU', m.cmpb);
    } else if (mode === 1) {
      const dd = v => v < c ? c - v : (v <= prd ? c + 1 + (prd - v) : Infinity);
      add(dd(0), 'ZRO', 0); add(dd(prd), 'PRD', prd); add(dd(m.cmpa), 'CAD', m.cmpa); add(dd(m.cmpb), 'CBD', m.cmpb);
    } else {
      if (c > prd) m.dir = -1;
      const L = 2 * prd;
      const p = c > prd ? -(c - prd) + prd : (m.dir > 0 ? c : (c === 0 ? 0 : L - c));
      const dist = ph => { const d = (((ph - p) % L) + L) % L; return d === 0 ? L : d; };
      const up = v => v <= prd ? dist(v) : Infinity, dn = v => v <= prd ? dist(v === 0 ? 0 : L - v) : Infinity;
      if (c > prd) {   // au-dessus de TBPRD (TBPRD diminué) : il redescend
        const dd = v => v < c ? c - v : Infinity;
        add(dd(0), 'ZRO', 0); add(dd(m.cmpa), 'CAD', m.cmpa); add(dd(m.cmpb), 'CBD', m.cmpb); add(dd(prd), 'PRD', prd);
      } else {
        add(dn(0), 'ZRO', 0); add(up(prd), 'PRD', prd);
        add(up(m.cmpa), 'CAU', m.cmpa); add(dn(m.cmpa), 'CAD', m.cmpa);
        add(up(m.cmpb), 'CBU', m.cmpb); add(dn(m.cmpb), 'CBD', m.cmpb);
      }
    }
    return best === Infinity ? null : { d: best, names, v: val };
  }

  /* --- moteur à événements --- */
  update(T) {
    if (this.busy) return; this.busy = true;
    try {
      if (T == null) T = this.now();
      if (T <= this.t) return;
      if (!this.dirty && T < this.nT) { this.t = T; return; }   // rien ne se passe d'ici T : chemin rapide
      if (T - this.t > 200000) this.skip(T - 50000);
      let guard = 0;
      while (guard++ < 500000) {
        let best = Infinity, bm = null, bk = null, bev = null;
        for (const m of this.m) {
          if (m.redAt != null && m.redAt < best) { best = m.redAt; bm = m; bk = 'red'; }
          if (m.fedAt != null && m.fedAt < best) { best = m.fedAt; bm = m; bk = 'fed'; }
          if (m.t == null) continue;
          if (m.ev === undefined) m.ev = this.nextEv(m);
          const ev = m.ev; if (!ev) continue;
          const te = m.t + ev.d * m.tick;
          if (te < best) { best = te; bm = m; bk = 'ctr'; bev = ev; }
        }
        if (best > T) { this.nT = best; break; }
        if (bk === 'red') { bm.redAt = null; bm.red = 1; this.outputs(bm, best); }
        else if (bk === 'fed') { bm.fedAt = null; bm.fed = 0; this.outputs(bm, best); }
        else this.arrive(bm, bev, best);
      }
      if (guard >= 500000) { this.skip(T); this.nT = -Infinity; }
      this.dirty = false;
      this.t = T;
    } finally { this.busy = false; }
  }
  // Retard énorme (onglet en arrière-plan…) : on saute des périodes entières sans les simuler.
  skip(to) {
    for (const m of this.m) {
      if (m.t == null) { m.redAt = m.fedAt = null; continue; }
      const L = m.mode === 2 ? 2 * m.prd : m.prd + 1; const P = L * m.tick;
      if (!(P > 0) || to <= m.t) continue;
      const n = Math.floor((to - m.t) / P); const dt = n * P;
      m.t += dt; if (m.redAt != null) m.redAt += dt; if (m.fedAt != null) m.fedAt += dt;
    }
    this.t = Math.max(this.t, to - 1);
  }
  partial(m, T) {
    let k = Math.floor((T - m.t) / m.tick + 1e-9); if (k <= 0) return;
    if (m.ev === undefined) m.ev = this.nextEv(m);
    const ev = m.ev; if (ev && k >= ev.d) k = ev.d - 1;
    if (k <= 0) return;
    if (m.mode === 0) m.ctr += k; else if (m.mode === 1) m.ctr -= k; else m.ctr += m.dir * k;
    m.t += k * m.tick;
    if (ev) ev.d -= k;
  }
  arrive(m, ev, t) {
    m.t = t; m.ctr = ev.v; m.ev = undefined;
    if (m.mode === 2) { if (ev.v === m.prd) m.dir = -1; else if (ev.v === 0) m.dir = 1; }
    this.events(m, ev.names, ev.v, t);
  }
  events(m, names, v, t) {
    const set = new Set(names);
    let order = PRIO[m.mode];
    if (m.mode === 2) order = v === 0 ? PRIO.bot : v === m.prd ? PRIO.top : PRIO.mid;
    const list = order.filter(n => set.has(n));
    const zro = set.has('ZRO'), prd = set.has('PRD');
    if (zro) m.lastZro = t;
    // chargement des registres fantômes
    if (zro && !((m.r.TBCTL >> 3) & 1)) m.prd = m.prdSh;
    const ldA = m.r.CMPCTL & 3, ldB = (m.r.CMPCTL >> 2) & 3;
    if (m.shA && ((zro && (ldA === 0 || ldA === 2)) || (prd && (ldA === 1 || ldA === 2)))) { m.cmpa = m.cmpaSh; m.shA = false; }
    if (m.shB && ((zro && (ldB === 0 || ldB === 2)) || (prd && (ldB === 1 || ldB === 2)))) { m.cmpb = m.cmpbSh; m.shB = false; }
    const rl = (m.r.AQSFRC >> 6) & 3;
    if ((zro && (rl === 0 || rl === 2)) || (prd && (rl === 1 || rl === 2))) m.csf = m.csfSh;
    if (zro && m.cbc) m.cbc = 0;
    // action qualifier
    for (const n of list) { m.aqA = act(m.aqA, (m.r.AQCTLA >> FIELD_LO[n]) & 3); m.aqB = act(m.aqB, (m.r.AQCTLB >> FIELD_LO[n]) & 3); }
    // event trigger
    const et = m.r.ETSEL, ps = m.r.ETPS;
    const hit = code => list.some(n => EVCODE[n] === code);
    if (hit(et & 7) && (et >> 3) & 1 && !m.flg.int) {
      const per = ps & 3;
      if (per) { m.cnt.int++; if (m.cnt.int >= per) { m.cnt.int = 0; m.flg.int = 1; m.nInt++; this.note('isr-' + m.i, `ePWM${m.i} : ETFLG.INT passe à 1, mais les routines d'interruption (PIE) ne sont pas simulées. Pour tester, scrute EPwm${m.i}Regs.ETFLG.bit.INT puis efface-le avec EPwm${m.i}Regs.ETCLR.bit.INT = 1.`); } }
    }
    const soc = (en, sel, perSh, key, kind) => {
      if (!hit(sel)) return;
      const per = (ps >> perSh) & 3;
      if (!en) { if (per) this.note('socen' + key + m.i, `ePWM${m.i} : SOC${kind}SEL et SOC${kind}PRD sont réglés, mais ETSEL.bit.SOC${kind}EN = 0 : l'impulsion SOC${kind} n'est pas générée.`); return; }
      if (!per) { this.note('socprd' + key + m.i, `ePWM${m.i} : SOC${kind}EN = 1 mais ETPS.bit.SOC${kind}PRD = 0 (« jamais ») : aucune impulsion SOC${kind}.`); return; }
      m.cnt[key]++;
      if (m.cnt[key] >= per) { m.cnt[key] = 0; m.flg[key] = 1; if (kind === 'A') m.nSoca++; else m.nSocb++; this.emitSoc(kind, t, m); }
    };
    soc((et >> 11) & 1, (et >> 8) & 7, 8, 'soca', 'A');
    soc((et >> 15) & 1, (et >> 12) & 7, 12, 'socb', 'B');
    // synchronisation
    const so = (m.r.TBCTL >> 4) & 3;
    if ((so === 1 && zro) || (so === 2 && (set.has('CBU') || set.has('CBD')))) this.syncOut(m, t);
    this.outputs(m, t);
  }
  syncIn(m, t) {
    if (m.t != null) this.partial(m, t);
    m.synci = 1; m.ev = undefined;
    if ((m.r.TBCTL >> 2) & 1) {
      m.ctr = (m.r.TBPHS >>> 16) & 0xFFFF;
      if (m.mode === 2) m.dir = (m.r.TBCTL >> 13) & 1 ? 1 : -1;
      if (m.t != null) m.t = t;
    }
    if (((m.r.TBCTL >> 4) & 3) === 0) this.syncOut(m, t);
  }
  syncOut(m, t) { const nx = this.m[m.i]; if (nx) this.syncIn(nx, t); }
  emitSoc(kind, t, m) {
    if (!this.live) return;
    const adc = this.hw.adc; if (!adc) return;
    adc.update(t);
    if (!adc.clockOn) { this.note('socclk', `SOC${kind} émis par ePWM${m.i}, mais l'horloge de l'ADC est coupée (PCLKCR0.bit.ADCENCLK = 0) : aucune conversion.`); return; }
    const c2 = adc.r.ADCTRL2;
    if (kind === 'A') {
      if ((c2 >> 8) & 1) adc.trigger(1, t, 'SOCA');
      else this.note('socign-a', `SOCA émis par ePWM${m.i}, mais AdcRegs.ADCTRL2.bit.EPWM_SOCA_SEQ1 = 0 : l'ADC ne démarre pas sur ce signal.`);
    } else {
      const ok = adc.cascaded ? (c2 >> 15) & 1 : c2 & 1;
      if (ok) adc.trigger(adc.cascaded ? 1 : 2, t, 'SOCB');
      else this.note('socign-b', `SOCB émis par ePWM${m.i}, mais l'ADC n'est pas réglé pour le prendre (${adc.cascaded ? 'EPWM_SOCB_SEQ' : 'EPWM_SOCB_SEQ2'} = 0).`);
    }
  }

  /* --- sorties : action qualifier → forçage → temps morts → défaut --- */
  outputs(m, t) {
    let a = m.aqA, b = m.aqB;
    const ca = m.csf & 3, cb = (m.csf >> 2) & 3;
    if (ca === 1) a = 0; else if (ca === 2) a = 1;
    if (cb === 1) b = 0; else if (cb === 2) b = 1;
    const db = m.r.DBCTL, om = db & 3, pol = (db >> 2) & 3, im = (db >> 4) & 3;
    const rs = im & 1 ? b : a, fs = im & 2 ? b : a;
    if (rs !== m.redIn) { m.redIn = rs; if (rs) { if (m.r.DBRED && m.t != null) m.redAt = t + m.r.DBRED * m.tick; else { m.red = 1; m.redAt = null; } } else { m.red = 0; m.redAt = null; } }
    if (fs !== m.fedIn) { m.fedIn = fs; if (!fs) { if (m.r.DBFED && m.t != null) m.fedAt = t + m.r.DBFED * m.tick; else { m.fed = 0; m.fedAt = null; } } else { m.fed = 1; m.fedAt = null; } }
    let oa = om & 2 ? (pol & 1 ? 1 - m.red : m.red) : a;
    let ob = om & 1 ? (pol & 2 ? 1 - m.fed : m.fed) : b;
    if (m.ost || m.cbc) {
      const za = m.r.TZCTL & 3, zb = (m.r.TZCTL >> 2) & 3;
      oa = za === 0 ? 2 : za === 1 ? 1 : za === 2 ? 0 : oa;
      ob = zb === 0 ? 2 : zb === 1 ? 1 : zb === 2 ? 0 : ob;
    }
    this.setOut(m, 'A', oa, t); this.setOut(m, 'B', ob, t);
  }
  setOut(m, ch, v, t) {
    if (m.out[ch] === v) return;
    m.out[ch] = v;
    const L = m.log[ch]; L.t.push(t); L.v.push(v);
    if (L.t.length > 40000) { L.t.splice(0, 15000); L.v.splice(0, 15000); }
    const pin = (m.i - 1) * 2 + (ch === 'B' ? 1 : 0);
    if (this.hw.mux[pin] === 1) this.hw.touch(pin, t);
    else if (m.started) this.note('mux-' + pin, `${PIN_NAME(pin)} change d'état, mais GPIO${pin} n'est pas configurée en ${PIN_NAME(pin)} (GpioCtrlRegs.GPAMUX1.bit.GPIO${pin} = ${this.hw.mux[pin]}) : le signal reste dans le module et n'arrive pas sur la broche.`);
  }
  pin(n) { const m = this.m[n >> 1]; return n & 1 ? m.out.B : m.out.A; }

  /* --- accès registres depuis le programme --- */
  split(p) { let r = SPLIT.get(p); if (!r) { const a = p.split('.'); r = { base: a[0], reg: a[1], sel: a[2] || null, field: a[3] || null, i: modIdx(a[0]) }; SPLIT.set(p, r); } return r; }
  catchUp(T) { for (const m of this.m) if (m.t != null) this.partial(m, T); }   // TBCTR exact à l'instant T
  regValue(m, name) {
    if ((name === 'TBCTR' || name === 'TBSTS') && m.t != null) this.partial(m, this.t);
    switch (name) {
      case 'TBCTR': return m.ctr & 0xFFFF;
      case 'TBPRD': return (m.r.TBCTL >> 3) & 1 ? m.prd : m.prdSh;
      case 'TBSTS': return (m.dir > 0 ? 1 : 0) | (m.synci << 1);
      case 'CMPA': return ((((m.r.CMPCTL >> 4) & 1 ? m.cmpa : m.cmpaSh) & 0xFFFF) * 65536 + (m.cmpahr & 0xFFFF)) >>> 0;
      case 'CMPB': return (m.r.CMPCTL >> 6) & 1 ? m.cmpb : m.cmpbSh;
      case 'CMPCTL': return (m.r.CMPCTL & 0x5F) | (m.shA ? 1 << 8 : 0) | (m.shB ? 1 << 9 : 0);
      case 'AQCSFRC': return m.csfSh;
      case 'ETPS': return (m.r.ETPS & 0x3303) | ((m.cnt.int & 3) << 2) | ((m.cnt.soca & 3) << 10) | ((m.cnt.socb & 3) << 14);
      case 'ETFLG': return m.flg.int | (m.flg.soca << 2) | (m.flg.socb << 3);
      case 'TZFLG': return m.tzint | (m.cbc << 1) | (m.ost << 2);
      case 'ETCLR': case 'ETFRC': case 'TZCLR': case 'TZFRC': return 0;
      default: return m.r[name] || 0;
    }
  }
  read(p) {
    const { base, reg, sel, field } = this.split(p);
    if (base === 'SysCtrlRegs') { if (sel === 'bit') { const f = fieldOf(PCLKCR1, field); return (this.pclk1 >> f.lo) & ((1 << f.w) - 1); } return this.pclk1; }
    this.update();
    const m = this.m[this.split(p).i - 1];
    if (!this.clockOn(m)) { this.warn('clkr' + m.i, `Lecture de ${base}.${reg} alors que l'horloge de ePWM${m.i} est coupée : sur la carte, le module ne répond pas (lecture = 0). Active-la avec SysCtrlRegs.PCLKCR1.bit.EPWM${m.i}ENCLK = 1 (entre EALLOW et EDIS).`); return 0; }
    const v = this.regValue(m, reg);
    if (sel === 'half') return field === REG[reg].union[1] ? (v >>> 16) & 0xFFFF : v & 0xFFFF;
    if (sel === 'bit') { const f = fieldOf(REG[reg], field); return (v >> f.lo) & ((1 << f.w) - 1); }
    return v;
  }
  write(p, val) {
    const raw = Math.trunc(Number(val) || 0);
    const { base, reg, sel, field } = this.split(p);
    this.update();
    const t = this.now();
    this.catchUp(t); this.dirty = true;
    for (const mm of this.m) mm.ev = undefined;   // la configuration peut changer
    if (base === 'SysCtrlRegs') {
      const v = raw >>> 0;
      if (!this.hw.eallow) { this.warn('eal-pclk1', 'Écriture dans SysCtrlRegs.PCLKCR1 ignorée : ce registre est protégé, il faut EALLOW; avant (et EDIS; après).'); return val; }
      if (sel === 'bit') { const f = fieldOf(PCLKCR1, field); const mk = maskOf(f); this.pclk1 = (this.pclk1 & ~mk) | ((v << f.lo) & mk); }
      else this.pclk1 = v & 0xFFFF;
      this.syncRun(t);
      return val;
    }
    const m = this.m[this.split(p).i - 1];
    if (!this.clockOn(m)) { this.warn('clkw' + m.i, `Écriture dans ${base}.${reg} sans effet : l'horloge de ePWM${m.i} est coupée. Active-la d'abord : SysCtrlRegs.PCLKCR1.bit.EPWM${m.i}ENCLK = 1, entre EALLOW et EDIS.`); return val; }
    const R = REG[reg];
    if (R.eallow && !this.hw.eallow) { this.warn('eal' + reg, `Écriture dans ${base}.${reg} ignorée : les registres de trip-zone sont protégés, il faut EALLOW; avant.`); return val; }
    if (R.plain) {
      const lim = reg === 'DBRED' || reg === 'DBFED' ? 0x3FF : 0xFFFF;
      if (raw < 0 || raw > lim) this.warn('ovf' + reg + m.i, `${base}.${reg} est sur ${lim === 0x3FF ? 10 : 16} bits (0 à ${lim}) : la valeur ${raw} est tronquée à ${raw & lim}.${reg === 'TBPRD' && raw > 65535 ? ' Il faut ralentir le compteur avec le diviseur k (CLKDIV et HSPCLKDIV de TBCTL) pour que TBPRD tienne sur 16 bits.' : ''}`);
      this.writePlain(m, reg, raw & lim, t);
      this.outputs(m, t); return val;
    }
    if (R.union) {
      const cur = this.regValue(m, reg) >>> 0;
      let nv;
      if (sel === 'half') {
        const hi = field === R.union[1];
        if (raw < 0 || raw > 0xFFFF) this.warn('ovf' + reg + m.i, `${base}.${reg}.half.${field} est sur 16 bits : ${raw} est tronqué à ${raw & 0xFFFF}.`);
        nv = hi ? ((raw & 0xFFFF) * 65536 + (cur & 0xFFFF)) : ((cur & 0xFFFF0000) + (raw & 0xFFFF));
      } else {
        nv = raw >>> 0;
        if (nv > 0 && nv < 65536) this.note('all' + reg + m.i, `${base}.${reg}.all = ${raw} : .all est le registre 32 bits entier. La valeur de comparaison ${R.union[1]} est dans les 16 bits de POIDS FORT ; ici elle vaut 0 et ${raw} part dans ${R.union[0]} (haute résolution). Pour régler ${R.union[1]}, écris ${base}.${reg}.half.${R.union[1]} = ${raw};`);
      }
      this.writeUnion(m, reg, nv >>> 0);
      this.outputs(m, t); return val;
    }
    let mask = 0xFFFF, v = raw & 0xFFFF;
    if (sel === 'bit') {
      const f = fieldOf(R, field); mask = maskOf(f);
      if (f.ro) { this.warn('rof' + reg + field, `${base}.${reg}.bit.${field} est en lecture seule.${reg === 'ETFLG' ? ` Pour effacer ce drapeau, écris 1 dans ${base}.ETCLR.bit.${field}.` : ''}`); return val; }
      const lim = (1 << f.w) - 1;
      if (raw < 0 || raw > lim) {
        const hx = raw.toString(16);
        this.warn('ovf' + reg + field + m.i, `${base}.${reg}.bit.${field} fait ${f.w} bit${f.w > 1 ? 's' : ''} (0 à ${lim}) : la valeur ${raw} est tronquée à ${raw & lim}.${raw > 1 && /^[01]+$/.test(hx) ? ` Attention : ${raw} s'écrit 0x${hx} en hexadécimal. Pour écrire du binaire, utilise 0b${hx} (ou ${parseInt(hx, 2)} en décimal).` : ''}`);
      }
      v = (raw << f.lo) & mask;
    }
    this.writeReg(m, reg, v, mask, t);
    return val;
  }
  writePlain(m, reg, v, t) {
    if (reg === 'TBCTR') { m.ctr = v; if (m.t != null) m.t = t; return; }
    if (reg === 'TBPRD') { m.prdSh = v; if ((m.r.TBCTL >> 3) & 1 || m.t == null) m.prd = v; return; }
    if (reg === 'CMPB') { m.cmpbSh = v; if ((m.r.CMPCTL >> 6) & 1 || m.t == null) { m.cmpb = v; m.shB = false; } else m.shB = true; return; }
    m.r[reg] = v;
  }
  writeUnion(m, reg, v) {
    if (reg === 'TBPHS') { m.r.TBPHS = v; return; }
    const hi = (v >>> 16) & 0xFFFF; m.cmpahr = v & 0xFFFF; m.cmpaSh = hi;
    if ((m.r.CMPCTL >> 4) & 1 || m.t == null) { m.cmpa = hi; m.shA = false; } else m.shA = true;
  }
  writeReg(m, reg, v, mask, t) {
    const setb = bit => (mask >> bit) & 1 && (v >> bit) & 1;
    const merge = (old, keep) => ((old & ~mask) | (v & mask)) & keep;
    switch (reg) {
      case 'TBCTL': {
        m.r.TBCTL = merge(m.r.TBCTL, 0xFFBF);
        if (m.t != null) m.t = t;   // nouveau diviseur : on repart de l'instant présent
        if (setb(6)) this.syncIn(m, t);
        this.syncRun(t); break;
      }
      case 'TBSTS': if (setb(1)) m.synci = 0; break;
      case 'CMPCTL': m.r.CMPCTL = merge(m.r.CMPCTL, 0x5F); break;
      case 'AQSFRC': {
        m.r.AQSFRC = merge(m.r.AQSFRC, 0xDB);
        if (setb(2)) m.aqA = act(m.aqA, m.r.AQSFRC & 3);
        if (setb(5)) m.aqB = act(m.aqB, (m.r.AQSFRC >> 3) & 3);
        break;
      }
      case 'AQCSFRC': m.csfSh = merge(m.csfSh, 0xF); if (((m.r.AQSFRC >> 6) & 3) === 3 || m.t == null) m.csf = m.csfSh; break;
      case 'ETPS': m.r.ETPS = merge(m.r.ETPS, 0x3303); break;
      case 'ETCLR': if (setb(0)) m.flg.int = 0; if (setb(2)) m.flg.soca = 0; if (setb(3)) m.flg.socb = 0; break;
      case 'ETFRC':
        if (setb(0)) { m.flg.int = 1; m.nInt++; }
        if (setb(2)) { m.flg.soca = 1; m.nSoca++; this.emitSoc('A', t, m); }
        if (setb(3)) { m.flg.socb = 1; m.nSocb++; this.emitSoc('B', t, m); }
        break;
      case 'TZCLR': if (setb(0)) m.tzint = 0; if (setb(1)) m.cbc = 0; if (setb(2)) m.ost = 0; break;
      case 'TZFRC':
        if (setb(1)) { m.cbc = 1; if ((m.r.TZEINT >> 1) & 1) m.tzint = 1; }
        if (setb(2)) { m.ost = 1; if ((m.r.TZEINT >> 2) & 1) m.tzint = 1; }
        break;
      case 'TZFLG': case 'ETFLG': this.warn('ro' + reg, `${reg} est en lecture seule.`); break;
      case 'PCCTL': m.r.PCCTL = merge(m.r.PCCTL, 0x7FF); if (m.r.PCCTL & 1) this.note('chop', 'Le chopper (PCCTL.CHPEN = 1) n\'est pas simulé : les sorties restent celles des temps morts.'); break;
      default: m.r[reg] = merge(m.r[reg] || 0, 0xFFFF);
    }
    this.outputs(m, t);
  }
  lib(name) {
    if (name === 'InitSysCtrl' || name === 'InitPeripheralClocks') { if (this.opts.clockFromInit) this.pclk1 |= 0xFF3F; this.syncRun(this.now()); return false; }
    let mm = /^InitEPwm([1-6])Gpio$/.exec(name), list = null;
    if (mm) list = [+mm[1]]; else if (name === 'InitEPwmGpio') list = [1, 2, 3, 4, 5, 6];
    if (!list) return false;
    const hw = this.hw;
    for (const i of list) for (const n of [(i - 1) * 2, (i - 1) * 2 + 1]) { hw.pud[n] = 0; hw.mux[n] = 1; hw.touch(n); }
    return true;
  }

  /* --- pour l'interface --- */
  measure(m, ch, tnow) {
    const L = m.log[ch]; const n = L.t.length;
    const lvl = m.out[ch];
    let r1 = -1, r2 = -1;
    for (let k = n - 1; k >= 1; k--) if (L.v[k] === 1 && L.v[k - 1] !== 1) { if (r1 < 0) r1 = k; else { r2 = k; break; } }
    if (r2 < 0) return { level: lvl, f: null, duty: lvl === 1 ? 1 : 0 };
    const T = L.t[r1] - L.t[r2];
    let fall = -1; for (let k = r2 + 1; k <= r1; k++) if (L.v[k] !== 1) { fall = k; break; }
    const hi = fall > 0 ? L.t[fall] - L.t[r2] : T;
    if (tnow - L.t[r1] > 3 * T + 2000) return { level: lvl, f: null, duty: lvl === 1 ? 1 : 0, stale: true };
    return { level: lvl, T, f: 1e6 / T, duty: hi / T, thigh: hi };
  }
  dutyPin(n, tnow) {
    const m = this.m[n >> 1]; const ms = this.measure(m, n & 1 ? 'B' : 'A', tnow);
    return ms.f ? ms.duty : (ms.level === 1 ? 1 : 0);
  }
  snapshot(i) {
    this.update(); this.catchUp(this.t);
    const m = this.m[i - 1]; const tnow = this.now();
    const regs = {};
    for (const k of Object.keys(REG)) regs[k] = this.regValue(m, k);
    const c = m.r.TBCTL;
    return {
      i, clockOn: !!this.clockOn(m), running: this.running(m), started: m.started, mode: m.mode, modeName: MODE_NAME[m.mode],
      hsp: HSP[(c >> 7) & 7], clk: 1 << ((c >> 10) & 7), tick: m.tick, ftb: 1 / m.tick,
      ctr: m.ctr, dir: m.dir, prd: m.prd, prdSh: m.prdSh, cmpa: m.cmpa, cmpb: m.cmpb, cmpaSh: m.cmpaSh, cmpbSh: m.cmpbSh, shA: m.shA, shB: m.shB,
      out: Object.assign({}, m.out), regs, nSoca: m.nSoca, nSocb: m.nSocb, nInt: m.nInt, flg: Object.assign({}, m.flg), ost: m.ost, cbc: m.cbc,
      mA: this.measure(m, 'A', tnow), mB: this.measure(m, 'B', tnow), lastZro: m.lastZro, log: m.log, tnow,
      muxA: this.hw.mux[(i - 1) * 2], muxB: this.hw.mux[(i - 1) * 2 + 1], tbsync: !!this.tbsync()
    };
  }
}
function act(cur, a) { return a === 1 ? 0 : a === 2 ? 1 : a === 3 ? 1 - cur : cur; }

/* ---------------- autocomplétion ---------------- */
function completions(base, path) {
  if (base === 'SysCtrlRegs') {
    if (path.length === 0) return [{ label: 'PCLKCR1', insert: 'PCLKCR1.', desc: PCLKCR1.desc, kind: 'R', reopen: true }];
    if (path[0] !== 'PCLKCR1') return null;
    if (path.length === 1) return [{ label: 'bit', insert: 'bit.', desc: 'un champ : .bit.CHAMP', kind: 'b', reopen: true }, { label: 'all', insert: 'all', desc: 'tout le registre (16 bits)', kind: 'b' }];
    if (path.length === 2 && path[1] === 'bit') return PCLKCR1.fields.map(f => ({ label: f.name, insert: f.name + ' = ', desc: `bit ${f.lo} · ${f.desc}`, kind: 'P' }));
    return null;
  }
  if (!modIdx(base)) return null;
  if (path.length === 0) return Object.entries(REG).map(([k, R]) => ({ label: k, insert: k + (R.plain ? ' = ' : '.'), desc: R.desc, kind: 'R', reopen: !R.plain }));
  const R = REG[path[0]]; if (!R || R.plain) return null;
  if (R.union) {
    if (path.length === 1) return [{ label: 'half', insert: 'half.', desc: `.half.${R.union[1]} (16 bits de poids fort) ou .half.${R.union[0]}`, kind: 'b', reopen: true }, { label: 'all', insert: 'all', desc: 'tout le registre (32 bits)', kind: 'b' }];
    if (path.length === 2 && path[1] === 'half') return [{ label: R.union[1], insert: R.union[1] + ' = ', desc: 'valeur 16 bits', kind: 'P' }, { label: R.union[0], insert: R.union[0] + ' = ', desc: 'partie haute résolution (HRPWM), non simulée', kind: 'P' }];
    return null;
  }
  if (path.length === 1) return [{ label: 'bit', insert: 'bit.', desc: 'un champ : .bit.CHAMP', kind: 'b', reopen: true }, { label: 'all', insert: 'all', desc: 'tout le registre (16 bits)', kind: 'b' }];
  if (path.length === 2 && path[1] === 'bit') return R.fields.map(f => ({ label: f.name, insert: f.name + (f.ro ? '' : ' = '), desc: `${f.w > 1 ? `bits ${f.lo + f.w - 1}–${f.lo}` : `bit ${f.lo}`}${f.ro ? ' · lecture seule' : ''} · ${f.desc}`, kind: 'P' }));
  return null;
}

return { REG, PCLKCR1, HSP, FCPU, MODE_NAME, PIN_NAME, checkPath, owns, Model, DEFAULTS, completions, fieldOf };
})();
if (typeof module !== 'undefined') module.exports = EpwmSim;
