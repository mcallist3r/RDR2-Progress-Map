#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Progreso por partida: progress/<slot>.json."""
import json
import os
import re
import tempfile
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROGRESS_DIR = os.path.join(ROOT, "progress")
SLOT_RE = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")
MAX_ITEMS = 60000
_lock = threading.Lock()


def valid_slot(slot):
    return bool(slot) and bool(SLOT_RE.match(slot)) and ".." not in slot


def _path(slot):
    if not valid_slot(slot):
        raise ValueError("slot inválido")
    return os.path.join(PROGRESS_DIR, slot + ".json")


def _empty(slot):
    return {"slot": slot, "done": {}, "notes": {}, "updated": None}


def load(slot):
    path = _path(slot)
    with _lock:
        if not os.path.exists(path):
            return _empty(slot)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            return _empty(slot)
    out = _empty(slot)
    if isinstance(data.get("done"), dict):
        out["done"] = {str(k): v for k, v in data["done"].items() if v}
    if isinstance(data.get("notes"), dict):
        out["notes"] = {str(k): str(v) for k, v in data["notes"].items()}
    out["updated"] = data.get("updated")
    return out


def save(slot, done, notes=None):
    if not isinstance(done, dict) or len(done) > MAX_ITEMS:
        raise ValueError("done inválido")
    clean = {}
    for k, v in done.items():
        if not isinstance(k, str) or len(k) > 200:
            continue
        if v:
            clean[k] = int(time.time()) if v is True else v
    notes_clean = {}
    if isinstance(notes, dict):
        for k, v in list(notes.items())[:MAX_ITEMS]:
            if isinstance(k, str) and len(k) <= 200:
                notes_clean[k] = str(v)[:1000]
    data = {
        "slot": slot,
        "done": clean,
        "notes": notes_clean,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    path = _path(slot)
    with _lock:
        os.makedirs(PROGRESS_DIR, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=PROGRESS_DIR, suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        os.replace(tmp, path)
    return data
