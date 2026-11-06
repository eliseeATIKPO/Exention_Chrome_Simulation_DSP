// Page hôte de l'extension. Le simulateur tourne dans une page « sandbox » (il compile le C en
// JavaScript, ce qu'une page d'extension normale n'a pas le droit de faire). Cette page lui sert
// de pont vers chrome.storage, le presse-papiers et les téléchargements.
const STATE_KEY = 'f28335-sim-v1';
const PREF_KEY = 'f28335-sim-prefs';
const mode = new URLSearchParams(location.search).get('mode') === 'panel' ? 'panel' : 'tab';
const instance = Math.random().toString(36).slice(2);
const frame = document.getElementById('sim');
const post = msg => frame.contentWindow && frame.contentWindow.postMessage(msg, '*');
let lastWrite = {};

async function sendInit() {
  const d = await chrome.storage.local.get([STATE_KEY, PREF_KEY]);
  post({ type: 'init', state: d[STATE_KEY] || null, prefs: d[PREF_KEY] || null, mode, version: chrome.runtime.getManifest().version });
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
  }
}
function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime || 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

window.addEventListener('message', async e => {
  if (e.source !== frame.contentWindow) return;   // seulement le simulateur
  const m = e.data || {};
  switch (m.type) {
    case 'ready': sendInit(); break;
    case 'save':
      if (m.key !== STATE_KEY && m.key !== PREF_KEY) return;
      lastWrite[m.key] = m.value;
      chrome.storage.local.set({ [m.key]: m.value, ['f28335-sim-writer']: instance + ':' + Date.now() });
      break;
    case 'copy': { const ok = await copyText(String(m.text || '')); post({ type: 'copied', id: m.id, ok }); break; }
    case 'download': download(String(m.name || 'export.json'), String(m.text || ''), m.mime); break;
    case 'openTab': chrome.runtime.sendMessage({ type: 'openTab' }); break;
    case 'title': if (typeof m.title === 'string') document.title = m.title; break;
  }
});

// Si le même simulateur est ouvert ailleurs (onglet + panneau), on prévient.
chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  const w = ch['f28335-sim-writer'];
  if (w && w.newValue && !String(w.newValue).startsWith(instance + ':') && ch[STATE_KEY]) post({ type: 'external' });
  if (ch[PREF_KEY] && ch[PREF_KEY].newValue !== lastWrite[PREF_KEY]) post({ type: 'prefs', prefs: ch[PREF_KEY].newValue });
});
