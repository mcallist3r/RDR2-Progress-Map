#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aplica data/translations_es.json sobre data/markers.json sin tocar los ids.

Los nombres y notas originales en inglés se conservan en `nameEn` / `noteEn`
para que el buscador siga aceptándolos. Es idempotente: volver a ejecutarlo no
cambia nada.

Uso:  python tools/apply_translations.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")


def load_json(name):
    with open(os.path.join(DATA, name), "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    try:
        tr = load_json("translations_es.json")
    except OSError as exc:
        print("No se puede leer translations_es.json: %s" % exc)
        return 1
    names = tr.get("names") or {}
    notes = tr.get("notes") or {}

    path = os.path.join(DATA, "markers.json")
    with open(path, "r", encoding="utf-8") as f:
        doc = json.load(f)

    used_names = set()
    used_notes = set()
    translated_names = 0
    translated_notes = 0
    for m in doc.get("markers", []):
        en = m.get("nameEn") or m.get("name")
        es = names.get(en)
        if es:
            used_names.add(en)
            if m.get("name") != es:
                m["nameEn"] = en
                m["name"] = es
                translated_names += 1
        note = m.get("noteEn") or m.get("note") or ""
        es = notes.get(note)
        if es:
            used_notes.add(note)
            if m.get("note") != es:
                m["noteEn"] = note
                m["note"] = es
                translated_notes += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))

    unused_names = sorted(set(names) - used_names)
    unused_notes = sorted(set(notes) - used_notes)
    print("Nombres traducidos: %d" % translated_names)
    print("Notas traducidas:   %d" % translated_notes)
    if unused_names:
        print("\nClaves de nombres sin usar (%d):" % len(unused_names))
        for k in unused_names:
            print("  -", k)
    if unused_notes:
        print("\nClaves de notas sin usar (%d):" % len(unused_notes))
        for k in unused_notes:
            print("  -", k)
    return 0


if __name__ == "__main__":
    sys.exit(main())
