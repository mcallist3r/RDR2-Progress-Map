// Estrés: zooms rápidos y paneos para ver si se disparan tiles falsos
// (peticiones abortadas) que muestran el aviso de "faltan tiles".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 9223;
const APP = 'http://127.0.0.1:8790/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (_) {}
    await sleep(300);
  }
  throw new Error('CDP no disponible');
}

const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1;
const pending = new Map();
const waiters = new Map();
const httpStatus = new Map();
let aborted = 0, failed = 0;
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    return;
  }
  if (m.method === 'Network.responseReceived' && m.params.response.url.includes('/tiles/')) {
    const s = m.params.response.status;
    httpStatus.set(s, (httpStatus.get(s) || 0) + 1);
  }
  if (m.method === 'Network.loadingFailed') {
    if (m.params.errorText === 'net::ERR_ABORTED') aborted++;
    else failed++;
  }
  const arr = waiters.get(m.method);
  if (arr && arr.length) arr.shift()(m.params);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const waitEvent = (method, timeout = 30000) => new Promise((resolve, reject) => {
  const arr = waiters.get(method) || [];
  const t = setTimeout(() => reject(new Error('timeout ' + method)), timeout);
  arr.push((p) => { clearTimeout(t); resolve(p); });
  waiters.set(method, arr);
});
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text);
  return r.result ? r.result.value : undefined;
}
async function waitFor(expression, timeout = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await ev(expression)) return true;
    await sleep(200);
  }
  return false;
}

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');
const loaded = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url: APP });
await loaded;
await ev('localStorage.clear(); true');
const rel = waitEvent('Page.loadEventFired');
await send('Page.reload', { ignoreCache: true });
await rel;
await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')");

console.log('inicial', await ev("JSON.stringify({zoom: state.map.getZoom(), tileErrors: state.tileErrors})"));

// 30 cambios rápidos de zoom (como la rueda del ratón)
await ev(`(async () => {
  for (let i = 0; i < 15; i++) {
    state.map.zoomIn(1, { animate: false });
    await new Promise((r) => setTimeout(r, 60));
  }
  for (let i = 0; i < 15; i++) {
    state.map.zoomOut(1, { animate: false });
    await new Promise((r) => setTimeout(r, 60));
  }
  return true;
})()`);
await sleep(2500);
console.log('tras zoom rápido', await ev("JSON.stringify({zoom: state.map.getZoom(), tileErrors: state.tileErrors, banner: (document.getElementById('banner') || {}).textContent || ''})"));

// paneos rápidos
await ev(`(async () => {
  for (let i = 0; i < 12; i++) {
    state.map.panBy([300, 200], { animate: false });
    await new Promise((r) => setTimeout(r, 80));
  }
  return true;
})()`);
await sleep(2000);
console.log('tras paneo', await ev("JSON.stringify({zoom: state.map.getZoom(), tileErrors: state.tileErrors, banner: (document.getElementById('banner') || {}).textContent || ''})"));

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.mkdirSync(path.join(ROOT, 'tools', 'cache'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tools', 'cache', 'estres-final.png'), Buffer.from(shot.data, 'base64'));

console.log('HTTP tiles', JSON.stringify([...httpStatus.entries()]), 'abortadas', aborted, 'fallidas', failed);
ws.close();
