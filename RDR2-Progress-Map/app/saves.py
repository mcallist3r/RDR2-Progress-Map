#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Detección y lectura de las cabeceras de partidas de RDR2.

Los saves PC (SRDR*) llevan una cabecera en claro:
  0x00  00 00 00 04
  0x04  título UTF-16LE (nombre + % + fecha), hasta 0x104
  0x104 4 bytes de fecha/checksum interno
  0x10C checksum
El resto del save está cifrado (AES-256-ECB) y su payload PSO es opaco, así
que aquí solo se lee lo que el juego deja legible: nombre, % y fecha.
"""
import glob
import os
import re
import time

HEADER_SIZE = 0x104
TITLE_RE = re.compile(r"^(?P<name>.*?)\s*\((?P<pct>\d+(?:\.\d+)?)%\)\s*-\s*(?P<date>.+)$")
FILE_RE = re.compile(r"^SRDR[0-9A-Za-z]+$")


def _candidate_roots():
    home = os.path.expanduser("~")
    docs = [
        os.path.join(home, "Documents"),
        os.path.join(home, "Documentos"),
        os.path.join(home, "OneDrive", "Documents"),
        os.path.join(home, "OneDrive", "Documentos"),
    ]
    return docs


def find_profiles():
    """Devuelve las carpetas Profiles que contienen saves SRDR*."""
    found = []
    env = os.environ.get("RDR2_PROFILES_DIR")
    candidates = [env] if env else []
    for docs in _candidate_roots():
        candidates.append(os.path.join(docs, "Rockstar Games",
                                      "Red Dead Redemption 2", "Profiles"))
    seen = set()
    for base in candidates:
        if not base or not os.path.isdir(base):
            continue
        for prof in sorted(os.listdir(base)):
            path = os.path.join(base, prof)
            if not os.path.isdir(path):
                continue
            real = os.path.realpath(path)
            if real in seen:
                continue
            if glob.glob(os.path.join(path, "SRDR*")):
                seen.add(real)
                found.append(path)
    return found


def read_header(path):
    with open(path, "rb") as f:
        head = f.read(HEADER_SIZE)
    if len(head) < HEADER_SIZE or head[:4] != b"\x00\x00\x00\x04":
        return None
    raw = head[4:HEADER_SIZE].decode("utf-16-le", "replace").split("\x00", 1)[0]
    raw = raw.strip()
    if not raw:
        return None
    m = TITLE_RE.match(raw)
    if not m:
        return {"title": raw, "name": raw, "percent": None, "date": ""}
    return {
        "title": raw,
        "name": m.group("name").strip(),
        "percent": float(m.group("pct")),
        "date": m.group("date").strip(),
    }


def list_saves():
    saves = []
    for profile in find_profiles():
        profile_name = os.path.basename(profile.rstrip("\\/"))
        for path in sorted(glob.glob(os.path.join(profile, "SRDR*"))):
            base = os.path.basename(path)
            if not FILE_RE.match(base):
                continue
            try:
                st = os.stat(path)
            except OSError:
                continue
            info = read_header(path)
            if info is None:
                continue
            name = info["name"]
            autosave = name.lower().startswith("(autoguardado)")
            if autosave:
                name = re.sub(r"^\(autoguardado\)\s*", "", name, flags=re.I)
            date_text = info["date"]
            dm = re.match(r"(\d{2})/(\d{2})/(\d{2})\s+(\d{2}:\d{2})", date_text)
            if dm:
                date_text = "%s/%s/%s %s" % (dm.group(2), dm.group(1),
                                             dm.group(3), dm.group(4))
            saves.append({
                "slot": "%s-%s" % (profile_name, base),
                "file": base,
                "profile": profile_name,
                "title": info["title"],
                "name": name,
                "percent": info["percent"],
                "date": info["date"],
                "dateText": date_text,
                "isAutosave": autosave,
                "mtime": st.st_mtime,
                "mtimeText": time.strftime("%d/%m/%Y %H:%M",
                                           time.localtime(st.st_mtime)),
                "size": st.st_size,
            })
    saves.sort(key=lambda s: s["mtime"], reverse=True)
    return saves


if __name__ == "__main__":
    import json
    print(json.dumps(list_saves(), ensure_ascii=False, indent=1))
