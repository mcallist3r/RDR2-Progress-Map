#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera data/markers.json y data/categories.json a partir de:

  - jeanropke/RDOMap (Unlicense): singleplayer.json, plants.json
  - the0neWhoKnocks/red-dead-redemption-2-map (MIT): markers.default.json

El scrape archivado de IGN usa el mismo espacio del mapa multiplicado por
1.342 en ambos ejes (su script adjust-coords.js usaba 1.342/1.341); se
divide entre IGN_SCALE para recuperar el espacio de RDOMap/tiles.

Uso:  python tools/build_markers.py
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache")
DATA = os.path.join(ROOT, "data")
IGN_SCALE = 1.342

SOURCES = {
    "singleplayer": "https://raw.githubusercontent.com/jeanropke/RDOMap/master/data/singleplayer.json",
    "plants": "https://raw.githubusercontent.com/jeanropke/RDOMap/master/data/plants.json",
    "ign": "https://raw.githubusercontent.com/the0neWhoKnocks/red-dead-redemption-2-map/"
           "eba0de442a/public/markers.default.json",
}

PLANT_ES = {
    "alaskan_ginseng": "Ginseng de Alaska",
    "american_ginseng": "Ginseng americano",
    "bay_bolete": "Boleto de bahía",
    "black_berry": "Mora negra",
    "black_currant": "Grosella negra",
    "burdock_root": "Raíz de bardana",
    "chanterelles": "Rebozuelos",
    "common_bulrush": "Junco común",
    "creeping_thyme": "Tomillo rastrero",
    "desert_sage": "Salvia del desierto",
    "english_mace": "Macis inglés",
    "evergreen_huckleberry": "Arándano perenne",
    "golden_currant": "Grosella dorada",
    "hummingbird_sage": "Salvia colibrí",
    "indian_tobacco": "Tabaco indio",
    "milkweed": "Algodoncillo",
    "oleander_sage": "Salvia adelfa",
    "oregano": "Orégano",
    "parasol_mushroom": "Seta parasol",
    "prairie_poppy": "Amapola de pradera",
    "rams_head": "Cabeza de carnero",
    "red_raspberry": "Frambuesa roja",
    "red_sage": "Salvia roja",
    "vanilla_flower": "Flor de vainilla",
    "violet_snowdrop": "Campanilla violeta",
    "wild_carrots": "Zanahorias silvestres",
    "wild_feverfew": "Matricaria silvestre",
    "wild_mint": "Menta silvestre",
    "wintergreen_berry": "Baya de gaulteria",
    "yarrow": "Milenrama",
    "harrietum": "Harrietum",
}

ORCHID_ES = {
    "sp_orchid_lady_of_the_night": "Dama de la noche",
    "sp_orchid_rat_tail": "Cola de rata",
    "sp_orchid_moccasin_flower": "Flor de mocasín",
    "sp_orchid_acunas_star": "Estrella de Acuña",
    "sp_orchid_cigar": "Cigarro",
    "sp_orchid_clamshell": "Concha de almeja",
    "sp_orchid_dragons_mouth": "Boca de dragón",
    "sp_orchid_ghost": "Fantasma",
    "sp_orchid_lady_slipper": "Zapatilla de dama",
    "sp_orchid_night_scented": "Perfumada nocturna",
    "sp_orchid_queens": "De la reina",
    "sp_orchid_sparrows_egg": "Huevo de gorrión",
    "sp_orchid_spider": "Araña",
}

GRAVE_ES = {
    "am": "Arthur Morgan",
    "dc": "Davey Callander",
    "ef": "Eagle Flies",
    "hm": "Hosea Matthews",
    "jc": "Jenny Kirk",
    "kd": "Kieran Duffy",
    "ls": "Lenny Summers",
    "sg": "Susan Grimshaw",
    "sm": "Sean MacGuire",
}

# cat -> metadatos. El orden de este dict fija el orden del panel lateral.
CATEGORIES = {
    "sp_dino_bones": {
        "label": "Huesos de dinosaurio", "group": "Coleccionables",
        "color": "#d8c38a", "icon": "bone", "track": True, "minZoom": 2,
        "singular": "Hueso de dinosaurio",
    },
    "sp_dreamcatchers": {
        "label": "Atrapasueños", "group": "Coleccionables",
        "color": "#c78bd4", "icon": "dreamcatcher", "track": True, "minZoom": 2,
        "singular": "Atrapasueños",
    },
    "sp_rock_carvings": {
        "label": "Petroglifos", "group": "Coleccionables",
        "color": "#a98b6f", "icon": "carving", "track": True, "minZoom": 2,
        "singular": "Petroglifo",
    },
    "sp_graves": {
        "label": "Tumbas", "group": "Coleccionables",
        "color": "#9aa0a6", "icon": "grave", "track": True, "minZoom": 2,
        "singular": "Tumba",
    },
    "sp_orchids": {
        "label": "Orquídeas exóticas", "group": "Coleccionables",
        "color": "#e06fa8", "icon": "orchid", "track": True, "minZoom": 4,
        "singular": "Orquídea",
    },
    "sp_alligator_eggs": {
        "label": "Huevos de aligátor", "group": "Coleccionables",
        "color": "#b6c96a", "icon": "egg", "track": True, "minZoom": 2,
        "singular": "Huevos de aligátor",
    },
    "sp_wilderness_chests": {
        "label": "Cofres salvajes", "group": "Coleccionables",
        "color": "#d4a94f", "icon": "chest", "track": True, "minZoom": 4,
        "singular": "Cofre salvaje",
    },
    "sp_crayfish_holes": {
        "label": "Madrigueras de cangrejo", "group": "Coleccionables",
        "color": "#c96f5a", "icon": "crayfish", "track": True, "minZoom": 2,
        "singular": "Madriguera de cangrejo",
    },
    "ign_cigarette_cards": {
        "label": "Naipes de cigarrillos", "group": "Coleccionables",
        "color": "#7fb2e5", "icon": "card", "track": True, "minZoom": 4,
    },
    "ign_hats": {
        "label": "Sombreros", "group": "Coleccionables",
        "color": "#b98a5e", "icon": "hat", "track": True, "minZoom": 2,
    },
    "ign_weapons": {
        "label": "Armas únicas", "group": "Coleccionables",
        "color": "#8fa3b8", "icon": "weapon", "track": True, "minZoom": 2,
    },
    "ign_rare_items": {
        "label": "Objetos raros", "group": "Coleccionables",
        "color": "#59c3b8", "icon": "gem", "track": True, "minZoom": 2,
    },
    "ign_treasure_maps": {
        "label": "Mapas del tesoro", "group": "Coleccionables",
        "color": "#e0c26a", "icon": "map", "track": True, "minZoom": 2,
    },
    "ign_treasures": {
        "label": "Tesoros", "group": "Coleccionables",
        "color": "#f0a64a", "icon": "treasure", "track": True, "minZoom": 2,
    },
    "ign_legendary_animals": {
        "label": "Animales legendarios", "group": "Coleccionables",
        "color": "#d96b4a", "icon": "paw", "track": True, "minZoom": 2,
    },
    "ign_legendary_fish": {
        "label": "Peces legendarios", "group": "Coleccionables",
        "color": "#4fa3d9", "icon": "fish", "track": True, "minZoom": 2,
    },
    "plants": {
        "label": "Hierbas y plantas", "group": "Recursos",
        "color": "#5fae62", "icon": "leaf", "track": False, "minZoom": 4,
    },
    "ign_poi": {
        "label": "Lugares de interés", "group": "Lugares",
        "color": "#b58cd9", "icon": "eye", "track": False, "minZoom": 4,
    },
}

GROUP_ORDER = ["Coleccionables", "Recursos", "Lugares"]


def download_cached(key, url):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, key + ".json")
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        print("Descargando %s ..." % url)
        req = urllib.request.Request(url, headers={"User-Agent": "rdr2map-builder/1.0"})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
            f.write(r.read())
    with open(path, "rb") as f:
        return json.load(f)


def name_from_text(text, singular):
    m = re.search(r"(\d+)\s*$", text or "")
    return "%s %02d" % (singular, int(m.group(1))) if m else singular


def build_singleplayer(sp):
    out = []
    for cat in sp:
        key = cat["key"]
        if key.startswith("sp_orchid_"):
            cat_key = "sp_orchids"
            label = "Orquídea " + ORCHID_ES.get(key, key.replace("sp_orchid_", "").replace("_", " "))
        elif key in CATEGORIES:
            cat_key = key
            label = CATEGORIES[key]["singular"]
        else:
            print("  (omitida categoría sin definir: %s)" % key)
            continue
        for i, loc in enumerate(cat["locations"]):
            text = loc.get("text") or ""
            if key == "sp_orchid_":
                pass
            if key == "sp_graves":
                ini = text.replace("sp_grave_", "")
                name = "Tumba de " + GRAVE_ES.get(ini, ini.upper())
            elif key.startswith("sp_orchid_"):
                name = "%s %02d" % (label, i + 1)
            else:
                name = name_from_text(text, label)
            out.append({
                "id": "%s:%s:%02d" % (cat_key, text, i),
                "cat": cat_key,
                "name": name,
                "sub": label if cat_key == "sp_orchids" else "",
                "lat": round(float(loc["x"]), 4),
                "lng": round(float(loc["y"]), 4),
                "src": "rdomap",
            })
    return out


def build_plants(plants):
    out = []
    for p in plants:
        key = p["key"]
        label = PLANT_ES.get(key, key.replace("_", " ").title())
        for i, loc in enumerate(p["locations"]):
            out.append({
                "id": "plants:%s:%04d" % (key, i),
                "cat": "plants",
                "name": label,
                "sub": label,
                "lat": round(float(loc["x"]), 4),
                "lng": round(float(loc["y"]), 4),
                "src": "rdomap",
            })
    return out


IGN_MAP = {
    "Cigarette Card": "ign_cigarette_cards",
    "Hat": "ign_hats",
    "Weapon": "ign_weapons",
    "Rare Item": "ign_rare_items",
    "Treasure Map": "ign_treasure_maps",
    "Treasure": "ign_treasures",
    "Point of Interest": "ign_poi",
}


def build_ign(markers):
    out = []
    seen = set()
    for m in markers:
        data = m.get("data") or {}
        mtype = data.get("markerType")
        sub = (data.get("markerSubType") or "").strip()
        note = (data.get("markerDescription") or "").strip()

        if mtype == "Animal":
            if not sub.lower().startswith("legendary"):
                continue
            cat = "ign_legendary_animals"
            name = sub
        elif mtype == "Fish":
            if not sub.lower().startswith("legendary"):
                continue
            cat = "ign_legendary_fish"
            name = sub
        elif mtype in IGN_MAP:
            cat = IGN_MAP[mtype]
            name = sub
        else:
            continue

        if cat == "ign_cigarette_cards":
            name = re.sub(r"\s+Card$", "", name).strip()
            name = "Naipe: " + name
        if not name:
            name = CATEGORIES[cat]["label"].rstrip("s")

        lat = round(float(m["lat"]) / IGN_SCALE, 4)
        lng = round(float(m["lng"]) / IGN_SCALE, 4)
        dedupe = (cat, name, round(lat, 2), round(lng, 2))
        if dedupe in seen:
            continue
        seen.add(dedupe)

        uid = data.get("uid") or "%d" % len(out)
        out.append({
            "id": "%s:%s" % (cat, uid),
            "cat": cat,
            "name": name,
            "sub": sub if cat == "ign_cigarette_cards" else "",
            "note": note,
            "lat": lat,
            "lng": lng,
            "src": "ign",
        })
    return out


def apply_translations(markers):
    """Traduce nombres y notas al español conservando el original en *En."""
    path = os.path.join(DATA, "translations_es.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            tr = json.load(f)
    except (OSError, ValueError):
        return markers
    names = tr.get("names") or {}
    notes = tr.get("notes") or {}
    for m in markers:
        en = m.get("name")
        es = names.get(en)
        if es and es != en:
            m["nameEn"] = en
            m["name"] = es
        en = m.get("note") or ""
        es = notes.get(en)
        if es and es != en:
            m["noteEn"] = en
            m["note"] = es
    return markers


def main():
    os.makedirs(DATA, exist_ok=True)
    sp = download_cached("singleplayer", SOURCES["singleplayer"])
    plants = download_cached("plants", SOURCES["plants"])
    ign = download_cached("ign", SOURCES["ign"])

    markers = build_singleplayer(sp) + build_plants(plants) + build_ign(ign)

    # Sanea duplicados exactos de id y ordena por categoría.
    seen = set()
    clean = []
    for m in markers:
        if m["id"] in seen:
            continue
        seen.add(m["id"])
        clean.append(m)
    order = {c: i for i, c in enumerate(CATEGORIES)}
    clean.sort(key=lambda m: (order.get(m["cat"], 99), m["lat"], m["lng"]))
    clean = apply_translations(clean)

    counts = {}
    for m in clean:
        counts[m["cat"]] = counts.get(m["cat"], 0) + 1

    cats_out = {}
    for key, meta in CATEGORIES.items():
        if key not in counts:
            continue
        c = dict(meta)
        c["count"] = counts[key]
        cats_out[key] = c

    with open(os.path.join(DATA, "categories.json"), "w", encoding="utf-8") as f:
        json.dump({"groups": GROUP_ORDER, "categories": cats_out}, f,
                  ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, "markers.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "markers": clean}, f,
                  ensure_ascii=False, separators=(",", ":"))

    print("\nTotal: %d marcadores" % len(clean))
    for key in cats_out:
        print("  %-26s %5d" % (key, counts[key]))
    print("Escrito en %s" % DATA)


if __name__ == "__main__":
    sys.exit(main())
