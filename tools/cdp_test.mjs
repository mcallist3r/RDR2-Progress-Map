// Prueba de extremo a extremo del mapa con Chrome DevTools Protocol.
// Uso: chrome --headless=new --remote-debugging-port=9223 ...
//      node tools/cdp_test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 9223;
const APP = 'http://127.0.0.1:8790/?cdptest=1';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = path.join(ROOT, 'live.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const pageErrors = [];
const record = (name, value) => {
  out.push({ name, value });
  console.log('>>', name + ':', typeof value === 'string' ? value : JSON.stringify(value));
};
const assert = (cond, msg) => {
  if (!cond) throw new Error('FALLO: ' + msg);
  record('ok', msg);
};

async function cdpTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (_) { /* Chrome aún arrancando */ }
    await sleep(300);
  }
  throw new Error('Chrome CDP no disponible');
}

const wsUrl = await cdpTarget();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    pageErrors.push((d.exception && d.exception.description) || d.text);
  }
  const arr = eventWaiters.get(msg.method);
  if (arr && arr.length) arr.shift()(msg.params);
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function waitEvent(method, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const arr = eventWaiters.get(method) || [];
    const timer = setTimeout(() => reject(new Error('timeout ' + method)), timeout);
    arr.push((p) => { clearTimeout(timer); resolve(p); });
    eventWaiters.set(method, arr);
  });
}

async function ev(expression) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('excepción en la página: ' +
      ((d.exception && d.exception.description) || d.text) + ' :: ' + expression.slice(0, 120));
  }
  return r.result ? r.result.value : undefined;
}

async function waitFor(expression, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await ev(expression)) return true;
    await sleep(250);
  }
  return false;
}

await send('Runtime.enable');
await send('Page.enable');

// ---- 1. carga inicial ----
const firstLoad = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url: APP });
await firstLoad;
await ev('localStorage.clear(); true');
const loaded = waitEvent('Page.loadEventFired');
await send('Page.reload', { ignoreCache: true });
await loaded;
const ready = await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')", 30000);
assert(ready, 'la app termina de cargar (overlay oculto)');

const base = await ev(`(() => ({
  markers: state.markers.length,
  built: state.byId.size,
  cats: Object.keys(state.cats).length,
  saves: state.saves.length,
  save: state.save,
  total: state.tracked.length,
  doneSize: state.tracked.filter((m) => state.done.has(m.id)).length,
  overall: document.getElementById('overall-text').textContent,
  pins: document.querySelectorAll('.mk').length,
  dateText: state.saves[0].dateText,
  options: document.getElementById('save-select').options.length,
}))()`);
record('estado inicial', base);
assert(base.markers === 6971, 'hay 6971 marcadores en el dataset');
assert(base.built > 600 && base.built < 800, 'se construyen solo los ~681 marcadores no-planta');
assert(base.saves >= 16, 'se detectan al menos 16 partidas');
assert(base.options === base.saves, 'el selector lista todas las partidas');
assert(base.total === 623, 'el total rastreado es 623');
assert(/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(base.dateText),
  'la fecha se muestra en formato español');

// ---- 2. popup de un hueso de dinosaurio ----
const bone = await ev(`(() => {
  const m = state.markers.find((x) => x.cat === 'sp_dino_bones');
  state.byId.get(m.id).layer.openPopup();
  return { id: m.id, name: m.name, lat: m.lat, lng: m.lng };
})()`);
record('hueso', bone);
await sleep(500);
const popupText = await ev("document.querySelector('.leaflet-popup-content').innerText");
record('popup', popupText);
assert(popupText.includes(bone.name), 'el popup muestra el nombre del marcador');
assert(popupText.includes('Marcar como hecho'), 'el popup ofrece marcarlo como hecho');

// ---- 3. marcar desde el popup ----
await ev("document.querySelector('.leaflet-popup-content .pop-actions button[data-act=\"toggle\"]').click()");
await sleep(1400);
const afterMark = await ev(`(() => ({
  done: state.done.has(${JSON.stringify(bone.id)}),
  overall: document.getElementById('overall-text').textContent,
  popup: document.querySelector('.leaflet-popup-content').innerText,
}))()`);
record('tras marcar', afterMark);
assert(afterMark.done, 'el marcador queda como hecho');
assert(afterMark.overall.startsWith((base.doneSize + 1) + ' / 623'),
  'el contador general sube tras marcar');
assert(afterMark.popup.includes('Deshacer'), 'el popup cambia a Deshacer');

const slot = await ev('state.save');
const stored = await (await fetch('http://127.0.0.1:8790/api/progress?save=' + encodeURIComponent(slot))).json();
record('progress.json', { slot, count: Object.keys(stored.done || {}).length });
assert(stored.done && stored.done[bone.id], 'el servidor guardó el marcador en progress/' + slot + '.json');

// ---- 4. recarga: persiste ----
const reloaded = waitEvent('Page.loadEventFired');
await send('Page.reload', { ignoreCache: true });
await reloaded;
await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')", 30000);
const persisted = await ev(`(() => ({
  done: state.done.has(${JSON.stringify(bone.id)}),
  overall: document.getElementById('overall-text').textContent,
  doneEls: document.querySelectorAll('.mk.done').length,
}))()`);
record('tras recargar', persisted);
assert(persisted.done, 'el marcador sigue hecho tras recargar');
assert(persisted.overall.startsWith((base.doneSize + 1) + ' / 623'), 'el contador se restaura');

// ---- 5. cambio de partida ----
const otherSlot = await ev(`(() => {
  const o = state.saves.find((s) => s.slot !== state.save);
  return o ? o.slot : null;
})()`);
record('otra partida', otherSlot);
const otherBefore = await (await fetch('http://127.0.0.1:8790/api/progress?save=' +
  encodeURIComponent(otherSlot))).json();
const otherCount = Object.keys(otherBefore.done || {}).length;
await ev(`switchSave(${JSON.stringify(otherSlot)})`);
await sleep(600);
const otherState = await ev(`(() => ({
  save: state.save,
  done: state.done.size,
  overall: document.getElementById('overall-text').textContent,
}))()`);
record('progreso de la otra partida', otherState);
assert(otherState.done === otherCount, 'cada partida carga su propio progreso (' + otherCount + ')');
assert(otherState.overall.startsWith(otherCount + ' / 623'), 'su contador coincide con su progreso');

await ev(`switchSave(${JSON.stringify(slot)})`);
await sleep(600);
const backState = await ev(`(() => ({
  done: state.done.size,
  marked: state.done.has(${JSON.stringify(bone.id)}),
}))()`);
record('al volver', backState);
assert(backState.marked, 'al volver a la primera partida se recupera el progreso');

// ---- 6. búsqueda ----
const search = await ev(`(() => {
  const input = document.getElementById('search-input');
  input.value = 'hueso';
  runSearch('hueso');
  return {
    results: document.querySelectorAll('#search-results .sr').length,
    first: (document.querySelector('#search-results .sr .nm') || {}).textContent || '',
    hidden: document.getElementById('search-results').classList.contains('hidden'),
  };
})()`);
record('búsqueda "hueso"', search);
assert(!search.hidden && search.results > 0, 'la búsqueda encuentra huesos');
await ev(`(() => {
  document.getElementById('search-input').value = '';
  runSearch('');
})()`);

// ---- 7. plantas perezosas al acercar ----
await ev('(() => { state.map.setZoom(5, { animate: false }); return true; })()');
const plantsOk = await waitFor('state.byId.size > 6900', 15000);
const plants = await ev(`(() => ({
  built: state.byId.size,
  plants: state.plantQueue.length,
  pins: document.querySelectorAll('.mk').length,
  dots: document.querySelectorAll('path.leaflet-interactive').length,
}))()`);
record('zoom 5', plants);
assert(plantsOk, 'al hacer zoom se construyen las 6290 plantas (total ' + plants.built + ')');

// ---- 8. posición en vivo + auto-marcado ----
const tiles = await (await fetch('http://127.0.0.1:8790/data/markers.json')).json();
const target = tiles.markers.filter((m) => m.cat === 'sp_dino_bones')
  .find((m) => m.id !== bone.id);
const gx = (target.lng - 111.29) / 0.01552;
const gy = (target.lat + 63.6) / 0.01552;
fs.writeFileSync(LIVE, JSON.stringify({
  x: gx, y: gy, z: 100, heading: 90, ts: Date.now() / 1000,
}));
const liveOk = await waitFor("document.getElementById('live-text').textContent.startsWith('En vivo ·')", 8000);
const live = await ev(`(() => ({
  text: document.getElementById('live-text').textContent,
  marker: !!state.liveMarker,
  lat: state.live && state.live.lat,
  lng: state.live && state.live.lng,
  transform: (document.querySelector('.player svg') || {}).style
    ? document.querySelector('.player svg').style.transform : '',
}))()`);
record('posición en vivo', live);
assert(liveOk && live.marker, 'la flecha del jugador aparece y el estado pasa a en vivo');
assert(live.transform === 'rotate(-90deg)', 'la flecha gira al oeste con rumbo 90 (convención antihoraria)');
assert(Math.abs(live.lat - target.lat) < 0.2 && Math.abs(live.lng - target.lng) < 0.2,
  'la conversión juego→mapa coloca al jugador donde toca');

await ev(`(() => {
  const cb = document.getElementById('proximity');
  cb.checked = true;
  cb.dispatchEvent(new Event('change'));
})()`);
const autoOk = await waitFor(`state.done.has(${JSON.stringify(target.id)})`, 8000);
record('auto-marcado', { autoOk, id: target.id });
assert(autoOk, 'el auto-marcado por proximidad marca el hueso cercano');

// limpieza del auto-marcado
await ev(`toggleDone(${JSON.stringify(target.id)})`);
await ev(`(() => {
  const cb = document.getElementById('proximity');
  cb.checked = false;
  cb.dispatchEvent(new Event('change'));
})()`);
fs.unlinkSync(LIVE);
await waitFor("document.getElementById('live-text').textContent.startsWith('En vivo: sin conexión')", 6000);
const offline = await ev("!state.liveMarker");
assert(offline, 'al desaparecer live.json la flecha se retira y el estado vuelve a sin conexión');

// ---- 9. deshacer el marcador de prueba ----
await sleep(500);
await ev(`toggleDone(${JSON.stringify(bone.id)})`);
await sleep(1200);
const cleaned = await ev(`(() => ({
  done: state.tracked.filter((m) => state.done.has(m.id)).length,
  overall: document.getElementById('overall-text').textContent,
}))()`);
record('limpieza final', cleaned);
assert(cleaned.done === base.doneSize, 'el marcador de prueba se ha deshecho');

// ---- 10. exportar e importar progreso ----
const importedId = await ev(`(() => {
  const m = state.markers.find((x) => x.cat === 'sp_dreamcatchers');
  return m.id;
})()`);
const importOk = await ev(`(async () => {
  const payload = { format: 'rdr2map-progress', done: [${JSON.stringify(importedId)}] };
  const file = new File([JSON.stringify(payload)], 'prueba.json',
                        { type: 'application/json' });
  await importProgress(file);
  return state.done.has(${JSON.stringify(importedId)});
})()`);
await sleep(600);
const storedImport = await (await fetch('http://127.0.0.1:8790/api/progress?save=' +
  encodeURIComponent(slot))).json();
record('importar', { importOk, count: Object.keys(storedImport.done || {}).length });
assert(importOk && storedImport.done[importedId],
  'la importación añade marcadores y los guarda en el servidor');

const exportWorks = await ev(`(() => {
  try { exportProgress(); return true; } catch (err) { return String(err); }
})()`);
record('exportar', exportWorks);
assert(exportWorks === true, 'la exportación genera el JSON sin errores');

await ev(`toggleDone(${JSON.stringify(importedId)})`);
await sleep(1200);
const finalClean = await ev('state.tracked.filter((m) => state.done.has(m.id)).length');
record('limpieza import', finalClean);
assert(finalClean === base.doneSize, 'el marcador importado se deshace al final');

// ---- resultado ----
if (pageErrors.length) {
  record('errores de página', pageErrors);
  throw new Error('hubo excepciones en el navegador');
}
console.log('\nTODO CORRECTO. ' + out.filter((o) => o.name === 'ok').length + ' comprobaciones.');
ws.close();
