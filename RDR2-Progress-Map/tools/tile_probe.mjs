// Sonda de tiles: carga la app en Chrome headless y registra cada fallo de red
// mientras recorre zooms y esquinas del mapa.
// Uso: chrome --headless=new --remote-debugging-port=9223 about:blank
//      node tools/tile_probe.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 9223;
const APP = 'http://127.0.0.1:8790/';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cache');
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (_) { /* aún arrancando */ }
    await sleep(300);
  }
  throw new Error('Chrome CDP no disponible');
}

const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
const waiters = new Map();
const failed = [];
const tileStatus = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method === 'Network.responseReceived') {
    const r = msg.params.response;
    if (r.url.includes('/tiles/')) {
      tileStatus.set(r.status, (tileStatus.get(r.status) || 0) + 1);
      if (r.status >= 400) failed.push({ url: r.url, status: r.status });
    }
  }
  if (msg.method === 'Network.loadingFailed') {
    const p = msg.params;
    if ((p.errorText || '') !== 'net::ERR_ABORTED') {
      failed.push({ url: p.requestId, status: p.errorText, blocked: p.blockedReason });
    }
  }
  const arr = waiters.get(msg.method);
  if (arr && arr.length) arr.shift()(msg.params);
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

const info = await ev(`(() => ({
  size: [window.innerWidth, window.innerHeight],
  zoom: state.map.getZoom(),
  center: [state.map.getCenter().lat, state.map.getCenter().lng],
  tileErrors: state.tileErrors,
  banner: (document.getElementById('banner') || {}).textContent || '(sin banner)',
}))()`);
console.log('inicio', JSON.stringify(info));

const views = [
  ['z2-centro', [-72, 88], 2],
  ['z3-centro', [-72, 88], 3],
  ['z3-esquina-noroeste', [-10, 10], 3],
  ['z4-centro', [-72, 88], 4],
  ['z5-valentine', [-60, 50], 5],
  ['z6-hueso', [-70, 90], 6],
  ['z7-centro', [-72, 88], 7],
  ['z7-extremo-este', [-72, 230], 7],
  ['z7-extremo-oeste', [-72, -55], 7],
  ['z7-extremo-norte', [45, 88], 7],
  ['z7-extremo-sur', [-190, 88], 7],
  ['z2-extremo', [45, 230], 2],
  ['z4-extremo', [-190, -55], 4],
];

for (const [name, center, zoom] of views) {
  const before = tileStatus.get(404) || 0;
  await ev(`(() => { state.map.setView([${center[0]}, ${center[1]}], ${zoom}, { animate: false }); return true; })()`);
  await sleep(1600);
  const st = await ev(`(() => ({
    zoom: state.map.getZoom(),
    tileErrors: state.tileErrors,
    banner: (document.getElementById('banner') || {}).textContent || '(sin banner)',
  }))()`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(shot.data, 'base64'));
  console.log(name, JSON.stringify(st), '404s nuevos:', (tileStatus.get(404) || 0) - before);
}

console.log('estados HTTP de tiles:', JSON.stringify([...tileStatus.entries()]));
console.log('fallos:', failed.length);
for (const f of failed.slice(0, 60)) console.log('  ', f.status, f.url);
ws.close();
