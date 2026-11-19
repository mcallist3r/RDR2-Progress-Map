#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Conversión de coordenadas del mundo de RDR2 al espacio del mapa Leaflet.

Las mismas constantes que usa jeanropke/RDOMap en su función gameToMap:
    lat = 0.01552 * y - 63.6
    lng = 0.01552 * x + 111.29
1 unidad de latlng equivale a ~64,4 unidades del juego (metros).
"""
LAT_SCALE = 0.01552
LAT_OFFSET = -63.6
LNG_OFFSET = 111.29


def game_to_latlng(x, y):
    return (
        round(LAT_SCALE * float(y) + LAT_OFFSET, 4),
        round(LAT_SCALE * float(x) + LNG_OFFSET, 4),
    )


def latlng_to_game(lat, lng):
    return (
        (float(lng) - LNG_OFFSET) / LAT_SCALE,
        (float(lat) - LAT_OFFSET) / LAT_SCALE,
    )
