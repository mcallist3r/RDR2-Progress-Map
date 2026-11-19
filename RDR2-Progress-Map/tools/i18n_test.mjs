// Comprobación de solo lectura de las traducciones al español.
// Uso: node tools/i18n_test.mjs   (con Chrome CDP en 9223 y el servidor en 8790)
const PORT = 9223;
const APP = 'http://127.0.0.1:8790/?cdptest=1';
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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result ? r.result.value : undefined;
}
const assert = (ok, msg) => {
  if (!ok) throw new Error('FALLO: ' + msg);
  console.log('ok:', msg);
};

await send('Runtime.enable');
await send('Page.enable');
const loaded = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url: APP });
await loaded;
for (let i = 0; i < 60; i++) {
  if (await ev("typeof state !== 'undefined' && document.getElementById('loading').classList.contains('hidden')")) break;
  await sleep(500);
}
// El idioma y el tamaño se recuerdan en localStorage: fija español para el test.
await ev("if (typeof setLang === 'function' && state.lang !== 'es') setLang('es'); applyFontSize('l', false); true");

const data = await ev(`(() => {
  const elk = state.markers.find((m) => m.nameEn === 'Legendary Elk');
  const card = state.markers.find((m) => m.nameEn && m.noteEn);
  return {
    elkName: elk && elk.name,
    elkPopup: elk && popupHtml(elk),
    cardName: card && card.name,
    cardNote: card && card.note,
    cardNoteEn: card && card.noteEn,
  };
})()`);
console.log('muestra:', JSON.stringify(data, null, 1));
assert(data.elkName === 'Alce legendario', 'el nombre del animal aparece en español');
assert(data.elkPopup.includes('Alce legendario'), 'el popup usa el nombre español');
assert(data.elkPopup.includes('pop-name-en') &&
  data.elkPopup.includes('Legendary Elk'), 'el popup muestra el nombre original inglés');
assert(data.elkPopup.includes('pop-img') &&
  data.elkPopup.includes('/images/legendary/legendary-elk.webp'),
  'el popup incluye la imagen local del animal');
assert(data.cardNote && data.cardNote !== data.cardNoteEn, 'las notas se muestran en español');

const imgs = await ev(`(async () => {
  const urls = [...new Set(Object.values(state.images))];
  const status = await Promise.all(urls.map((u) => fetch(u)
    .then((r) => r.status).catch(() => 0)));
  return {
    count: Object.keys(state.images).length,
    unique: urls.length,
    imagesOk: status.filter((s) => s === 200).length,
  };
})()`);
console.log('imágenes:', JSON.stringify(imgs));
assert(imgs.count === 29 && imgs.unique === 29,
  'los 29 legendarios tienen imagen asociada');
assert(imgs.imagesOk === 29, 'todas las imágenes se sirven desde el servidor local');

const searches = await ev(`(() => {
  const count = (q) => { runSearch(q); return document.querySelectorAll('#search-results .sr').length; };
  const es = count('alce');
  const en = count('elk');
  const empty = count('');
  return { es, en, empty };
})()`);
console.log('búsquedas:', JSON.stringify(searches));
assert(searches.es > 0, 'el buscador encuentra «alce»');
assert(searches.en > 0, 'el buscador sigue encontrando «elk»');
assert(searches.empty === 0, 'vaciar el buscador limpia los resultados');

const english = await ev(`(() => {
  const before = state.lang;
  document.querySelector('#lang-switch [data-lang="en"]').click();
  const elk = state.markers.find((m) => m.nameEn === 'Legendary Elk');
  return {
    before,
    lang: state.lang,
    htmlLang: document.documentElement.lang,
    title: document.title,
    group: document.querySelector('.group-head > span').textContent,
    cat: document.querySelector('.cat-name').textContent,
    saveLabel: document.querySelector('.save-picker label').textContent,
    tab: document.querySelector('.tabs button').textContent,
    popup: popupHtml(elk),
    elkTooltip: elk ? markerName(elk) : null,
  };
})()`);
console.log('inglés:', JSON.stringify({ ...english, popup: undefined }));
assert(english.before === 'es', 'el test empieza en español');
assert(english.lang === 'en' && english.htmlLang === 'en', 'ES/EN cambia el idioma de la página');
assert(english.title === 'RDR2 · Progress Map', 'el título se traduce al inglés');
assert(english.group === 'Collectibles', 'los grupos de la barra lateral se traducen');
assert(english.cat === 'Dinosaur Bones', 'las categorías se traducen');
assert(english.saveLabel === 'Save' && english.tab === 'All', 'la interfaz fija se traduce');
assert(english.elkTooltip === 'Legendary Elk', 'los tooltips usan el nombre inglés');
assert(english.popup.includes('Legendary Elk') &&
  english.popup.includes('Alce legendario'),
  'en inglés el popup muestra el nombre inglés y el español debajo');
assert(english.popup.includes('Mark as done') &&
  english.popup.includes('Center'), 'los botones del popup se traducen');

const sizes = await ev(`(() => {
  const options = document.querySelectorAll('#font-select option').length;
  applyFontSize('xxl', false);
  const big = document.documentElement.style.zoom;
  applyFontSize('s', false);
  const small = document.documentElement.style.zoom;
  applyFontSize('m', false);
  const normal = document.documentElement.style.zoom;
  return { options, big, small, normal, current: document.getElementById('font-select').value };
})()`);
console.log('tamaños:', JSON.stringify(sizes));
assert(sizes.options === 5, 'hay cinco tamaños de texto');
assert(sizes.big === '1.5', 'el tamaño Enorme aplica zoom 1.5');
assert(sizes.small === '0.9', 'el tamaño Pequeño aplica zoom 0.9');
assert(sizes.normal === '1' && sizes.current === 'm', 'el tamaño Normal aplica zoom 1');

await ev("setLang('es'); applyFontSize('l', false); true");
assert(await ev("state.lang === 'es' && document.documentElement.lang === 'es'"),
  'se puede volver al español');

ws.close();
console.log('\nTraducciones correctas.');
