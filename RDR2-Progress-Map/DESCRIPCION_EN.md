# RDR2 · Progress Map

An interactive map of Red Dead Redemption 2 collectibles, resources and points of interest for PC, meant to run locally while you play. It is inspired by the Breath of the Wild and Tears of the Kingdom progress maps: open the map, mark what you find, and your progress is saved per save file.

It works offline (the map tiles are downloaded once if they are not included) and installs nothing unusual: a local Python server and your browser. It never touches your save files.

## What's included

- **6,971 markers** in three groups:
  - **Collectibles (623 tracked points):** 30 dinosaur bones, 20 dreamcatchers, 10 rock carvings, 9 graves, 187 exotic orchids, 20 alligator eggs, 83 wilderness chests, 17 crayfish holes, 150 cigarette cards, 14 hats, 14 unique weapons, 8 rare items, 20 treasure maps, 12 treasures, 16 legendary animals and 13 legendary fish.
  - **Resources:** 6,290 herb and plant points.
  - **Places:** 58 points of interest.
- **Per-save progress:** it detects your saves (name, percentage and date) and keeps a separate file for each one. Switching saves switches progress; they never mix.
- **Filters:** All / Pending / Done tabs, per-category checkboxes with counters and progress bars, and automatic hiding of dense categories based on zoom (herbs, orchids and chests appear as you zoom in).
- **Search** by name, subtype or note, in Spanish and English.
- **Marker card:** name, category, coordinates and Mark as done / Undo / Center buttons. Legendary animals and fish also show a photo.
- **ES/EN language and text size** adjustable instantly (up to 150%), remembered between sessions.
- **Export / Import** progress as JSON; importing merges with what you already had.
- **Follow player and auto-mark nearby** (optional, with the mod).
- The view, filters and preferences are remembered in the browser.

## Progress is manual: what you have already done in-game is NOT imported

This is the most frequently asked question, so it is worth stating up front:

**The map starts at 0 for every save and cannot read which specific collectibles you have already obtained.**

The reason is how RDR2 stores its saves. Only the header of the save file can be read in plain text: name, percentage and date. All internal state (missions, inventory, collectibles) lives in encrypted PSO blocks, and there is no public schema for that format. To know "I already have this specific dinosaur bone" you would have to decrypt and understand those blocks: that is reverse engineering, it breaks with every game patch, and the slightest mistake can corrupt the save. The map does not attempt it: it only reads the header to show the informational percentage and never writes to your saves.

There is also no reliable way to query the state of each collectible individually, so there is no shortcut.

**What this means in practice:** if you already have progress, you will have to mark by hand what you already own (one click per marker; search and filters help). From there, you can mark things as you go or enable auto-mark nearby with the mod. The save percentage cannot be used to infer it, because it also includes story, missions and much more.

The Export/Import JSON is for moving **your marked progress** between saves or computers, not for extracting it from the game.

## How to use it

1. Unzip the folder wherever you like.
2. Double-click **Start.bat**. If your copy doesn't include the map tiles, the first run downloads them (about 120 MB) and takes a few minutes; afterwards it starts instantly and works offline.
3. Your browser opens at `http://127.0.0.1:8790`.
4. Choose your save in the **SAVE** dropdown in the top bar.
5. Keep the black window open while you use it; to close it, close the window or press `Ctrl+C`.

**Requirements:** Windows 10/11, Python 3.10 or newer (with `py -3` or `python` on the PATH) and a modern browser. You don't need RDR2 running to browse the map; only for save tracking and the live position.

## Optional live position mod

It includes a plugin (`RDR2MapTracker.asi`) that draws your position and orientation on the map every 250 ms. To use it, copy `mod/dist/RDR2MapTracker.asi` to the game folder, next to `RDR2.exe`; it requires ScriptHookRDR2 + ASI Loader. Story mode offline only: do not use it in Red Dead Online. The plugin only reads your position and writes a separate JSON file at `%LOCALAPPDATA%\RDR2ProgressMap\live.json`; it does not modify saves or game files.

If you don't want to install the plugin, the map works just the same: you simply won't see the arrow or the auto-marking.

## Privacy and data

- Everything is local: the server listens only on `127.0.0.1` and the app sends nothing to the internet.
- Progress is stored as JSON files inside the `progress/` folder; you can copy them or back them up.
- The map tiles are downloaded once from RDOMap's public CDN and the legendary photos from the Red Dead Wiki. They are Rockstar Games material and are used for personal reference only; do not redistribute them separately.

## If something isn't working

- **No saves appear:** they must be in `Documents\Rockstar Games\Red Dead Redemption 2\Profiles\<profile>\SRDR*`. OneDrive and the localized "Documentos" folder are also checked.
- **Tile loading warning:** make sure the `Start.bat` window is still open, then click Reload in the warning.
- **Your antivirus flags the `.asi`:** it is an unsigned plugin compiled from the code included in `mod/src/main.cpp`.

## Credits

Marker data from [jeanropke/RDOMap](https://github.com/jeanropke/RDOMap) (Unlicense) and from [the0neWhoKnocks](https://github.com/the0neWhoKnocks/red-dead-redemption-2-map) (MIT); Leaflet 1.9.4 (BSD-2-Clause). Interface inspired by botw-progress and totk-progress. Unofficial project, not affiliated with Rockstar Games.
