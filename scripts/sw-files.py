#!/usr/bin/env python3
"""Actualiza la lista de archivos que app/sw.js guarda para funcionar sin internet.

Pone en FILES todos los archivos de la app y en VERSION una huella de su
contenido: cada publicación con cambios renueva la copia guardada en los
teléfonos. Lo corre la acción de GitHub Pages antes de publicar; también se
puede correr a mano desde la raíz del repositorio:  python3 scripts/sw-files.py
"""
import glob, hashlib, os, re, sys

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app")
os.chdir(APP)
files = ["./", "index.html", "manifest.webmanifest"] + sorted(
    glob.glob("css/*.css") + glob.glob("js/*.js") + glob.glob("fonts/*.woff2")
    + glob.glob("vendor/*.js") + glob.glob("icons/*"))
h = hashlib.sha1()
for f in files[1:]:
    with open(f, "rb") as fh:
        h.update(f.encode() + fh.read())
src = open("sw.js", encoding="utf-8").read()
src = re.sub(r'FILES=\[.*?\n\];', "FILES=[\n" + ",\n".join(f'    "{f}"' for f in files) + "\n];", src, flags=re.S)
src = re.sub(r'VERSION="[^"]*"', f'VERSION="tt-{h.hexdigest()[:10]}"', src)
open("sw.js", "w", encoding="utf-8").write(src)
# cada script y hoja de estilo del index debe estar en la lista
idx = open("index.html", encoding="utf-8").read()
missing = [m for m in re.findall(r'(?:src|href)="((?:js|vendor|css)/[^"]+)"', idx) if m not in files]
if missing:
    sys.exit(f"Faltan en la lista: {missing}")
print(f"sw.js: {len(files)} archivos, versión tt-{h.hexdigest()[:10]}")
