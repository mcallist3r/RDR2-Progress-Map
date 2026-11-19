# RDR2 · Progress Map

An interactive map of Red Dead Redemption 2 for **local use**, inspired by
[botw-progress](https://github.com/phatnguyen-v1/botw-progress) and
[totk-progress](https://github.com/phatnguyen-v1/totk-progress).

Open it with a double click, load the **save you choose** from your computer and
track collectible and resource progress **per save file**. It includes an
optional mod that draws your live position on the map.

Everything works offline (once the tiles are downloaded, if they are not
included) and without installing any Python dependencies: just the standard
library and a browser.

---

## Quick start

1. Double-click **`Start.bat`**.
2. If your copy doesn't include the tiles or the legendary photos, the first run
   downloads them (tiles: about 120 MB) and generates the marker dataset. It can
   take a few minutes and needs an internet connection.
3. Your browser opens at `http://127.0.0.1:8790/` with the map.
4. Choose your save in the **SAVE** dropdown in the top bar.

To close it, close the black window (or press `Ctrl+C`).

### Requirements

- Windows 10/11 and **Python 3.10 or newer** (`py -3` or `python` on the PATH).
- A modern browser (Chrome, Edge, Firefox).
- An internet connection the first time, only if the tiles or photos are missing.
- Optional for the mod: ScriptHookRDR2 + ASI Loader and, only if you want to
  rebuild it, Visual Studio 2022 Build Tools with C++.

---

## What's on the map

**Collectibles (623 tracked points):**

| Category | Points |
|---|---:|
| Dinosaur bones | 30 |
| Dreamcatchers | 20 |
| Rock carvings | 10 |
| Graves | 9 |
| Exotic orchids | 187 |
| Alligator eggs | 20 |
| Wilderness chests | 83 |
| Crayfish holes | 17 |
| Cigarette cards | 150 |
| Hats | 14 |
| Unique weapons | 14 |
| Rare items | 8 |
| Treasure maps | 20 |
| Treasures | 12 |
| Legendary animals | 16 |
| Legendary fish | 13 |

**Resources:** 6,290 herb and plant points (drawn when the zoom reaches 4 or
more, so they don't clutter the map).

**Places:** 58 points of interest (no progress tracking).

Total: **6,971 markers**.

### Usage

- **Click a marker** → card with its name, category, coordinates and
  **Mark as done** / **Undo** / **Center** buttons. Legendary animals and fish
  also show their photo; below the name you will see the original in the other
  language (English or Spanish) as it appears in the game.
- **All / Pending / Done tabs** to filter.
- **Sidebar checkboxes** to hide categories; each row shows its counter and
  progress bar.
- **Search** (top right): search by name, subtype or note and click a result to
  center the marker.
- **Language (ES / EN)** and **text size (Aa)** in the top bar: the whole
  interface and the map names switch language instantly, and the size can go up
  to *Huge* (150%) without losing sight of the map. Both preferences are saved
  in the browser.
- **Follow player**: the map follows the position arrow.
- **Auto-mark when nearby**: when you get within ~16 m of a pending
  collectible, it is marked automatically (off by default).
- **Export / Import** (sidebar footer): download the active save's progress as
  JSON and load it into another save or another computer. Importing **merges**
  with whatever you had already marked.

The view (center and zoom) and the filters are remembered in the browser.

Marker names and notes are **translated into Spanish**
(`data/translations_es.json`) and English (`data/i18n_en.json`); labels drawn on
the map tiles themselves remain in English because they are part of the image.
Search accepts names in both languages.

---

## Progress and saves

Progress is stored in **`progress/<profile>-<slot>.json`**, one file per save.
Example:

```json
{
  "done": { "sp_dino_bones:sp_dino_bone_01:00": 1763570000000 },
  "notes": {},
  "updated": 1763570000000
}
```

- Switching saves in the selector loads **its** file: progress from one save
  never mixes with another.
- You can back up or move those JSON files freely.
- The **save completion %** (86.5%, etc.) is informational: it is read from the
  save file header.

### Why progress is manual

RDR2 saves only expose the name, percentage and date in plain text; the internal
state lives in encrypted PSO blocks with no public schema. That is why the map
**cannot know which specific collectible is done**. The solution is manual
marking (with the button or proximity auto-mark), stored per save.

---

## Live position (mod)

The map can draw your position and heading in real time.

- Plugin: **`mod/dist/RDR2MapTracker.asi`** (copy it to the game folder, next to
  `RDR2.exe`).
- Requires **ScriptHookRDR2** and ASI Loader.
- Every 250 ms it writes `%LOCALAPPDATA%\RDR2ProgressMap\live.json` with
  `{x, y, z, heading, ts}`. **It does not touch saves or game files.**
- The local server reads it at `/api/live`; if the JSON is less than 5 s old it
  is considered live and the arrow appears rotated to the heading. RDR2 measures
  heading counter-clockwise (0 = north, 90 = west, 180 = south, 270 = east), so
  the interface flips the sign to draw it with the real orientation.

Steps to use it:

1. Open the map (`Start.bat`) and keep the window open.
2. Start the game in **story mode** and load your save.
3. The **Live** badge in the sidebar should turn green.
4. Enable **Follow player** and/or **Auto-mark when nearby**.

Story mode offline only. Do not use this mod in Red Dead Online.

### Rebuilding the mod

```bat
mod\build_mod.bat          :: builds mod\dist\RDR2MapTracker.asi
mod\build_mod.bat -i       :: also copies it next to RDR2.exe if the project
                           :: is inside the game folder
```

It does not need the SDK: `mod\src\main.cpp` resolves the ScriptHookRDR2.dll
functions dynamically at load time and declares the public hashes of the natives
it uses. It only requires the Visual Studio Build Tools compiler.

Test without launching the game (a stub that simulates ScriptHook and a fixed
position):

```bat
mod\test\build_test.bat
```

---

## Project structure

```
rdr2map/
  Start.bat                double-click launcher
  README.md                Spanish version
  README_EN.md             this document
  DESCRIPCION.md           share text (Spanish)
  DESCRIPCION_EN.md        share text (English)
  THIRD_PARTY_NOTICES.md   third-party licenses and credits
  .gitignore               repository exclusions
  app/                     server and logic (stdlib only)
    server.py              HTTP + API (/api/saves, /api/progress, /api/live…)
    saves.py               reads SRDR* headers
    progress.py            per-save progress (atomic JSON)
    coords.py              game → map coordinate conversion
    config.py              config.json (active save, preferences)
  web/                     interface (vendored Leaflet, no CDN)
    index.html  style.css  app.js
    vendor/leaflet/
    images/legendary/      legendary photos (downloaded; not in the repo)
  data/                    generated markers.json and categories.json
    translations_es.json   Spanish names and notes
    i18n_en.json           English names and notes
    images.json            generated by fetch_images.py (not in the repo)
  assets/tiles/detailed/   WebP tiles (downloaded; not in the repo)
  progress/                one progress JSON per save
  tools/
    fetch_tiles.py         downloads and extracts the tiles (resumable)
    build_markers.py       normalizes and merges the datasets
    apply_translations.py  applies translations_es.json to markers.json
    build_i18n.py          generates data/i18n_en.json (English layer)
    fetch_images.py        downloads the legendary photos (once)
    cdp_test.mjs           E2E test with Chrome DevTools Protocol
    i18n_test.mjs          checks translations, language and text size
    shot.mjs               map screenshots
  mod/
    src/main.cpp           position plugin
    build_mod.bat          .asi build
    test/                  ScriptHook stub + test harness
  config.json              created automatically
```

### Repository

The repository does not track the tiles, the photos, `data/images.json`, `dist/`,
`progress/`, `config.json` or compiled binaries (see `.gitignore`). When cloning
it, `Start.bat` downloads whatever is missing on the first run. Third-party
license notices are in `THIRD_PARTY_NOTICES.md`.

### Local API

| Route | Description |
|---|---|
| `GET /api/status` | tiles, markers, detected saves |
| `GET /api/saves` | saves with name, %, date and mtime |
| `GET/POST /api/progress?save=<slot>` | progress for one save |
| `GET/POST /api/config` | active save and preferences |
| `GET /api/live` | mod position and age |

The server looks for a free port between 8790 and 8809 and serves only on
`127.0.0.1`. Static files are protected against traversal.

---

## Data and licenses

- **Collectible and plant markers:** [jeanropke/RDOMap](https://github.com/jeanropke/RDOMap)
  (Unlicense, public domain).
- **Cigarette cards, hats, weapons, rare items, maps, treasures:** archived IGN
  scrape, [the0neWhoKnocks/red-dead-redemption-2-map](https://github.com/the0neWhoKnocks/red-dead-redemption-2-map)
  (MIT). Converted to the map space by dividing by 1.342 (verified factor).
- **Leaflet 1.9.4:** BSD-2-Clause, vendored in `web/vendor/leaflet/`.
- **Tiles:** not included in the repository; downloaded once from the public
  RDOMap CDN (`map-tiles.b-cdn.net`) and stored locally.
- **Legendary animal and fish photos:** not included in the repository;
  downloaded once with `tools\fetch_images.py` from the
  [Red Dead Wiki](https://reddead.fandom.com/) (Fandom) and stored in
  `web/images/legendary/`. The rights to the original material belong to
  Rockstar Games; they are used for personal reference only.

Tiles and photos are **not redistributed**: they are downloaded on the first run
from their original sources and stored locally for personal use. The marker data
keeps the licenses of its sources (see `THIRD_PARTY_NOTICES.md`). This is an
unofficial project, not affiliated with Rockstar Games.

All traffic is local: the server listens only on `127.0.0.1` and the app sends
nothing to the internet.

---

## Troubleshooting

- **No saves appear:** they must be in
  `Documents\Rockstar Games\Red Dead Redemption 2\Profiles\<profile>\SRDR*`.
  OneDrive and the Spanish `Documentos` folder are also checked. You can force a
  path with the `RDR2_PROFILES_DIR` environment variable.
- **"Some tiles failed to load" warning:** the app retries once by itself; if it
  appears again, click **Reload** in the warning itself. It usually happens if
  you close the black server window while the tab is still open.
- **The map has no textures:** check that the `Start.bat` window is still open;
  if the warning says tiles are missing on disk, run `tools\fetch_tiles.py`
  again (the download resumes where it left off).
- **Legendary photos don't appear:** check that `web\images\legendary\` exists;
  if it is missing, run `python tools\fetch_images.py` (it only needs a
  connection that one time).
- **Port 8790 is busy:** the server tries up to 8809 and shows the chosen URL in
  the window.
- **The Live badge stays grey:** check that the game is in story mode, that
  `ScriptHookRDR2.log` lists `RDR2MapTracker.asi`, and that
  `%LOCALAPPDATA%\RDR2ProgressMap\live.json` exists.
- **The antivirus flags the `.asi`:** it is an unsigned plugin compiled on your
  computer; the code is in `mod/src/main.cpp`.
- **Game update:** if ScriptHookRDR2 stops working after a patch, update
  ScriptHookRDR2; the manual map keeps working just the same.

---

## Credits

Interface and logic inspired by the projects of `phatnguyen-v1` and by
`jeanropke`'s collectible map. IGN data via `the0neWhoKnocks`' archive. This
project is for personal use and is not affiliated with Rockstar Games.
