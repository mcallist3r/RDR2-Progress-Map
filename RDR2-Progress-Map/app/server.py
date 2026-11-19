#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Servidor local del mapa de progreso de RDR2 (solo stdlib).

Arranque normal (lo hace Start.bat):
    python app/server.py

Rutas:
    /                     web/index.html
    /tiles/<estilo>/...   assets/tiles/<estilo>/...
    /data/...             data/...
    /api/saves            partidas detectadas
    /api/progress?save=   progreso por partida (GET/POST)
    /api/config           configuración (GET/POST)
    /api/live             posición en vivo del mod
    /api/status           estado de tiles y datos
"""
import argparse
import json
import os
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import config
import coords
import progress
import saves

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
DATA = os.path.join(ROOT, "data")
TILES = os.path.join(ROOT, "assets", "tiles")
LIVE_DEFAULT = os.path.join(ROOT, "live.json")

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
}


def live_paths():
    paths = []
    base = os.environ.get("LOCALAPPDATA")
    if base:
        paths.append(os.path.join(base, "RDR2ProgressMap", "live.json"))
    paths.append(LIVE_DEFAULT)
    return paths


def read_live():
    # Puede haber dos archivos (el del mod y el de pruebas): vale el más reciente.
    candidates = []
    for path in live_paths():
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                ts = data.get("ts")
                if ts is not None and ts > 1e12:  # epoch en milisegundos
                    ts = ts / 1000.0
                candidates.append((ts if isinstance(ts, (int, float)) else 0, data))
        except (OSError, ValueError):
            continue
    if not candidates:
        return {"online": False}
    candidates.sort(key=lambda pair: pair[0], reverse=True)
    ts, data = candidates[0]
    now = time.time()
    age = None
    if isinstance(ts, (int, float)) and ts:
        age = max(0.0, now - ts)
    online = age is not None and age < 5
    out = {"online": online, "age": round(age, 1) if age is not None else None}
    for key in ("x", "y", "z", "heading", "ts"):
        if key in data:
            out[key] = data[key]
    if online and "x" in out and "y" in out:
        lat, lng = coords.game_to_latlng(out["x"], out["y"])
        out["lat"], out["lng"] = lat, lng
    return out


def tile_stats():
    count = 0
    styles = []
    if os.path.isdir(TILES):
        for style in sorted(os.listdir(TILES)):
            sdir = os.path.join(TILES, style)
            if not os.path.isdir(sdir):
                continue
            n = 0
            for _dirpath, _dirs, files in os.walk(sdir):
                n += sum(1 for f in files if f.endswith(".webp"))
            if n:
                styles.append(style)
                count += n
    return count, styles


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "RDR2Map/1.0"

    # ---------- utilidades ----------
    def _send(self, status, body, ctype, cache="no-store"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", cache)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            pass

    def json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def error_json(self, status, message):
        self.json({"error": message}, status)

    def body_json(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 8 * 1024 * 1024:
            raise ValueError("cuerpo inválido")
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    # ---------- HTTP ----------
    def do_GET(self):
        self.route("GET")

    def do_HEAD(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")

    def route(self, method):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)
        query = urllib.parse.parse_qs(parsed.query)
        try:
            if path.startswith("/api/"):
                self.api(method, path, query)
            elif method == "GET":
                self.static(path)
            else:
                self.error_json(405, "método no permitido")
        except Exception as exc:  # noqa: BLE001
            if os.environ.get("RDR2MAP_DEBUG"):
                import traceback
                traceback.print_exc()
            self.error_json(500, "error interno: %s" % exc)

    def api(self, method, path, query):
        if path == "/api/status" and method == "GET":
            count, styles = tile_stats()
            return self.json({
                "tiles": count,
                "styles": styles,
                "markers": count_markers(),
                "saves": len(saves.list_saves()),
                "version": "1.0",
            })
        if path == "/api/saves" and method == "GET":
            items = saves.list_saves()
            cfg = config.load()
            return self.json({
                "saves": items,
                "active": cfg.get("activeSave"),
                "profiles": sorted({s["profile"] for s in items}),
            })
        if path == "/api/progress":
            slot = (query.get("save") or ["default"])[0]
            if not progress.valid_slot(slot):
                return self.error_json(400, "slot inválido")
            if method == "GET":
                return self.json(progress.load(slot))
            if method == "POST":
                body = self.body_json()
                data = progress.save(slot, body.get("done") or {},
                                     body.get("notes") or {})
                return self.json({"ok": True, "slot": slot,
                                  "count": len(data["done"]),
                                  "updated": data["updated"]})
        if path == "/api/config":
            if method == "GET":
                return self.json({"config": config.load()})
            if method == "POST":
                body = self.body_json()
                if not isinstance(body, dict):
                    return self.error_json(400, "config inválida")
                allowed = {k: body[k] for k in ("activeSave", "prefs")
                           if k in body}
                return self.json({"config": config.update(allowed)})
        if path == "/api/live" and method == "GET":
            return self.json(read_live())
        self.error_json(404, "ruta api desconocida")

    def static(self, path):
        if path.startswith("/tiles/"):
            base, rel = TILES, path[len("/tiles/"):]
            cache = "public, max-age=31536000, immutable"
        elif path.startswith("/data/"):
            base, rel = DATA, path[len("/data/"):]
            cache = "no-cache"
        elif path.startswith("/assets/"):
            base, rel = os.path.join(ROOT, "assets"), path[len("/assets/"):]
            cache = "public, max-age=86400"
        else:
            base, rel = WEB, path.lstrip("/") or "index.html"
            cache = "no-cache"

        base_real = os.path.realpath(base)
        target = os.path.realpath(os.path.join(base_real, rel))
        if not target.startswith(base_real + os.sep) and target != base_real:
            return self.error_json(403, "ruta no permitida")
        if os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not os.path.isfile(target):
            if path in ("/", "/index.html"):
                return self.error_json(500, "falta web/index.html")
            return self.error_json(404, "no encontrado: %s" % path)

        ctype = MIME.get(os.path.splitext(target)[1].lower(),
                         "application/octet-stream")
        try:
            with open(target, "rb") as f:
                body = f.read()
        except OSError as exc:
            return self.error_json(500, "no se pudo leer: %s" % exc)
        self._send(200, body, ctype, cache)

    def log_message(self, fmt, *args):
        if os.environ.get("RDR2MAP_DEBUG"):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def count_markers():
    try:
        with open(os.path.join(DATA, "markers.json"), "r", encoding="utf-8") as f:
            return len(json.load(f).get("markers", []))
    except (OSError, ValueError):
        return 0


def find_server(host, start_port):
    for port in range(start_port, start_port + 20):
        try:
            return ThreadingHTTPServer((host, port), Handler), port
        except OSError:
            continue
    raise SystemExit("No hay puerto libre entre %d y %d" %
                     (start_port, start_port + 19))


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8790)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    httpd, port = find_server("127.0.0.1", args.port)
    httpd.daemon_threads = True
    url = "http://127.0.0.1:%d/" % port
    print("=" * 58)
    print("  RDR2 · Mapa de progreso")
    print("  %s" % url)
    print("  Cierra esta ventana (o pulsa Ctrl+C) para detenerlo.")
    print("=" * 58, flush=True)

    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDetenido.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
