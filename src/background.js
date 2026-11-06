// Service worker : ouverture du simulateur dans un onglet ou dans le panneau latéral.
const PREF_KEY = 'f28335-sim-prefs';
const APP = 'app.html';

async function openMode() {
  try { const d = await chrome.storage.local.get(PREF_KEY); const p = JSON.parse(d[PREF_KEY] || '{}'); return p.openIn === 'panel' ? 'panel' : 'tab'; }
  catch (e) { return 'tab'; }
}
// Le panneau latéral doit s'ouvrir pendant le clic : on règle donc le comportement du bouton à l'avance.
async function applyBehavior() {
  const mode = await openMode();
  try { await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode === 'panel' }); } catch (e) {}
}
async function openTab() {
  const url = chrome.runtime.getURL(APP);
  const tabs = await chrome.tabs.query({ url: url + '*' });
  const t = tabs.find(x => !/mode=panel/.test(x.url || ''));
  if (t) { await chrome.tabs.update(t.id, { active: true }); await chrome.windows.update(t.windowId, { focused: true }); }
  else await chrome.tabs.create({ url });
}
function menus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'open-tab', title: 'Ouvrir dans un onglet', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'open-panel', title: 'Ouvrir dans le panneau latéral', contexts: ['action'] });
  });
}
chrome.runtime.onInstalled.addListener(() => { menus(); applyBehavior(); });
chrome.runtime.onStartup.addListener(() => { menus(); applyBehavior(); });
chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch[PREF_KEY]) applyBehavior(); });

// Appelé seulement quand le bouton n'ouvre pas le panneau (mode « onglet »).
chrome.action.onClicked.addListener(() => { openTab(); });

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-tab') openTab();
  if (info.menuItemId === 'open-panel' && tab) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && msg.type === 'openTab') { openTab().then(() => reply(true)); return true; }
  return false;
});
