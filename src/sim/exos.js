/* ======================== PROJETS ========================
   Projets libres : la carte et les capteurs sont branchés, tu écris ton code et tu le lances. */
const HEADER = (t) => `//###########################################################################
// ${t}
//###########################################################################
#include "DSP28x_Project.h"     // en-têtes du DSP (fournis par le simulateur)
`;
const SOLS = {};
const BOARD_TABLE = `<table><tr><th>Composant</th><th>Broche du DSP</th></tr>
<tr><td>LD1, LD2</td><td>GPIO9, GPIO11 (port A)</td></tr>
<tr><td>LD3, LD4</td><td>GPIO34, GPIO49 (port B)</td></tr>
<tr><td>PB1, PB2</td><td>GPIO17, GPIO48 (tirage vers 3,3 V : relâché = 1, appuyé = 0)</td></tr>
<tr><td>Roue codeuse SW2</td><td>GPIO12 (bit 0) à GPIO15 (bit 3)</td></tr>
<tr><td>VR1, VR2</td><td>ADCINA0 (voie 0), ADCINA1 (voie 1), 0 à 3 V</td></tr></table>`;
const BOARD_COMPS = [{ name: 'LD1', pin: 9, role: 'out' }, { name: 'LD2', pin: 11, role: 'out' }, { name: 'LD3', pin: 34, role: 'out' }, { name: 'LD4', pin: 49, role: 'out' }, { name: 'PB1', pin: 17, role: 'in' }, { name: 'PB2', pin: 48, role: 'in' }, { name: 'Roue b0', pin: 12, role: 'in' }, { name: 'Roue b1', pin: 13, role: 'in' }, { name: 'Roue b2', pin: 14, role: 'in' }, { name: 'Roue b3', pin: 15, role: 'in' }];
const VRS = () => ({ 0: { type: 'pot', label: 'VR1', v: 1.5 }, 1: { type: 'pot', label: 'VR2', v: 0.8 } });
const EXOS = [
{
  id: 'libre', chap: 0, tab: 'Libre GPIO', sub: 'LED, boutons, roue', proj: 'Libre_GPIO',
  title: 'Projet libre GPIO', ref: 'Toute la carte',
  uses: ['LD1', 'LD2', 'LD3', 'LD4', 'PB1', 'PB2', 'SW2'], modules: [], comps: BOARD_COMPS,
  scope: { sigs: [[9, 'LD1'], [11, 'LD2'], [34, 'LD3'], [49, 'LD4'], [17, 'PB1'], [48, 'PB2']], tb: 200000, mode: 'roll' },
  expr: [], sensors: VRS(),
  starter: HEADER('Projet libre GPIO : LD1 -> LD4 en chenillard. Modifie à volonté.') + `
#define PAUSE 250000    // 250 ms

void initLeds(void);

void main(void)
{
    InitSysCtrl();
    initLeds();
    while (1)
    {
        GpioDataRegs.GPASET.bit.GPIO9  = 1;  DELAY_US(PAUSE);  GpioDataRegs.GPACLEAR.bit.GPIO9  = 1;
        GpioDataRegs.GPASET.bit.GPIO11 = 1;  DELAY_US(PAUSE);  GpioDataRegs.GPACLEAR.bit.GPIO11 = 1;
        GpioDataRegs.GPBSET.bit.GPIO34 = 1;  DELAY_US(PAUSE);  GpioDataRegs.GPBCLEAR.bit.GPIO34 = 1;
        GpioDataRegs.GPBSET.bit.GPIO49 = 1;  DELAY_US(PAUSE);  GpioDataRegs.GPBCLEAR.bit.GPIO49 = 1;
    }
}

// LD1 (GPIO9), LD2 (GPIO11), LD3 (GPIO34) et LD4 (GPIO49) en sortie
void initLeds(void)
{
    EALLOW;
    GpioCtrlRegs.GPAMUX1.bit.GPIO9  = 0;   GpioCtrlRegs.GPADIR.bit.GPIO9  = 1;
    GpioCtrlRegs.GPAMUX1.bit.GPIO11 = 0;   GpioCtrlRegs.GPADIR.bit.GPIO11 = 1;
    GpioCtrlRegs.GPBMUX1.bit.GPIO34 = 0;   GpioCtrlRegs.GPBDIR.bit.GPIO34 = 1;
    GpioCtrlRegs.GPBMUX2.bit.GPIO49 = 0;   GpioCtrlRegs.GPBDIR.bit.GPIO49 = 1;
    EDIS;
}
`,
  enonce: `
<h2>Projet libre GPIO</h2><p class="ref">Toute la carte</p>
<p>Un projet pour tester une idée. Il démarre avec un chenillard sur LD1 → LD4.</p>
<h3>Carte</h3>${BOARD_TABLE}`
},
{
  id: 'libre-adc', chap: 0, tab: 'Libre ADC', sub: 'VR1, VR2, capteurs', proj: 'Libre_ADC',
  title: 'Projet libre ADC', ref: 'Module ADC et capteurs virtuels',
  uses: ['LD1', 'LD2', 'LD3', 'LD4', 'PB1', 'PB2'], modules: [], comps: BOARD_COMPS.slice(0, 6),
  right: 'sensors', btab: 'adc', plot: 'hist', plotCh: 0,
  scope: { sigs: [[9, 'LD1'], [11, 'LD2'], [34, 'LD3'], [49, 'LD4']], tb: 200000, mode: 'roll' },
  expr: ['N'], sensors: VRS(),
  starter: HEADER('Projet libre ADC : lecture de VR1 (ADCINA0). Modifie à volonté.') + `
Uint16 N;               // résultat de la conversion (0 à 4095)

void main(void)
{
    InitSysCtrl();

    EALLOW;
    SysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1;   // horloge de l'ADC
    EDIS;
    AdcRegs.ADCTRL1.bit.RESET = 1;
    asm(" NOP");
    AdcRegs.ADCTRL1.bit.SEQ_CASC = 1;       // séquenceur cascadé
    AdcRegs.ADCMAXCONV.all = 0;             // une conversion
    AdcRegs.ADCCHSELSEQ1.bit.CONV00 = 0;    // voie ADCINA0 (VR1)

    while (1)
    {
        AdcRegs.ADCTRL2.bit.RST_SEQ1 = 1;
        AdcRegs.ADCTRL2.bit.SOC_SEQ1 = 1;
        while (AdcRegs.ADCST.bit.SEQ1_BSY == 1);
        N = AdcRegs.ADCRESULT0 >> 4;        // 0 à 4095
    }
}
`,
  enonce: `
<h2>Projet libre ADC</h2><p class="ref">Module ADC et capteurs virtuels</p>
<p>Un projet pour s'entraîner sur l'ADC. Il démarre avec la lecture de VR1 dans <code>N</code> (onglet Expressions).</p>
<h3>Carte</h3>${BOARD_TABLE}
<h3>Pendant la simulation</h3>
<ul><li>Onglet <b>Capteurs ADC</b> (à droite) : règle VR1 / VR2 ou branche un autre capteur (capteur linéaire, générateur, microphone) sur n'importe quelle voie.</li>
<li>Onglet <b>ADC</b> (en bas) : registres décodés, séquence, tracé des conversions ou d'un tableau du programme, période et fréquence d'échantillonnage mesurées.</li>
<li>Temps simulé : environ 0,05 µs par instruction C exécutée.</li></ul>`
}
];
