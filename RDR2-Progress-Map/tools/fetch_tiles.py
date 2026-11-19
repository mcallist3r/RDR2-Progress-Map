#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Descarga y extrae los tiles del mapa de RDR2 (WebP).

Fuente: https://map-tiles.b-cdn.net/files/rdr3%20tiles%20-%20webp.zip
(120 MB, 29.187 tiles, estilos detailed / darkmode / black, zooms 1-7).

Extrae solo el estilo y los zooms pedidos a:
    assets/tiles/<estilo>/<z>/<x>_<y>.webp

Uso:
    python tools/fetch_tiles.py                     # detailed, z2-7
    python tools/fetch_tiles.py --style darkmode
    python tools/fetch_tiles.py --zooms 2-7 --all-styles
"""
import argparse
import os
import re
import sys
import time
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache")
ZIP_PATH = os.path.join(CACHE, "rdr3-tiles-webp.zip")
OUT = os.path.join(ROOT, "assets", "tiles")
URL = "https://map-tiles.b-cdn.net/files/rdr3%20tiles%20-%20webp.zip"
EXPECTED_SIZE = 120036909


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return "%.1f %s" % (n, unit)
        n /= 1024.0
    return "%.1f TB" % n


def download():
    os.makedirs(CACHE, exist_ok=True)
    have = os.path.getsize(ZIP_PATH) if os.path.exists(ZIP_PATH) else 0
    if have >= EXPECTED_SIZE:
        print("Zip ya descargado (%s)." % human(have))
        return
    part = ZIP_PATH + ".part"
    have = os.path.getsize(part) if os.path.exists(part) else 0
    headers = {"User-Agent": "rdr2map-fetch/1.0"}
    if have:
        headers["Range"] = "bytes=%d-" % have
        print("Reanudando descarga en %s ..." % human(have))
    else:
        print("Descargando %s..." % URL)
    req = urllib.request.Request(URL, headers=headers)
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as r, open(part, "ab") as f:
        total = have + int(r.headers.get("Content-Length") or 0)
        done = have
        last = 0
        while True:
            chunk = r.read(1024 * 256)
            if not chunk:
                break
            f.write(chunk)
            done += len(chunk)
            if time.time() - last > 1:
                last = time.time()
                pct = (100.0 * done / total) if total else 0
                speed = done / max(0.1, time.time() - t0)
                print("\r  %5.1f%%  %s / %s  (%s/s)" %
                      (pct, human(done), human(total), human(speed)), end="")
                sys.stdout.flush()
    print()
    os.replace(part, ZIP_PATH)
    print("Descarga completa: %s" % human(os.path.getsize(ZIP_PATH)))


def parse_zooms(spec):
    lo, _, hi = spec.partition("-")
    lo = int(lo)
    hi = int(hi) if hi else lo
    return set(range(lo, hi + 1))


def extract(styles, zooms, force=False):
    pat = re.compile(r"^webp/([^/]+)/(\d+)/(\d+)_(\d+)\.webp$")
    touched = 0
    skipped = 0
    t0 = time.time()
    with zipfile.ZipFile(ZIP_PATH) as zf:
        members = zf.infolist()
        todo = []
        for info in members:
            m = pat.match(info.filename)
            if not m:
                continue
            style, z, x, y = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
            if style not in styles or z not in zooms:
                continue
            dest = os.path.join(OUT, style, str(z), "%d_%d.webp" % (x, y))
            todo.append((info, dest))
        print("Tiles a extraer: %d" % len(todo))
        for i, (info, dest) in enumerate(todo, 1):
            if not force and os.path.exists(dest) and os.path.getsize(dest) == info.file_size:
                skipped += 1
                continue
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with zf.open(info) as src, open(dest + ".part", "wb") as dst:
                while True:
                    chunk = src.read(1024 * 128)
                    if not chunk:
                        break
                    dst.write(chunk)
            os.replace(dest + ".part", dest)
            touched += 1
            if i % 250 == 0 or i == len(todo):
                print("\r  %d / %d  (%s)" % (i, len(todo), human(touched)), end="")
                sys.stdout.flush()
    print("\nExtraídos %d, ya existían %d, en %.1f s" %
          (touched, skipped, time.time() - t0))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", default="detailed",
                    choices=["detailed", "darkmode", "black", "all"])
    ap.add_argument("--zooms", default="2-7")
    ap.add_argument("--force", action="store_true", help="reextraer aunque existan")
    ap.add_argument("--no-download", action="store_true")
    args = ap.parse_args()

    if not args.no_download:
        download()
    if not os.path.exists(ZIP_PATH):
        print("Falta el zip. Ejecuta sin --no-download.", file=sys.stderr)
        return 1

    styles = {"detailed", "darkmode", "black"} if args.style == "all" else {args.style}
    zooms = parse_zooms(args.zooms)
    extract(styles, zooms, force=args.force)
    print("Listo: %s" % OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
