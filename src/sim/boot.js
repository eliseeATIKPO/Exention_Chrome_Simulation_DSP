// Démarrage du simulateur dans la page sandbox : on attend les données enregistrées
// (envoyées par la page hôte), puis on charge les scripts dans l'ordre.
(function () {
  'use strict';
  const SCRIPTS = ['adc.js', 'engine.js', 'exos.js', 'ui.js'];
  const host = window.parent !== window ? window.parent : null;
  const waiting = new Map(); let seq = 0;
  const handlers = { external: [], prefs: [] };
  window.BRIDGE = {
    state: null, prefs: null, mode: 'tab', version: '', embedded: !!host,
    save(key, value) { if (host) host.postMessage({ type: 'save', key, value }, '*'); },
    copy(text) {
      return new Promise(res => {
        if (!host) { res(false); return; }
        const id = ++seq; waiting.set(id, res); host.postMessage({ type: 'copy', text, id }, '*');
        setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); res(false); } }, 2500);
      });
    },
    download(name, text, mime) { if (host) host.postMessage({ type: 'download', name, text, mime }, '*'); },
    openTab() { if (host) host.postMessage({ type: 'openTab' }, '*'); },
    title(t) { if (host) host.postMessage({ type: 'title', title: t }, '*'); },
    on(ev, f) { (handlers[ev] || (handlers[ev] = [])).push(f); }
  };
  function load(i) {
    if (i >= SCRIPTS.length) return;
    const s = document.createElement('script'); s.src = SCRIPTS[i];
    s.onload = () => load(i + 1);
    s.onerror = () => { document.body.insertAdjacentHTML('afterbegin', `<p style="padding:12px;color:#C4291C">Impossible de charger ${SCRIPTS[i]}.</p>`); };
    document.body.append(s);
  }
  let started = false;
  function start() { if (started) return; started = true; load(0); }
  window.addEventListener('message', e => {
    if (!host || e.source !== host) return;
    const m = e.data || {};
    if (m.type === 'init') {
      BRIDGE.state = typeof m.state === 'string' ? m.state : null;
      BRIDGE.prefs = typeof m.prefs === 'string' ? m.prefs : null;
      BRIDGE.mode = m.mode === 'panel' ? 'panel' : 'tab'; BRIDGE.version = m.version || '';
      start();
    } else if (m.type === 'copied') { const f = waiting.get(m.id); if (f) { waiting.delete(m.id); f(!!m.ok); } }
    else if (handlers[m.type]) handlers[m.type].forEach(f => { try { f(m); } catch (_) {} });
  });
  if (host) host.postMessage({ type: 'ready' }, '*');
  // Ouvert seul (hors extension) : démarre sans sauvegarde.
  setTimeout(start, host ? 2500 : 0);
})();
