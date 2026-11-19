// Captura una vista del mapa por CDP.
// Uso: node tools/shot.mjs <lat> <lng> <zoom> <salida.png> [idMarcador]
import fs from 'node:fs';

const [lat, lng, zoom, outPath, markerId] = process.argv.slice(2);
if (!outPath) {
  console.error('uso: node tools/shot.mjs <lat> <lng> <zoom> <salida.png> [id]');
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Runtime.enable');
await send('Page.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(6000);

const setup = markerId
  ? `(() => {
      const rec = ensureMarker(${JSON.stringify(markerId)});
      state.map.setView([${lat}, ${lng}], ${zoom}, { animate: false });
      rec.layer.openPopup();
      return true;
    })()`
  : `(() => {
      state.map.setView([${lat}, ${lng}], ${zoom}, { animate: false });
      return true;
    })()`;
await send('Runtime.evaluate', { expression: setup, returnByValue: true });

// esperar a que carguen los tiles visibles
await sleep(2600);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
console.log('captura: ' + outPath);
ws.close();
