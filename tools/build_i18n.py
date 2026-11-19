#!/usr/bin/env python3
"""Genera data/i18n_en.json con los nombres y notas del mapa en inglés.

Los marcadores y las categorías están guardados en español. Este script
construye la capa inglesa a partir de los campos `nameEn`/`noteEn` que ya
trae markers.json y de unas tablas de traducción para las categorías cuyos
nombres no incluyen el original inglés (hierbas, orquídeas, tumbas, naipes
y cofres numerados).

Uso:
    python tools/build_i18n.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

GROUPS_EN = {
    "Coleccionables": "Collectibles",
    "Recursos": "Resources",
    "Lugares": "Places",
}

CATEGORIES_EN = {
    "sp_dino_bones": ("Dinosaur Bones", "Dinosaur Bone"),
    "sp_dreamcatchers": ("Dreamcatchers", "Dreamcatcher"),
    "sp_rock_carvings": ("Rock Carvings", "Rock Carving"),
    "sp_graves": ("Graves", "Grave"),
    "sp_orchids": ("Exotic Orchids", "Orchid"),
    "sp_alligator_eggs": ("Alligator Eggs", "Alligator Egg"),
    "sp_wilderness_chests": ("Wilderness Chests", "Wilderness Chest"),
    "sp_crayfish_holes": ("Crayfish Holes", "Crayfish Hole"),
    "ign_cigarette_cards": ("Cigarette Cards", "Cigarette Card"),
    "ign_hats": ("Hats", "Hat"),
    "ign_weapons": ("Unique Weapons", "Unique Weapon"),
    "ign_rare_items": ("Rare Items", "Rare Item"),
    "ign_treasure_maps": ("Treasure Maps", "Treasure Map"),
    "ign_treasures": ("Treasures", "Treasure"),
    "ign_legendary_animals": ("Legendary Animals", "Legendary Animal"),
    "ign_legendary_fish": ("Legendary Fish", "Legendary Fish"),
    "plants": ("Herbs & Plants", "Herb"),
    "ign_poi": ("Points of Interest", "Point of Interest"),
}

PLANTS_EN = {
    "Algodoncillo": "Milkweed",
    "Amapola de pradera": "Prairie Poppy",
    "Arándano perenne": "Evergreen Huckleberry",
    "Baya de gaulteria": "Wintergreen Berry",
    "Boleto de bahía": "Bay Bolete",
    "Cabeza de carnero": "Ram's Head",
    "Campanilla violeta": "Violet Snowdrop",
    "Flor de vainilla": "Vanilla Flower",
    "Frambuesa roja": "Red Raspberry",
    "Ginseng americano": "American Ginseng",
    "Ginseng de Alaska": "Alaskan Ginseng",
    "Grosella dorada": "Golden Currant",
    "Grosella negra": "Black Currant",
    "Harrietum": "Harrietum",
    "Junco común": "Common Bulrush",
    "Macis inglés": "English Mace",
    "Matricaria silvestre": "Wild Feverfew",
    "Menta silvestre": "Wild Mint",
    "Milenrama": "Yarrow",
    "Mora negra": "Blackberry",
    "Orégano": "Oregano",
    "Raíz de bardana": "Burdock Root",
    "Rebozuelos": "Chanterelle",
    "Salvia adelfa": "Oleander Sage",
    "Salvia colibrí": "Hummingbird Sage",
    "Salvia del desierto": "Desert Sage",
    "Salvia roja": "Red Sage",
    "Seta parasol": "Parasol Mushroom",
    "Tabaco indio": "Indian Tobacco",
    "Tomillo rastrero": "Creeping Thyme",
    "Zanahorias silvestres": "Wild Carrots",
}

ORCHIDS_EN = {
    "Araña": "Spider Orchid",
    "Boca de dragón": "Dragon's Mouth Orchid",
    "Cigarro": "Cigar Orchid",
    "Cola de rata": "Rat Tail Orchid",
    "Concha de almeja": "Clamshell Orchid",
    "Dama de la noche": "Lady of the Night Orchid",
    "De la reina": "Queen's Orchid",
    "Estrella de Acuña": "Acuna's Star Orchid",
    "Fantasma": "Ghost Orchid",
    "Flor de mocasín": "Moccasin Flower Orchid",
    "Huevo de gorrión": "Sparrow's Egg Orchid",
    "Perfumada nocturna": "Night Scented Orchid",
    "Zapatilla de dama": "Lady Slipper Orchid",
}

# Correcciones puntuales de `nameEn` que venían en español o incompletos.
NAME_OVERRIDES = {
    "Mapas del tesoro": "Treasure Map",
    "Objetos raro": "Rare Item",
    "Tesoro": "Treasure",
}

NUM_SUFFIX = re.compile(r"^(.*?)\s+(\d+)$")
ORCHID = re.compile(r"^Orquídea (.+?) (\d+)$")


def marker_name_en(m):
    cat = m["cat"]
    es = m["name"]
    en = m.get("nameEn")

    if cat == "plants":
        return PLANTS_EN[es] if es in PLANTS_EN else (en or es)

    if cat == "sp_orchids":
        hit = ORCHID.match(es)
        if hit and hit.group(1) in ORCHIDS_EN:
            return ORCHIDS_EN[hit.group(1)] + " " + hit.group(2)
        return en or es

    if cat == "sp_graves":
        who = es[len("Tumba de "):] if es.startswith("Tumba de ") else es
        # Genitivo sajón: "Summers' Grave" frente a "Morgan's Grave".
        return who + ("' Grave" if who.endswith("s") else "'s Grave")

    if cat == "ign_cigarette_cards":
        tail = m.get("sub") or ""
        if en and en.startswith("Naipe:"):
            tail = en[len("Naipe:"):].strip()
        if not tail:
            tail = es[len("Naipe:"):].strip() if es.startswith("Naipe:") else es
        return "Cigarette Card: " + tail

    if cat in ("sp_alligator_eggs", "sp_crayfish_holes"):
        return CATEGORIES_EN[cat][0]

    if cat in ("sp_dino_bones", "sp_dreamcatchers", "sp_rock_carvings",
               "sp_wilderness_chests"):
        singular = CATEGORIES_EN[cat][1]
        hit = NUM_SUFFIX.match(es)
        if hit:
            return singular + " " + hit.group(2)
        return singular

    if en:
        return NAME_OVERRIDES.get(en, en)

    # Último recurso: singular inglés + número final si lo hay.
    singular = CATEGORIES_EN.get(cat, ("", es))[1]
    hit = NUM_SUFFIX.match(es)
    return (singular + " " + hit.group(2)) if hit else singular


def main():
    with open(os.path.join(DATA, "markers.json"), encoding="utf-8") as fh:
        markers = json.load(fh)["markers"]

    names = {}
    notes = {}
    missing = 0
    for m in markers:
        name = marker_name_en(m)
        if not name:
            missing += 1
            continue
        names[m["id"]] = name
        note = m.get("noteEn") or m.get("note") or ""
        if note:
            notes[m["id"]] = note

    payload = {
        "version": 1,
        "groups": GROUPS_EN,
        "categories": {
            key: {"label": label, "singular": singular}
            for key, (label, singular) in CATEGORIES_EN.items()
        },
        "names": names,
        "notes": notes,
    }

    out = os.path.join(DATA, "i18n_en.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")

    size = os.path.getsize(out)
    print("escrito %s (%d nombres, %d notas, %.0f KB)" %
          (out, len(names), len(notes), size / 1024))
    if missing:
        print("AVISO: %d marcadores sin nombre en inglés" % missing)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
