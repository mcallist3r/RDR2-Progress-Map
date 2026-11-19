# RDR2 · Mapa de progreso

Mapa interactivo de Red Dead Redemption 2 para usar **en local**, inspirado en
[botw-progress](https://github.com/phatnguyen-v1/botw-progress) y
[totk-progress](https://github.com/phatnguyen-v1/totk-progress).

Se abre con doble clic, carga la **partida que elijas** de tu equipo y guarda el
progreso de coleccionables y recursos **por partida**. Incluye un mod opcional
que dibuja tu posición en vivo sobre el mapa.

Todo funciona sin conexión (una vez descargados los tiles, si no vienen
incluidos) y sin instalar dependencias de Python: solo la biblioteca estándar y
un navegador.

---

## Inicio rápido

1. Doble clic en **`Start.bat`**.
2. Si tu copia no incluye los tiles o las fotos de los legendarios, la primera
   vez los descarga (tiles: unos 120 MB) y genera el dataset de marcadores.
   Puede tardar unos minutos y necesita conexión.
3. Se abre el navegador en `http://127.0.0.1:8790/` con el mapa.
4. Elige tu partida en el desplegable **PARTIDA** de la barra superior.

Para cerrarlo, cierra la ventana negra (o pulsa `Ctrl+C`).

### Requisitos

- Windows 10/11 y **Python 3.10 o superior** (`py -3` o `python` en el PATH).
- Un navegador moderno (Chrome, Edge, Firefox).
- Conexión a internet la primera vez, solo si faltan los tiles o las fotos.
- Opcional para el mod: ScriptHookRDR2 + ASI Loader y, solo si quieres
  recompilarlo, Visual Studio 2022 Build Tools con C++.

---

## Qué hay en el mapa

**Coleccionables (623 puntos rastreados):**

| Categoría | Puntos |
|---|---:|
| Huesos de dinosaurio | 30 |
| Atrapasueños | 20 |
| Petroglifos | 10 |
| Tumbas | 9 |
| Orquídeas exóticas | 187 |
| Huevos de aligátor | 20 |
| Cofres salvajes | 83 |
| Madrigueras de cangrejo | 17 |
| Naipes de cigarrillos | 150 |
| Sombreros | 14 |
| Armas únicas | 14 |
| Objetos raros | 8 |
| Mapas del tesoro | 20 |
| Tesoros | 12 |
| Animales legendarios | 16 |
| Peces legendarios | 13 |

**Recursos:** 6.290 puntos de hierbas y plantas (se dibujan al acercar el zoom
a 4 o más, para no saturar el mapa).

**Lugares:** 58 puntos de interés (sin seguimiento de progreso).

Total: **6.971 marcadores**.

### Uso

- **Clic en un marcador** → ficha con nombre, categoría, coordenadas y botones
  **Marcar como hecho** / **Deshacer** / **Centrar**. Los animales y peces
  legendarios muestran además su fotografía; debajo del nombre aparece el
  original en el otro idioma (inglés o español) tal y como sale en el juego.
- **Pestañas Todos / Pendientes / Hechos** para filtrar.
- **Casillas de la barra lateral** para ocultar categorías; cada fila muestra
  su contador y barra de progreso.
- **Buscador** (arriba a la derecha): busca por nombre, subtipo o nota y centra
  el marcador al hacer clic en el resultado.
- **Idioma (ES / EN)** y **tamaño del texto (Aa)** en la barra superior: toda la
  interfaz y los nombres del mapa cambian de idioma al instante, y el tamaño se
  puede subir hasta *Enorme* (150 %) sin perder el mapa de vista. Ambas
  preferencias se guardan en el navegador.
- **Seguir al jugador**: el mapa acompaña la flecha de posición.
- **Marcado automático al pasar cerca**: al acercarte a menos de ~16 m de un
  coleccionable pendiente, se marca solo (desactivado por defecto).
- **Exportar / Importar** (pie del panel): descarga el progreso de la partida
  activa en JSON y vuelve a cargarlo en otra partida u otro equipo. La
  importación **fusiona** lo que ya hubiera marcado.

La vista (centro y zoom) y los filtros se recuerdan en el navegador.

Los nombres y las notas de los marcadores están **traducidos al español**
(`data/translations_es.json`) y al inglés (`data/i18n_en.json`); los rótulos
dibujados en los propios tiles del mapa siguen en inglés, porque forman parte
de la imagen. El buscador acepta nombres en ambos idiomas.

---

## Progreso y partidas

El progreso se guarda en **`progress/<perfil>-<slot>.json`**, un archivo por
partida. Ejemplo:

```json
{
  "done": { "sp_dino_bones:sp_dino_bone_01:00": 1763570000000 },
  "notes": {},
  "updated": 1763570000000
}
```

- Al cambiar de partida en el selector se carga **su** archivo: el progreso de
  una partida nunca se mezcla con el de otra.
- Puedes hacer copia de seguridad o mover esos JSON libremente.
- El **% de completado del save** (86,5 %, etc.) es informativo: se lee de la
  cabecera del archivo de guardado.

### Por qué el progreso es manual

Los saves de RDR2 solo exponen en claro el nombre, el porcentaje y la fecha; el
estado interno va en bloques PSO cifrados sin esquema público. Por eso el mapa
**no puede saber qué coleccionable concreto está hecho**. La solución es el
marcado manual (con botón o auto-marcado por proximidad), que se guarda por
partida.

---

## Posición en vivo (mod)

El mapa puede dibujar tu posición y orientación en tiempo real.

- Plugin: **`mod/dist/RDR2MapTracker.asi`** (cópialo a la carpeta del juego,
  junto a `RDR2.exe`).
- Requiere **ScriptHookRDR2** y ASI Loader instalados.
- Cada 250 ms escribe `%LOCALAPPDATA%\RDR2ProgressMap\live.json` con
  `{x, y, z, heading, ts}`. **No toca partidas ni archivos del juego.**
- El servidor local lo lee en `/api/live`; si el JSON tiene menos de 5 s se
  considera en vivo y aparece la flecha girada según el rumbo. RDR2 mide el
  rumbo en sentido antihorario (0 = norte, 90 = oeste, 180 = sur, 270 = este),
  así que la interfaz invierte el signo para dibujarlo con la orientación real.

Pasos para usarlo:

1. Abre el mapa (`Start.bat`) y deja la ventana abierta.
2. Inicia el juego en **modo historia** y carga tu partida.
3. La insignia **En vivo** de la barra lateral debe ponerse en verde.
4. Activa **Seguir al jugador** y/o **Marcado automático al pasar cerca**.

Solo modo historia offline. No uses este mod en Red Dead Online.

### Recompilar el mod

```bat
mod\build_mod.bat          :: compila mod\dist\RDR2MapTracker.asi
mod\build_mod.bat -i       :: además lo copia junto a RDR2.exe si el proyecto
                           :: está dentro de la carpeta del juego
```

No necesita el SDK: `mod\src\main.cpp` resuelve dinámicamente las funciones de
`ScriptHookRDR2.dll` en tiempo de carga y declara los hashes públicos de los
natives que usa. Solo requiere el compilador de Visual Studio Build Tools.

Prueba sin abrir el juego (stub que simula ScriptHook y una posición fija):

```bat
mod\test\build_test.bat
```

---

## Estructura del proyecto

```
rdr2map/
  Start.bat              arranque con doble clic
  README.md              este documento
  README_EN.md           versión en inglés
  DESCRIPCION.md         texto para compartir (ES)
  DESCRIPCION_EN.md      texto para compartir (EN)
  THIRD_PARTY_NOTICES.md licencias y créditos de terceros
  .gitignore             exclusiones del repositorio
  app/                     servidor y lógica (solo stdlib)
    server.py              HTTP + API (/api/saves, /api/progress, /api/live…)
    saves.py               lectura de cabeceras SRDR*
    progress.py            progreso por partida (JSON atómico)
    coords.py              conversión coordenadas del juego → mapa
    config.py              config.json (partida activa, preferencias)
  web/                     interfaz (Leaflet vendorizado, sin CDN)
    index.html  style.css  app.js
    vendor/leaflet/
    images/legendary/      fotos de legendarios (se descargan; no están en el repo)
  data/                    markers.json y categories.json generados
    translations_es.json   nombres y notas traducidos al español
    i18n_en.json           nombres y notas traducidos al inglés
    images.json            generado por fetch_images.py (no está en el repo)
  assets/tiles/detailed/   tiles WebP (se descargan; no están en el repo)
  progress/                un JSON de progreso por partida
  tools/
    fetch_tiles.py         descarga y extrae los tiles (reanudable)
    build_markers.py       normaliza y fusiona los datasets
    apply_translations.py  aplica translations_es.json sobre markers.json
    build_i18n.py          genera data/i18n_en.json (capa inglesa)
    fetch_images.py        descarga las fotos de los legendarios (una vez)
    cdp_test.mjs           prueba E2E con Chrome DevTools Protocol
    i18n_test.mjs          comprueba traducciones, idioma y tamaño de texto
    shot.mjs               capturas del mapa
  mod/
    src/main.cpp           plugin de posición
    build_mod.bat          compilación del .asi
    test/                  stub de ScriptHook + harness de prueba
  config.json              se crea solo
```

### Repositorio

El repositorio no versiona los tiles, las fotos, `data/images.json`, `dist/`,
`progress/`, `config.json` ni los binarios compilados (ver `.gitignore`). Al
clonarlo, `Start.bat` descarga lo que falte en el primer arranque. Los avisos de
licencias de terceros están en `THIRD_PARTY_NOTICES.md`.

### API local

| Ruta | Descripción |
|---|---|
| `GET /api/status` | tiles, marcadores, partidas detectadas |
| `GET /api/saves` | partidas con nombre, %, fecha y mtime |
| `GET/POST /api/progress?save=<slot>` | progreso de una partida |
| `GET/POST /api/config` | partida activa y preferencias |
| `GET /api/live` | posición del mod y antigüedad |

El servidor busca puerto libre entre 8790 y 8809 y sirve solo bajo
`127.0.0.1`. Los estáticos están protegidos contra traversal.

---

## Datos y licencias

- **Marcadores de coleccionables y plantas:** [jeanropke/RDOMap](https://github.com/jeanropke/RDOMap)
  (Unlicense, dominio público).
- **Naipes, sombreros, armas, objetos raros, mapas, tesoros:** scrape archivado
  de IGN, [the0neWhoKnocks/red-dead-redemption-2-map](https://github.com/the0neWhoKnocks/red-dead-redemption-2-map)
  (MIT). Convertido al espacio del mapa dividiendo por 1,342 (factor verificado).
- **Leaflet 1.9.4:** BSD-2-Clause, vendorizado en `web/vendor/leaflet/`.
- **Tiles:** no se incluyen en el repositorio; se descargan una vez del CDN
  público de RDOMap (`map-tiles.b-cdn.net`) y se guardan en local.
- **Fotografías de animales y peces legendarios:** no se incluyen en el
  repositorio; se descargan una vez con `tools\fetch_images.py` desde la
  [Red Dead Wiki](https://reddead.fandom.com/) (Fandom) y se guardan en
  `web/images/legendary/`. Los derechos del material original son de Rockstar
  Games; se usan solo para consulta personal.

Los tiles y las fotos **no se redistribuyen**: se descargan en el primer
arranque desde sus fuentes originales y quedan en local para uso personal. Los
datos de marcadores conservan las licencias de sus fuentes (ver
`THIRD_PARTY_NOTICES.md`). Este proyecto es no oficial y no está afiliado a
Rockstar Games.

Todo el tráfico es local: el servidor escucha solo en `127.0.0.1` y la app no
envía nada a internet.

---

## Solución de problemas

- **No aparecen partidas:** deben estar en
  `Documentos\Rockstar Games\Red Dead Redemption 2\Profiles\<perfil>\SRDR*`.
  También se miran OneDrive y `Documentos` en español. Puedes forzar una ruta
  con la variable de entorno `RDR2_PROFILES_DIR`.
- **El aviso «Algunos tiles no se han cargado»:** la app reintenta sola una vez;
  si vuelve a salir, pulsa **Recargar** en el propio aviso. Suele pasar si se
  cierra la ventana negra del servidor mientras la pestaña sigue abierta.
- **El mapa sale sin texturas:** comprueba que la ventana de `Start.bat` sigue
  abierta; si el aviso dice que faltan tiles en disco, vuelve a ejecutar
  `tools\fetch_tiles.py` (la descarga se reanuda donde se quedó).
- **No salen las fotos de los legendarios:** comprueba que existe
  `web\images\legendary\`; si falta, ejecuta `python tools\fetch_images.py`
  (necesita conexión solo esa vez).
- **El puerto 8790 está ocupado:** el servidor prueba hasta el 8809 y te muestra
  la URL elegida en la ventana.
- **La insignia En vivo sigue en gris:** comprueba que el juego está en modo
  historia, que `ScriptHookRDR2.log` registra `RDR2MapTracker.asi` y que existe
  `%LOCALAPPDATA%\RDR2ProgressMap\live.json`.
- **El antivirus marca el `.asi`:** es un plugin sin firmar compilado en tu
  equipo; el código está en `mod/src/main.cpp`.
- **Actualización del juego:** si ScriptHookRDR2 deja de funcionar tras un
  parche, actualiza ScriptHookRDR2; el mapa manual sigue funcionando igual.

---

## Créditos

Interfaz y lógica inspiradas en los proyectos de `phatnguyen-v1` y en el mapa
de coleccionables de `jeanropke`. Datos de IGN vía el archivo de
`the0neWhoKnocks`. Este proyecto es de uso personal y no está afiliado a
Rockstar Games.
