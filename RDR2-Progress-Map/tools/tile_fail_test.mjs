// Comprueba el aviso de tiles: bloquea /tiles/* por red para forzar errores,
// verifica el mensaje y el botón, y luego desbloquea y recarga.
const PORT = 9223;
const APP = 'http://127.0.0.1:8790/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    return;
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
async function waitFor(expression, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await ev(expression)) return true;
    await sleep(200);
  }
  return false;
}
const snap = () => ev(`(() => {
  const b = document.getElementById('banner');
  return {
    zoom: state.map.getZoom(),
    errors: state.tileErrors,
    redraws: state.tileRedraws,
    banner: b ? b.textContent : '',
    buttons: b ? Array.from(b.querySelectorAll('button')).map((x) => x.textContent) : [],
  };
})()`);

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');
const loaded = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url: APP });
await loaded;
await ev('localStorage.clear(); true');
await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')");
console.log('normal:', JSON.stringify(await snap()));

// bloquea todos los tiles y recarga
await send('Network.setBlockedURLs', { urls: ['*/tiles/*'] });
const rel = waitEvent('Page.loadEventFired');
await send('Page.reload', { ignoreCache: true });
await rel;
await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')");
await sleep(4500);
console.log('sin tiles:', JSON.stringify(await snap()));

// desbloquea y recarga desde el botón
await send('Network.setBlockedURLs', { urls: [] });
await ev("document.querySelector('#banner button').click(); true");
await waitEvent('Page.loadEventFired');
await waitFor("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')");
await sleep(1500);
console.log('recargado:', JSON.stringify(await snap()));
ws.close();
