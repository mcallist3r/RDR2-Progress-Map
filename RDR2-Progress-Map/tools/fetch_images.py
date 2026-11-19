#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Descarga una imagen para cada animal y pez legendario.

Las imágenes se obtienen de la wiki pública Red Dead Wiki (Fandom) y quedan
guardadas en web/images/legendary/. Se genera data/images.json, que asocia el
id de cada marcador con su archivo local. Solo se ejecuta una vez; las
imágenes ya descargadas se conservan.

Uso:  python tools/fetch_images.py [--force]
"""
import glob
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
OUT_DIR = os.path.join(ROOT, "web", "images", "legendary")
API = "https://reddead.fandom.com/api.php"
UA = {"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")}

# Algunos marcadores usan un nombre corto; la wiki usa el nombre completo.
PAGE_MAP = {
    "Legendary Alligator": 'Legendary Bullgator "Lacartus"',
    "Legendary Gar": "Legendary Longnose Gar",
    "Legendary Grizzly Bear": "Legendary Bharati Grizzly Bear",
    "Legendary Panther": "Legendary Giaguaro Panther",
    "Legendary Ram": "Legendary Bighorn Ram",
    "Legendary Sturgeon": "Legendary Lake Sturgeon",
}


def api(params):
    params = dict(params)
    params.setdefault("action", "query")
    params.setdefault("format", "json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def page_image(title):
    """Devuelve (url, nombre de archivo) para la imagen principal de la página."""
    d = api({"prop": "pageimages", "redirects": "1",
             "piprop": "thumbnail|original", "pithumbsize": "480",
             "titles": title})
    for p in d.get("query", {}).get("pages", {}).values():
        if "missing" in p:
            return None, None
        url = (p.get("thumbnail") or {}).get("source") or \
              (p.get("original") or {}).get("source")
        if url:
            return url, page_title_from_url(url)
        # Sin pageimage: se usa la imagen del infobox.
        d2 = api({"prop": "revisions", "rvprop": "content", "rvslots": "main",
                  "redirects": "1", "titles": p.get("title", title)})
        for p2 in d2.get("query", {}).get("pages", {}).values():
            rev = (p2.get("revisions") or [{}])[0]
            text = ((rev.get("slots") or {}).get("main") or {}).get("*", "")
            m = re.search(r"\|\s*image\s*=\s*([^\n|}]+)", text)
            if not m:
                continue
            fn = m.group(1).strip()
            d3 = api({"prop": "imageinfo", "iiprop": "url|mime",
                      "iiurlwidth": "480", "titles": "File:" + fn})
            for p3 in d3.get("query", {}).get("pages", {}).values():
                for info in p3.get("imageinfo", []):
                    return (info.get("thumburl") or info.get("url")), fn
    return None, None


def page_title_from_url(url):
    path = urllib.parse.urlparse(url).path
    return urllib.parse.unquote(path.rsplit("/", 1)[-1])


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def download(url, base):
    """Descarga con curl (urllib recibe 403 de Comcast/Cloudflare de Fandom).

    Devuelve el archivo final; la extensión se decide por el contenido real.
    """
    tmp = base + ".part"
    cmd = [
        "curl", "-fL", "-sS", "--max-time", "60",
        "-A", UA["User-Agent"],
        "-e", "https://reddead.fandom.com/",
        "-H", "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "-o", tmp, url,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    with open(tmp, "rb") as f:
        head = f.read(12)
    if head[:3] == b"\xff\xd8\xff":
        ext = "jpg"
    elif head[:8] == b"\x89PNG\r\n\x1a\n":
        ext = "png"
    elif head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        ext = "webp"
    else:
        os.remove(tmp)
        raise ValueError("la respuesta no es una imagen")
    dest = base + "." + ext
    os.replace(tmp, dest)
    return dest


def main():
    force = "--force" in sys.argv[1:]
    with open(os.path.join(DATA, "markers.json"), "r", encoding="utf-8") as f:
        markers = json.load(f)["markers"]

    targets = [m for m in markers
               if m.get("cat") in ("ign_legendary_animals", "ign_legendary_fish")]
    names = sorted({m.get("nameEn") or m["name"] for m in targets})
    os.makedirs(OUT_DIR, exist_ok=True)

    files = {}
    errors = []
    for i, name in enumerate(names, 1):
        title = PAGE_MAP.get(name, name)
        print("[%2d/%d] %s" % (i, len(names), name))
        try:
            url, _ = page_image(title)
            if not url:
                raise ValueError("la wiki no tiene imagen para «%s»" % title)
            base = os.path.join(OUT_DIR, slug(name))
            existing = [p for p in glob.glob(base + ".*") if not p.endswith(".part")]
            if existing and not force:
                print("         ya existe", os.path.basename(existing[0]))
                files[name] = "images/legendary/" + os.path.basename(existing[0])
                continue
            dest = download(url, base)
            files[name] = "images/legendary/" + os.path.basename(dest)
            print("         ", os.path.basename(dest),
                  "%.0f KB" % (os.path.getsize(dest) / 1024.0))
            time.sleep(0.2)
        except (urllib.error.URLError, ValueError, OSError,
                subprocess.CalledProcessError) as exc:
            errors.append((name, str(exc)))
            print("         ERROR:", exc)

    images = {}
    for m in targets:
        rel = files.get(m.get("nameEn") or m["name"])
        if rel:
            images[m["id"]] = "/" + rel

    with open(os.path.join(DATA, "images.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "images": images}, f,
                  ensure_ascii=False, separators=(",", ":"))

    print("\n%d imágenes asociadas a %d marcadores." % (len(files), len(images)))
    if errors:
        print("Fallos (%d):" % len(errors))
        for name, msg in errors:
            print("  -", name, "->", msg)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
