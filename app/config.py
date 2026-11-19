#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Configuración persistente del mapa (config.json)."""
import json
import os
import tempfile
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "config.json")

DEFAULTS = {
    "activeSave": None,
    "prefs": {
        "style": "detailed",
        "follow": False,
        "proximity": False,
    },
}

_lock = threading.Lock()


def _merge(base, patch):
    out = dict(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load():
    with _lock:
        cfg = json.loads(json.dumps(DEFAULTS))
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    cfg = _merge(cfg, json.load(f))
            except (OSError, ValueError):
                pass
        return cfg


def save(cfg):
    with _lock:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(CONFIG_PATH), suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=1)
        os.replace(tmp, CONFIG_PATH)


def update(patch):
    cfg = _merge(load(), patch)
    save(cfg)
    return cfg
