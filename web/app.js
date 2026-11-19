'use strict';

/* ============================================================
   RDR2 · Mapa de progreso
   ============================================================ */

const ICONS = {
  bone: '<path d="M7 7l10 10"/><circle cx="5" cy="5" r="2.2"/><circle cx="9" cy="9" r="2.2"/><circle cx="15" cy="15" r="2.2"/><circle cx="19" cy="19" r="2.2"/>',
  dreamcatcher: '<circle cx="12" cy="11" r="6.5"/><path d="M12 4.5v13M5.5 11h13M7.5 6.5l9 9M16.5 6.5l-9 9"/><path d="M9 20l3 2 3-2"/>',
  carving: '<path d="M12 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0 0c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0 0c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z"/>',
  grave: '<path d="M7 20V11a5 5 0 0 1 10 0v9"/><path d="M10 7.5h4M12 5.5v6"/><path d="M5 20h14"/>',
  orchid: '<circle cx="12" cy="6.5" r="2.6"/><circle cx="6.8" cy="11" r="2.6"/><circle cx="17.2" cy="11" r="2.6"/><circle cx="9" cy="17" r="2.6"/><circle cx="15" cy="17" r="2.6"/><circle cx="12" cy="12" r="1.6"/>',
  egg: '<path d="M12 4c3 0 5.5 4.6 5.5 8.5S15 20 12 20s-5.5-3.6-5.5-7.5S9 4 12 4z"/><path d="M9.5 10l2 2 1.5-1.5 2 2"/>',
  chest: '<path d="M4 10h16v9H4z"/><path d="M3.5 10a8.5 4 0 0 1 17 0"/><path d="M4 13h16M12 12v4"/>',
  crayfish: '<path d="M5 7c3 0 4 2 4 4.5"/><path d="M19 7c-3 0-4 2-4 4.5"/><path d="M8 5l2 2M16 5l-2 2"/><ellipse cx="12" cy="14" rx="3.4" ry="5"/><path d="M10.5 19l-2 2M13.5 19l2 2"/>',
  card: '<rect x="6" y="3.5" width="12" height="17" rx="2"/><path d="M12 8l2.2 3.2L12 14.5 9.8 11.2z"/>',
  hat: '<path d="M3.5 17.5h17"/><path d="M7 17.5c0-4 1.6-7.5 5-7.5s5 3.5 5 7.5"/><path d="M7.5 13h9"/>',
  weapon: '<path d="M4 18l1.5-4.5L16 3l4 4-10.5 10.5z"/><path d="M6 16l2.5 2.5"/>',
  gem: '<path d="M7 4h10l3 5-8 11L4 9z"/><path d="M4 9h16M9 4l3 16 3-16"/>',
  map: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
  treasure: '<path d="M4 11h16v9H4z"/><path d="M3.5 11a8.5 4 0 0 1 17 0"/><path d="M12 11v4"/><path d="M18 3l.7 1.8 1.8.7-1.8.7L18 8l-.7-1.8-1.8-.7 1.8-.7z"/>',
  paw: '<ellipse cx="12" cy="15.5" rx="4.2" ry="3.6"/><circle cx="6.5" cy="9.5" r="1.8"/><circle cx="12" cy="7" r="1.8"/><circle cx="17.5" cy="9.5" r="1.8"/>',
  fish: '<path d="M3 12c3-4 6-6 9-6 3.4 0 6.6 2.4 9 6-2.4 3.6-5.6 6-9 6-3 0-6-2-9-6z"/><path d="M3 12L1.8 8.5v7z"/><circle cx="16.5" cy="10.8" r=".9" fill="#fff" stroke="none"/>',
  leaf: '<path d="M5 19C5 9.5 12 4 20 4c0 8-5.5 15-15 15z"/><path d="M5 19c4-5 8-8 13-11"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/>',
};

/* ---------------- idiomas y tamaño ---------------- */

const LANGS = ['es', 'en'];

const UI = {
  es: {
    pageTitle: 'RDR2 · Mapa de progreso',
    mapTitle: 'Mapa de progreso',
    mapAria: 'Mapa de Red Dead Redemption 2',
    saveLabel: 'Partida',
    searchPlaceholder: 'Buscar marcador…',
    tabAll: 'Todos',
    tabPending: 'Pendientes',
    tabDone: 'Hechos',
    liveOffline: 'En vivo: sin conexión',
    liveOfflineFull: 'En vivo: sin conexión (mod apagado)',
    liveOnline: 'En vivo · hace {n} s',
    follow: 'Seguir al jugador',
    proximity: 'Marcado automático al pasar cerca',
    exportBtn: 'Exportar',
    exportTitle: 'Descargar el progreso de esta partida en JSON',
    importBtn: 'Importar',
    importTitle: 'Importar marcadores hechos desde un JSON',
    hintHtml: 'El progreso se guarda por partida en <code>progress/</code>. ' +
      'Los datos del save (nombre, % y fecha) se leen del propio archivo.',
    toggleShow: 'Mostrar el panel',
    toggleHide: 'Ocultar el panel',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    locate: 'Ir a mi posición',
    attrib: 'Mapa © Rockstar Games · tiles RDR2Map · uso personal',
    loadingMap: 'Cargando mapa…',
    loadingData: 'Cargando datos del mapa…',
    loadingMarkers: 'Cargando marcadores… {a} / {b}',
    preparingMap: 'Preparando el mapa…',
    loadingPlants: 'Cargando {n} puntos de hierbas…',
    reload: 'Recargar',
    retry: 'Reintentar',
    tilesPartial: 'Algunos tiles no se han cargado. Puede ser pasajero: recarga la página.',
    tilesMissing: 'Faltan tiles del mapa ({n} de 9.725). Ejecuta tools/fetch_tiles.py para descargarlos.',
    serverDown: 'No se puede contactar con el servidor local. Comprueba que la ventana de Start.bat sigue abierta.',
    noTiles: 'No se encontraron tiles del mapa. Ejecuta tools/fetch_tiles.py (o vuelve a abrir Start.bat).',
    noMarkers: 'No hay marcadores. Ejecuta tools/build_markers.py para generarlos.',
    loadError: 'Error al cargar: {msg}',
    groupToggle: 'Mostrar u ocultar el grupo',
    minZoom: 'Visible a partir del zoom {n}',
    markDone: 'Marcar como hecho',
    undo: 'Deshacer',
    center: 'Centrar',
    progressLoadError: 'No se pudo cargar el progreso de esta partida',
    progressSaveError: 'No se pudo guardar el progreso',
    importBadFormat: 'formato no reconocido',
    importNoValid: 'no hay marcadores válidos en el archivo',
    importError: 'No se pudo importar: {msg}',
    imported: 'Importados {n} marcadores en {save}',
    noSaves: 'Sin partidas detectadas (progreso genérico)',
    genericProgress: 'Progreso genérico (sin save asociado)',
    saveMeta: '{percent} completado · guardada {date}',
    saveLoaded: 'Cargada la partida {save}',
    noResults: 'Sin resultados',
    noSignal: 'Sin señal del mod de posición todavía',
    autoMarked: 'Marcado automáticamente: {name}',
    langLabel: 'Idioma',
    fontLabel: 'Tamaño del texto',
    sizeSmall: 'Pequeño',
    sizeNormal: 'Normal',
    sizeLarge: 'Grande',
    sizeXLarge: 'Muy grande',
    sizeHuge: 'Enorme',
  },
  en: {
    pageTitle: 'RDR2 · Progress Map',
    mapTitle: 'Progress Map',
    mapAria: 'Red Dead Redemption 2 map',
    saveLabel: 'Save',
    searchPlaceholder: 'Search markers…',
    tabAll: 'All',
    tabPending: 'Pending',
    tabDone: 'Done',
    liveOffline: 'Live: offline',
    liveOfflineFull: 'Live: offline (mod is off)',
    liveOnline: 'Live · {n} s ago',
    follow: 'Follow the player',
    proximity: 'Auto-mark when nearby',
    exportBtn: 'Export',
    exportTitle: 'Download the progress for this save as JSON',
    importBtn: 'Import',
    importTitle: 'Import completed markers from a JSON file',
    hintHtml: 'Progress is stored per save in <code>progress/</code>. ' +
      'Save details (name, % and date) are read from the save file itself.',
    toggleShow: 'Show the panel',
    toggleHide: 'Hide the panel',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    locate: 'Go to my position',
    attrib: 'Map © Rockstar Games · RDR2Map tiles · personal use',
    loadingMap: 'Loading map…',
    loadingData: 'Loading map data…',
    loadingMarkers: 'Loading markers… {a} / {b}',
    preparingMap: 'Preparing the map…',
    loadingPlants: 'Loading {n} herb points…',
    reload: 'Reload',
    retry: 'Retry',
    tilesPartial: 'Some tiles failed to load. This may be temporary: reload the page.',
    tilesMissing: 'Map tiles are missing ({n} of 9,725). Run tools/fetch_tiles.py to download them.',
    serverDown: 'Cannot reach the local server. Check that the Start.bat window is still open.',
    noTiles: 'No map tiles were found. Run tools/fetch_tiles.py (or reopen Start.bat).',
    noMarkers: 'There are no markers. Run tools/build_markers.py to generate them.',
    loadError: 'Failed to load: {msg}',
    groupToggle: 'Show or hide the group',
    minZoom: 'Visible from zoom {n}',
    markDone: 'Mark as done',
    undo: 'Undo',
    center: 'Center',
    progressLoadError: "Couldn't load this save's progress",
    progressSaveError: "Couldn't save progress",
    importBadFormat: 'unrecognized format',
    importNoValid: 'no valid markers in the file',
    importError: "Couldn't import: {msg}",
    imported: 'Imported {n} markers into {save}',
    noSaves: 'No saves detected (generic progress)',
    genericProgress: 'Generic progress (no save associated)',
    saveMeta: '{percent} complete · saved {date}',
    saveLoaded: 'Loaded save {save}',
    noResults: 'No results',
    noSignal: 'No position mod signal yet',
    autoMarked: 'Marked automatically: {name}',
    langLabel: 'Language',
    fontLabel: 'Text size',
    sizeSmall: 'Small',
    sizeNormal: 'Normal',
    sizeLarge: 'Large',
    sizeXLarge: 'Very large',
    sizeHuge: 'Huge',
  },
};

const FONT_SIZES = {
  s: { zoom: 0.9, label: 'sizeSmall' },
  m: { zoom: 1, label: 'sizeNormal' },
  l: { zoom: 1.15, label: 'sizeLarge' },
  xl: { zoom: 1.3, label: 'sizeXLarge' },
  xxl: { zoom: 1.5, label: 'sizeHuge' },
};

function t(key, vars) {
  const table = UI[state.lang] || UI.es;
  let text = table[key] != null ? table[key] : (UI.es[key] != null ? UI.es[key] : key);
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (m, name) =>
      (vars[name] == null ? m : String(vars[name])));
  }
  return text;
}

const LS = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignora */ }
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  lang: 'es',
  fontSize: 'l',
  en: null,
  cats: {},
  groups: [],
  markers: [],
  markerIds: new Set(),
  images: {},
  tracked: [],
  byId: new Map(),
  layers: {},
  done: new Set(),
  hidden: new Set(),
  mode: 'all',
  save: null,
  saves: [],
  map: null,
  tileErrors: 0,
  tileRedraws: 0,
  plantRenderer: null,
  live: null,
  liveMarker: null,
  liveAngle: null,
  follow: false,
  proximity: false,
  saveTimer: null,
  searchTimer: null,
  toastTimer: null,
  loaded: false,
  plantsBuilt: false,
  plantsPromise: null,
};

/* ---------------- utilidades ---------------- */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function fmtNum(n) {
  try { return new Intl.NumberFormat(state.lang === 'en' ? 'en-US' : 'es-ES').format(n); }
  catch (e) { return String(n); }
}

function fmtPercent(n) {
  if (n == null) return '—';
  const text = n.toFixed(1);
  return (state.lang === 'en' ? text : text.replace('.', ',')) + '%';
}

function pct(a, b) {
  if (!b) return 0;
  const v = (a * 100) / b;
  if (v > 0 && v < 1) return Math.round(v * 10) / 10;
  return Math.round(v);
}

function pctText(a, b) {
  const text = String(pct(a, b));
  return state.lang === 'en' ? text : text.replace('.', ',');
}

/* ---------------- textos traducidos ---------------- */

function groupLabel(group) {
  if (state.lang === 'en' && state.en && state.en.groups[group]) {
    return state.en.groups[group];
  }
  return group;
}

function catLabel(cat) {
  const meta = state.cats[cat];
  if (state.lang === 'en' && state.en && state.en.categories[cat]) {
    return state.en.categories[cat].label;
  }
  return meta ? meta.label : cat;
}

function markerName(m) {
  if (state.lang === 'en' && state.en) {
    const name = state.en.names[m.id];
    if (name) return name;
    if (m.nameEn) return m.nameEn;
  }
  return m.name;
}

function markerNote(m) {
  if (!m.note) return '';
  if (state.lang === 'en' && state.en) {
    return state.en.notes[m.id] || m.noteEn || m.note;
  }
  return m.note;
}

// Nombre en el otro idioma, para la segunda línea del popup.
function markerAltName(m) {
  const primary = markerName(m);
  const other = state.lang === 'en' ? m.name : (m.nameEn || '');
  return other && other !== primary ? other : '';
}

function applyStaticI18n() {
  const lang = state.lang;
  document.documentElement.lang = lang;
  document.title = t('pageTitle');
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

  const map = $('#map');
  if (map) map.setAttribute('aria-label', t('mapAria'));

  $$('#lang-switch button').forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const fontSel = $('#font-select');
  if (fontSel) {
    Array.from(fontSel.options).forEach((opt) => {
      const conf = FONT_SIZES[opt.value];
      if (conf) opt.textContent = t(conf.label);
    });
  }
}

function applyFontSize(id, save) {
  const key = FONT_SIZES[id] ? id : 'l';
  state.fontSize = key;
  document.documentElement.style.zoom = String(FONT_SIZES[key].zoom);
  if (save) LS.set('rdr2map.fontSize', key);
  const sel = $('#font-select');
  if (sel) sel.value = key;
  if (state.map) {
    state.map.closePopup();
    setTimeout(() => {
      if (state.map) state.map.invalidateSize({ animate: false });
    }, 80);
  }
}

function refreshTooltips() {
  for (const rec of state.byId.values()) {
    if (rec.isDot) continue;
    const tip = rec.layer.getTooltip && rec.layer.getTooltip();
    if (tip) tip.setContent(esc(markerName(rec.m)));
  }
}

function setLang(next) {
  if (!LANGS.includes(next) || next === state.lang) return;
  state.lang = next;
  LS.set('rdr2map.lang', next);
  applyStaticI18n();
  if (state.cats && Object.keys(state.cats).length) {
    buildSidebar();
    renderSaves();
    updateCounts();
    updateSaveMeta();
    refreshTooltips();
    const query = $('#search-input') ? $('#search-input').value : '';
    if (query.trim().length >= 2) runSearch(query);
    if (state.map) state.map.closePopup();
    updateLive(state.lastLive || { online: false });
  }
}

function svgIcon(name) {
  return '<svg viewBox="0 0 24 24">' + (ICONS[name] || ICONS.star) + '</svg>';
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function setLoading(text) {
  const box = $('#loading');
  if (!box) return;
  if (text === null) { box.classList.add('hidden'); return; }
  $('#loading-text').textContent = text;
  box.classList.remove('hidden');
}

function banner(message, actionText, action) {
  let box = $('#banner');
  if (!box) {
    box = document.createElement('div');
    box.id = 'banner';
    document.body.appendChild(box);
  }
  box.innerHTML = '';
  const text = document.createElement('span');
  text.textContent = message;
  box.appendChild(text);
  if (actionText && action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = actionText;
    btn.addEventListener('click', action);
    box.appendChild(btn);
  }
}

// Comprueba en el servidor si de verdad faltan tiles antes de avisar.
async function verifyTiles() {
  try {
    const st = await getJSON('/api/status');
    if (st.tiles >= 9000) {
      banner(t('tilesPartial'), t('reload'), () => location.reload());
    } else {
      banner(t('tilesMissing', { n: st.tiles }), t('retry'), () => location.reload());
    }
  } catch (err) {
    banner(t('serverDown'), t('reload'), () => location.reload());
  }
}

function frame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(url + ' → HTTP ' + res.status);
  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(url + ' → HTTP ' + res.status);
  return res.json();
}

/* ---------------- arranque ---------------- */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  state.lang = LS.get('rdr2map.lang', 'es');
  if (!LANGS.includes(state.lang)) state.lang = 'es';
  state.fontSize = LS.get('rdr2map.fontSize', 'l');
  if (!FONT_SIZES[state.fontSize]) state.fontSize = 'l';
  applyFontSize(state.fontSize, false);

  state.mode = LS.get('rdr2map.mode', 'all');
  state.hidden = new Set(LS.get('rdr2map.hidden', []));
  state.follow = !!LS.get('rdr2map.follow', false);
  state.proximity = !!LS.get('rdr2map.proximity', false);

  const closed = !!LS.get('rdr2map.sideClosed', window.innerWidth < 820);
  document.body.classList.toggle('side-closed', closed);
  updateSidebarToggle();

  bindUI();
  applyStaticI18n();
  setLoading(t('loadingData'));

  try {
    const [catData, markerData, savesData, cfgData, status, imagesData, enData] = await Promise.all([
      getJSON('/data/categories.json'),
      getJSON('/data/markers.json'),
      getJSON('/api/saves'),
      getJSON('/api/config'),
      getJSON('/api/status').catch(() => ({ tiles: 0 })),
      getJSON('/data/images.json').catch(() => ({ images: {} })),
      getJSON('/data/i18n_en.json').catch(() => null),
    ]);

    state.en = enData && enData.names ? enData : null;
    state.cats = catData.categories || {};
    state.groups = catData.groups || [];
    state.markers = markerData.markers || [];
    state.images = imagesData.images || {};
    state.markerIds = new Set(state.markers.map((m) => m.id));
    state.tracked = state.markers.filter((m) => state.cats[m.cat] && state.cats[m.cat].track);
    state.saves = savesData.saves || [];

    const cfg = cfgData.config || {};
    let slot = cfg.activeSave;
    if (slot && !state.saves.some((s) => s.slot === slot)) slot = null;
    if (!slot && state.saves.length) slot = state.saves[0].slot;
    if (!slot) slot = 'default';
    state.save = slot;

    initMap();
    buildSidebar();
    renderSaves();
    await loadProgress();
    await buildMarkers();
    updateCounts();
    applyFilters();
    state.loaded = true;
    setLoading(null);
    pollLive();

    if (!status.tiles) {
      banner(t('noTiles'));
    } else if (!state.markers.length) {
      banner(t('noMarkers'));
    }
  } catch (err) {
    console.error(err);
    setLoading(t('loadError', { msg: err.message }));
  }
}

/* ---------------- mapa ---------------- */

function initMap() {
  const bounds = L.latLngBounds(L.latLng(-144, 0), L.latLng(0, 176));
  const view = LS.get('rdr2map.view', null);

  state.map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: 2,
    maxZoom: 7,
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
    zoomSnap: 1,
    wheelPxPerZoomLevel: 110,
    maxBounds: bounds.pad(0.05),
    maxBoundsViscosity: 0.9,
    closePopupOnClick: false,
  });

  if (view && Array.isArray(view.center) && view.center.length === 2) {
    state.map.setView(view.center, view.zoom || 3, { animate: false });
  } else {
    state.map.setView([-72, 88], 3, { animate: false });
  }

  const tiles = L.tileLayer('/tiles/' + (LS.get('rdr2map.style', 'detailed')) +
    '/{z}/{x}_{y}.webp', {
    noWrap: true,
    bounds: bounds,
    tileSize: 256,
    minZoom: 2,
    maxZoom: 7,
    keepBuffer: 3,
  });
  tiles.on('tileerror', () => {
    state.tileErrors += 1;
    // Primer aviso: puede ser un fallo pasajero (servidor ocupado, pestaña en
    // segundo plano). Se fuerza una recarga completa de los tiles una vez.
    if (state.tileErrors >= 8 && state.tileRedraws < 1) {
      state.tileRedraws += 1;
      state.tileErrors = 0;
      setTimeout(() => { tiles.redraw(); }, 800);
      return;
    }
    // Si sigue fallando tras el reintento, se consulta al servidor.
    if (state.tileErrors >= 24) {
      state.tileErrors = 0;
      verifyTiles();
    }
  });
  tiles.addTo(state.map);
  tiles.addTo(state.map);

  state.plantRenderer = L.canvas({ padding: 0.5 });

  state.map.on('moveend', () => {
    const c = state.map.getCenter();
    LS.set('rdr2map.view', { center: [c.lat, c.lng], zoom: state.map.getZoom() });
  });
  state.map.on('zoomend', () => { if (state.loaded) applyFilters(); });
}

/* ---------------- panel lateral ---------------- */

function buildSidebar() {
  const wrap = $('#groups');
  wrap.innerHTML = '';

  for (const group of state.groups) {
    const entries = Object.entries(state.cats).filter(([, meta]) => meta.group === group);
    if (!entries.length) continue;

    const section = document.createElement('section');
    section.dataset.group = group;

    const head = document.createElement('div');
    head.className = 'group-head';
    head.innerHTML = '<span>' + esc(groupLabel(group)) + '</span>' +
      '<span class="gp" data-gp="' + esc(group) + '">—</span>' +
      '<button type="button" data-group-toggle="' + esc(group) +
      '" title="' + esc(t('groupToggle')) + '">◉</button>';
    section.appendChild(head);

    for (const [key, meta] of entries) {
      const hidden = state.hidden.has(key);
      const label = document.createElement('label');
      label.className = 'cat' + (hidden ? ' off' : '');
      label.dataset.cat = key;
      label.style.setProperty('--c', meta.color || '#999');
      label.title = (meta.minZoom && meta.minZoom > 2)
        ? t('minZoom', { n: meta.minZoom })
        : '';
      label.innerHTML =
        '<input type="checkbox" ' + (hidden ? '' : 'checked') + '>' +
        '<span class="cat-ic">' + svgIcon(meta.icon) + '</span>' +
        '<span class="cat-name">' + esc(catLabel(key)) + '</span>' +
        '<span class="cat-cnt" data-cnt="' + esc(key) + '">0/' +
        fmtNum(meta.count || 0) + '</span>' +
        '<span class="cat-bar"><i data-bar="' + esc(key) + '"></i></span>';
      section.appendChild(label);
    }
    wrap.appendChild(section);
  }

  $$('#groups .cat input').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.closest('.cat').dataset.cat;
      if (input.checked) state.hidden.delete(key);
      else state.hidden.add(key);
      input.closest('.cat').classList.toggle('off', !input.checked);
      LS.set('rdr2map.hidden', Array.from(state.hidden));
      applyFilters();
    });
  });

  $$('#groups [data-group-toggle]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const group = btn.dataset.groupToggle;
      const keys = Object.entries(state.cats)
        .filter(([, meta]) => meta.group === group).map(([key]) => key);
      const allVisible = keys.every((key) => !state.hidden.has(key));
      keys.forEach((key) => {
        if (allVisible) state.hidden.add(key);
        else state.hidden.delete(key);
        const row = $('.cat[data-cat="' + CSS.escape(key) + '"]');
        if (row) {
          row.classList.toggle('off', allVisible);
          const cb = row.querySelector('input');
          if (cb) cb.checked = !allVisible;
        }
      });
      LS.set('rdr2map.hidden', Array.from(state.hidden));
      applyFilters();
      updateCounts();
    });
  });
}

function updateCounts() {
  const totals = {};
  const dones = {};
  for (const m of state.markers) {
    totals[m.cat] = (totals[m.cat] || 0) + 1;
    if (state.done.has(m.id)) dones[m.cat] = (dones[m.cat] || 0) + 1;
  }

  for (const key of Object.keys(state.cats)) {
    const total = totals[key] || 0;
    const done = dones[key] || 0;
    const cnt = $('[data-cnt="' + CSS.escape(key) + '"]');
    if (cnt) cnt.textContent = fmtNum(done) + '/' + fmtNum(total);
    const bar = $('[data-bar="' + CSS.escape(key) + '"]');
    if (bar) bar.style.width = pct(done, total) + '%';
  }

  for (const group of state.groups) {
    let total = 0;
    let done = 0;
    for (const [key, meta] of Object.entries(state.cats)) {
      if (meta.group !== group) continue;
      total += totals[key] || 0;
      done += dones[key] || 0;
    }
    const gp = $('[data-gp="' + CSS.escape(group) + '"]');
    if (gp) gp.textContent = fmtNum(done) + '/' + fmtNum(total);
  }

  let trackedTotal = 0;
  let trackedDone = 0;
  for (const [key, meta] of Object.entries(state.cats)) {
    if (!meta.track) continue;
    trackedTotal += totals[key] || 0;
    trackedDone += dones[key] || 0;
  }
  const overall = $('#overall-bar');
  if (overall) overall.style.width = pct(trackedDone, trackedTotal) + '%';
  const overallText = $('#overall-text');
  if (overallText) {
    overallText.textContent = fmtNum(trackedDone) + ' / ' + fmtNum(trackedTotal) +
      ' · ' + pctText(trackedDone, trackedTotal) + '%';
  }
}

/* ---------------- marcadores ---------------- */

function makeIcon(cat, done) {
  const meta = state.cats[cat] || { color: '#999', icon: 'star' };
  return L.divIcon({
    className: 'mk-wrap',
    html: '<div class="mk' + (done ? ' done' : '') + '" style="--c:' +
      (meta.color || '#999') + '"><span class="mk-body">' +
      svgIcon(meta.icon) + '</span></div>',
    iconSize: [28, 34],
    iconAnchor: [14, 32],
    popupAnchor: [0, -30],
  });
}

function popupHtml(m) {
  const meta = state.cats[m.cat] || { color: '#888', label: m.cat };
  const done = state.done.has(m.id);
  const img = state.images[m.id];
  const alt = markerAltName(m);
  const note = markerNote(m);
  return (img ? '<img class="pop-img" src="' + esc(img) +
      '" alt="" loading="lazy">' : '') +
    '<div class="pop-cat" style="--c:' + meta.color + '"><span class="dot"></span>' +
    esc(catLabel(m.cat)) + '</div>' +
    '<div class="pop-name">' + esc(markerName(m)) + '</div>' +
    (alt ? '<div class="pop-name-en">' + esc(alt) + '</div>' : '') +
    (note ? '<div class="pop-note">' + esc(note) + '</div>' : '') +
    '<div class="pop-meta">' + m.lat.toFixed(3) + ' · ' + m.lng.toFixed(3) + '</div>' +
    '<div class="pop-actions">' +
    '<button type="button" class="' + (done ? 'undo' : 'done') +
    '" data-act="toggle" data-id="' + esc(m.id) + '">' +
    (done ? t('undo') : t('markDone')) + '</button>' +
    '<button type="button" data-act="focus" data-id="' + esc(m.id) + '">' +
    t('center') + '</button>' +
    '</div>';
}

function makeMarker(m) {
  const meta = state.cats[m.cat] || { color: '#999', track: false };
  const isDot = m.cat === 'plants';
  const done = state.done.has(m.id);
  let layer;

  if (isDot) {
    layer = L.circleMarker([m.lat, m.lng], {
      radius: 3.2,
      stroke: true,
      color: done ? '#3a4238' : '#24361f',
      weight: 1,
      fillColor: done ? '#4b5546' : meta.color,
      fillOpacity: done ? 0.35 : 0.9,
      renderer: state.plantRenderer,
    });
  } else {
    layer = L.marker([m.lat, m.lng], {
      icon: makeIcon(m.cat, done),
      riseOnHover: true,
      riseOffset: 250,
      keyboard: false,
    });
  }

  layer.bindPopup(() => popupHtml(m), {
    maxWidth: 330,
    minWidth: state.images[m.id] ? 288 : 210,
    closeOnClick: false,
    autoPan: true,
  });

  if (!isDot) {
    layer.bindTooltip(esc(markerName(m)), {
      direction: 'top',
      offset: [0, -28],
      opacity: 0.95,
      className: 'mk-tip',
    });
  }

  return { m, layer, isDot, meta, appliedDone: done };
}

async function buildMarkers() {
  const plantQueue = state.markers.filter((m) => m.cat === 'plants');
  const total = state.markers.length - plantQueue.length;
  let made = 0;

  for (const key of Object.keys(state.cats)) state.layers[key] = L.layerGroup();

  for (const m of state.markers) {
    if (m.cat === 'plants') continue;
    const group = state.layers[m.cat];
    if (!group) continue;
    const rec = makeMarker(m);
    state.byId.set(m.id, rec);
    group.addLayer(rec.layer);
    made += 1;
    if (made % 150 === 0) {
      setLoading(t('loadingMarkers', { a: fmtNum(made), b: fmtNum(total) }));
      await frame();
    }
  }

  for (const key of Object.keys(state.layers)) {
    if (state.layers[key].getLayers().length) state.map.addLayer(state.layers[key]);
  }
  setLoading(t('preparingMap'));
  await frame();

  if (plantQueue.length) {
    // Las hierbas (6.290 puntos) se crean solo cuando la capa se hace visible.
    state.plantQueue = plantQueue;
  }
}

async function ensurePlantsBuilt() {
  if (state.plantsBuilt) return;
  if (state.plantsPromise) return state.plantsPromise;

  state.plantsPromise = (async () => {
    const queue = state.plantQueue || [];
    if (!queue.length) { state.plantsBuilt = true; return; }
    toast(t('loadingPlants', { n: fmtNum(queue.length) }));
    const group = state.layers.plants;
    let made = 0;
    for (const m of queue) {
      if (state.byId.has(m.id)) continue;
      const rec = makeMarker(m);
      state.byId.set(m.id, rec);
      group.addLayer(rec.layer);
      made += 1;
      if (made % 900 === 0) await frame();
    }
    state.plantsBuilt = true;
    applyFilters();
  })();

  return state.plantsPromise;
}

function refreshMarker(rec) {
  const meta = state.cats[rec.m.cat] || { color: '#999' };
  const done = state.done.has(rec.m.id);
  if (rec.appliedDone === done) return;
  rec.appliedDone = done;
  if (rec.isDot) {
    rec.layer.setStyle({
      fillColor: done ? '#4b5546' : meta.color,
      color: done ? '#3a4238' : '#24361f',
      fillOpacity: done ? 0.35 : 0.9,
    });
  } else {
    rec.layer.setIcon(makeIcon(rec.m.cat, done));
  }
}

function refreshAllMarkers() {
  for (const rec of state.byId.values()) refreshMarker(rec);
  applyFilters();
}

function applyFilters() {
  if (!state.map) return;
  const zoom = state.map.getZoom();

  for (const [key, meta] of Object.entries(state.cats)) {
    const group = state.layers[key];
    if (!group) continue;
    const visible = !state.hidden.has(key) && zoom >= (meta.minZoom || 2);
    if (visible && !state.map.hasLayer(group)) state.map.addLayer(group);
    if (!visible && state.map.hasLayer(group)) state.map.removeLayer(group);
  }

  for (const rec of state.byId.values()) {
    const group = state.layers[rec.m.cat];
    if (!group) continue;
    const isDone = state.done.has(rec.m.id);
    const allowed = state.mode === 'all' ||
      (state.mode === 'done' ? isDone : !isDone);
    if (allowed) {
      if (!group.hasLayer(rec.layer)) group.addLayer(rec.layer);
    } else if (group.hasLayer(rec.layer)) {
      group.removeLayer(rec.layer);
    }
  }

  const plants = state.cats.plants;
  if (plants && !state.plantsBuilt && !state.hidden.has('plants') &&
      zoom >= (plants.minZoom || 2)) {
    ensurePlantsBuilt().catch((err) => console.error(err));
  }
}

function ensureMarker(id) {
  const existing = state.byId.get(id);
  if (existing) return existing;
  const m = state.markers.find((item) => item.id === id);
  if (!m) return null;
  const rec = makeMarker(m);
  state.byId.set(m.id, rec);
  const group = state.layers[m.cat];
  if (group) group.addLayer(rec.layer);
  return rec;
}

function toggleDone(id) {
  if (!state.markerIds.has(id)) return;
  const rec = ensureMarker(id);
  const marker = rec ? rec.m : state.markers.find((m) => m.id === id);
  if (!marker) return;

  if (state.done.has(id)) state.done.delete(id);
  else state.done.add(id);

  if (rec) refreshMarker(rec);
  applyFilters();
  updateCounts();
  scheduleSave();
}

/* ---------------- progreso ---------------- */

async function loadProgress() {
  try {
    const data = await getJSON('/api/progress?save=' + encodeURIComponent(state.save));
    const ids = Object.keys(data.done || {}).filter((id) => state.markerIds.has(id));
    state.done = new Set(ids);
  } catch (err) {
    console.error(err);
    state.done = new Set();
    toast(t('progressLoadError'));
  }
}

function exportProgress() {
  const payload = {
    format: 'rdr2map-progress',
    version: 1,
    slot: state.save,
    exported: new Date().toISOString(),
    done: Array.from(state.done),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)],
                        { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rdr2map-' + state.save + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
}

async function importProgress(file) {
  try {
    const raw = JSON.parse(await file.text());
    let ids = null;
    if (Array.isArray(raw)) ids = raw;
    else if (Array.isArray(raw.done)) ids = raw.done;
    else if (raw.done && typeof raw.done === 'object') ids = Object.keys(raw.done);
    if (!ids) throw new Error(t('importBadFormat'));

    const valid = ids.filter((id) => state.markerIds.has(id));
    if (!valid.length) throw new Error(t('importNoValid'));

    const existing = await getJSON('/api/progress?save=' +
                                   encodeURIComponent(state.save));
    const merged = Object.assign({}, existing.done || {});
    const now = Date.now();
    for (const id of valid) if (!merged[id]) merged[id] = now;

    await postJSON('/api/progress?save=' + encodeURIComponent(state.save),
                   { done: merged, notes: existing.notes || {} });

    state.done = new Set(Object.keys(merged));
    refreshAllMarkers();
    updateCounts();
    toast(t('imported', { n: fmtNum(valid.length), save: state.save }));
  } catch (err) {
    toast(t('importError', { msg: err.message }));
  } finally {
    const input = $('#import-file');
    if (input) input.value = '';
  }
}

function scheduleSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveProgress, 450);
}

async function saveProgress() {
  state.saveTimer = null;
  const done = {};
  for (const id of state.done) done[id] = 1;
  try {
    await postJSON('/api/progress?save=' + encodeURIComponent(state.save), { done });
  } catch (err) {
    console.error(err);
    toast(t('progressSaveError'));
  }
}

async function flushSave() {
  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
    await saveProgress();
  }
}

/* ---------------- partidas ---------------- */

function renderSaves() {
  const sel = $('#save-select');
  sel.innerHTML = '';

  if (!state.saves.length) {
    const opt = document.createElement('option');
    opt.value = 'default';
    opt.textContent = t('noSaves');
    sel.appendChild(opt);
    state.save = 'default';
  } else {
    for (const s of state.saves) {
      const opt = document.createElement('option');
      opt.value = s.slot;
      const percent = fmtPercent(s.percent);
      opt.textContent = (s.isAutosave ? 'AUTO · ' : '') + s.file + ' · ' +
        s.name + ' · ' + percent + ' · ' + (s.dateText || s.date);
      sel.appendChild(opt);
    }
    if (!state.saves.some((s) => s.slot === state.save)) {
      state.save = state.saves[0].slot;
    }
    sel.value = state.save;
  }
  updateSaveMeta();
}

function updateSaveMeta() {
  const meta = $('#save-meta');
  const save = state.saves.find((s) => s.slot === state.save);
  if (!save) {
    meta.textContent = t('genericProgress');
    return;
  }
  const percent = fmtPercent(save.percent);
  meta.textContent = t('saveMeta', { percent, date: save.mtimeText });
}

async function switchSave(slot) {
  if (slot === state.save) return;
  await flushSave();
  state.save = slot;
  LS.set('rdr2map.save', slot);
  try { await postJSON('/api/config', { activeSave: slot }); }
  catch (err) { console.error(err); }
  await loadProgress();
  refreshAllMarkers();
  updateCounts();
  updateSaveMeta();
  toast(t('saveLoaded', { save: slot }));
}

/* ---------------- búsqueda ---------------- */

function runSearch(query) {
  const box = $('#search-results');
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  const hits = [];
  for (const m of state.markers) {
    const hay = (m.name + ' ' + (m.nameEn || '') + ' ' + (state.en ? (state.en.names[m.id] || '') : '') +
      ' ' + (m.sub || '') + ' ' + (m.note || '') + ' ' +
      (m.noteEn || '')).toLowerCase();
    if (hay.includes(q)) {
      hits.push(m);
      if (hits.length >= 40) break;
    }
  }
  if (!hits.length) {
    box.innerHTML = '<div class="sr-empty">' + esc(t('noResults')) + '</div>';
    box.classList.remove('hidden');
    return;
  }
  box.innerHTML = hits.slice(0, 12).map((m) => {
    const meta = state.cats[m.cat] || { color: '#888', label: '' };
    return '<div class="sr" data-id="' + esc(m.id) + '" style="--c:' +
      meta.color + '"><span class="dot"></span><span class="nm">' +
      esc(markerName(m)) + '</span><span class="ct">' + esc(catLabel(m.cat)) +
      '</span></div>';
  }).join('');
  box.classList.remove('hidden');
}

function focusMarker(id, openPopup) {
  const rec = ensureMarker(id);
  if (!rec) return;
  const m = rec.m;

  if (state.hidden.has(m.cat)) {
    state.hidden.delete(m.cat);
    LS.set('rdr2map.hidden', Array.from(state.hidden));
    const row = $('.cat[data-cat="' + CSS.escape(m.cat) + '"]');
    if (row) {
      row.classList.remove('off');
      const cb = row.querySelector('input');
      if (cb) cb.checked = true;
    }
  }

  if (state.mode !== 'all') {
    const isDone = state.done.has(m.id);
    if ((state.mode === 'done' && !isDone) || (state.mode === 'pending' && isDone)) {
      setMode('all');
    }
  }

  applyFilters();
  state.map.setView([m.lat, m.lng], Math.max(state.map.getZoom(), 5));
  if (openPopup !== false) {
    setTimeout(() => { try { rec.layer.openPopup(); } catch (e) { /* ignora */ } }, 60);
  }
}

/* ---------------- interfaz ---------------- */

function setMode(mode) {
  state.mode = mode;
  LS.set('rdr2map.mode', mode);
  $$('.tabs button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  applyFilters();
}

function updateSidebarToggle() {
  const closed = document.body.classList.contains('side-closed');
  const btn = $('#sidebar-toggle');
  if (btn) {
    btn.textContent = closed ? '»' : '«';
    btn.title = closed ? t('toggleShow') : t('toggleHide');
  }
}

// En móvil la barra superior se pliega en varias filas: el panel lateral debe
// empezar justo debajo de su altura real, no de un valor fijo.
function syncTopbarHeight() {
  const bar = $('#topbar');
  if (!bar) return;
  const height = bar.offsetHeight + 'px';
  const root = document.documentElement;
  if (root.style.getPropertyValue('--top') !== height) {
    root.style.setProperty('--top', height);
  }
}

function bindUI() {
  const fontSel = $('#font-select');
  if (fontSel) {
    fontSel.innerHTML = Object.keys(FONT_SIZES).map((key) =>
      '<option value="' + key + '">' + esc(t(FONT_SIZES[key].label)) +
      '</option>').join('');
    fontSel.value = state.fontSize;
    fontSel.addEventListener('change', () => applyFontSize(fontSel.value, true));
  }

  $$('#lang-switch button').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  $('#sidebar-toggle').addEventListener('click', () => {
    document.body.classList.toggle('side-closed');
    LS.set('rdr2map.sideClosed', document.body.classList.contains('side-closed'));
    updateSidebarToggle();
  });

  $$('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  $('#zoom-in').addEventListener('click', () => state.map && state.map.zoomIn());
  $('#zoom-out').addEventListener('click', () => state.map && state.map.zoomOut());

  $('#locate').addEventListener('click', () => {
    if (!state.live) { toast(t('noSignal')); return; }
    state.map.setView([state.live.lat, state.live.lng], Math.max(state.map.getZoom(), 5));
  });

  $('#save-select').addEventListener('change', (ev) => switchSave(ev.target.value));

  $('#export-progress').addEventListener('click', exportProgress);
  $('#import-progress').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) importProgress(file);
  });

  $('#search-input').addEventListener('input', (ev) => {
    clearTimeout(state.searchTimer);
    const value = ev.target.value;
    state.searchTimer = setTimeout(() => runSearch(value), 130);
  });

  $('#search-input').addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.target.value = '';
      $('#search-results').classList.add('hidden');
      ev.target.blur();
    }
  });

  $('#search-input').addEventListener('blur', () => {
    setTimeout(() => $('#search-results').classList.add('hidden'), 160);
  });

  $('#search-results').addEventListener('mousedown', (ev) => {
    const row = ev.target.closest('.sr');
    if (!row) return;
    ev.preventDefault();
    focusMarker(row.dataset.id, true);
    $('#search-results').classList.add('hidden');
  });

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.pop-actions button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.dataset.act === 'toggle') {
      toggleDone(id);
      const done = state.done.has(id);
      btn.className = done ? 'undo' : 'done';
      btn.textContent = done ? t('undo') : t('markDone');
    } else if (btn.dataset.act === 'focus') {
      const rec = state.byId.get(id);
      if (rec) state.map.setView([rec.m.lat, rec.m.lng], Math.max(state.map.getZoom(), 5));
    }
  });

  const follow = $('#follow');
  const proximity = $('#proximity');
  follow.checked = state.follow;
  proximity.checked = state.proximity;

  follow.addEventListener('change', () => {
    state.follow = follow.checked;
    LS.set('rdr2map.follow', state.follow);
    postJSON('/api/config', { prefs: { follow: state.follow } }).catch(() => {});
  });

  proximity.addEventListener('change', () => {
    state.proximity = proximity.checked;
    LS.set('rdr2map.proximity', state.proximity);
    postJSON('/api/config', { prefs: { proximity: state.proximity } }).catch(() => {});
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      $('#search-results').classList.add('hidden');
    }
  });

  const topbar = $('#topbar');
  if (topbar) {
    if (window.ResizeObserver) {
      new ResizeObserver(syncTopbarHeight).observe(topbar);
    }
    syncTopbarHeight();
  }
  window.addEventListener('resize', syncTopbarHeight);
}

/* ---------------- posición en vivo ---------------- */

async function pollLive() {
  try {
    const data = await getJSON('/api/live');
    updateLive(data);
  } catch (err) {
    updateLive({ online: false });
  }
  setTimeout(pollLive, 1000);
}

function updateLive(data) {
  state.lastLive = data;
  const online = !!data.online;
  const badge = $('#live-badge');
  if (badge) {
    badge.classList.toggle('on', online);
    badge.classList.toggle('off', !online);
  }
  const text = $('#live-text');
  if (text) {
    text.textContent = online
      ? t('liveOnline', { n: Math.round(data.age || 0) })
      : t('liveOfflineFull');
  }
  const locate = $('#locate');
  if (locate) locate.classList.toggle('on', online);

  if (!online) {
    if (state.liveMarker) {
      state.map.removeLayer(state.liveMarker);
      state.liveMarker = null;
    }
    state.live = null;
    state.liveAngle = null;
    return;
  }

  state.live = { lat: data.lat, lng: data.lng, heading: data.heading || 0 };

  if (!state.liveMarker) {
    state.liveMarker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({
        className: 'mk-wrap',
        html: '<div class="player"><svg viewBox="0 0 24 24">' +
          '<path d="M12 2l6.5 19-6.5-4.4L5.5 21z" fill="#e4c76a" ' +
          'stroke="#17120b" stroke-width="1.2" stroke-linejoin="round"/></svg></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(state.map);
  } else {
    state.liveMarker.setLatLng([data.lat, data.lng]);
  }

  // RDR2 mide el rumbo en sentido antihorario (0 = norte, 90 = oeste,
  // 180 = sur, 270 = este), mientras que CSS gira en sentido horario:
  // hay que invertir el signo. Además se elige el giro más corto para que
  // la flecha no dé una vuelta completa al cruzar el norte.
  let angle = -(data.heading || 0);
  if (state.liveAngle !== null) {
    while (angle - state.liveAngle > 180) angle -= 360;
    while (angle - state.liveAngle < -180) angle += 360;
  }
  state.liveAngle = angle;
  const svg = state.liveMarker.getElement()
    ? state.liveMarker.getElement().querySelector('svg') : null;
  if (svg) svg.style.transform = 'rotate(' + angle + 'deg)';

  if (state.follow) {
    state.map.panTo([data.lat, data.lng], { animate: true, duration: 0.35 });
  }

  if (state.proximity) autoMarkNear(data.lat, data.lng);
}

function autoMarkNear(lat, lng) {
  let best = null;
  let bestDist = 0.25; // ~16 m
  for (const m of state.tracked) {
    if (state.done.has(m.id)) continue;
    const dist = Math.hypot(m.lat - lat, m.lng - lng);
    if (dist < bestDist) { bestDist = dist; best = m; }
  }
  if (best) {
    toggleDone(best.id);
    toast(t('autoMarked', { name: markerName(best) }));
  }
}
