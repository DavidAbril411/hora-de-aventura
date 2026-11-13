#!/usr/bin/env python3
"""Guiones de las narraciones que faltan grabar.

Escribe un .txt por cada pantalla de src/data/historia.json que tiene texto y
no tiene narración, con el texto tal cual se ve en pantalla. El nombre del
archivo es el que tiene que llevar el audio:

  narracion-p03-dia-jp-roberto.txt  ->  narracion-p03-dia-jp-roberto.m4a

Cuando el audio tratado está en public/audio/ con ese nombre,
scripts/sincronizar-narracion.py lo da de alta y calcula sus tiempos.

Uso:
  python3 scripts/guiones-narracion.py <carpeta de salida>
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    salida = Path(sys.argv[1])
    salida.mkdir(parents=True, exist_ok=True)
    historia = json.loads((RAIZ / "src" / "data" / "historia.json").read_text())
    for pantalla in historia["pantallas"]:
        if pantalla.get("narracion") or not pantalla.get("texto"):
            continue
        parrafos = [b if isinstance(b, str) else b["texto"] for b in pantalla["texto"]]
        archivo = salida / f"narracion-{pantalla['id']}.txt"
        archivo.write_text("\n\n".join(parrafos) + "\n")
        dupla = historia["duplas"][pantalla["dupla"]]["nombre"] if pantalla.get("dupla") else "todas las duplas"
        palabras = sum(len(p.split()) for p in parrafos)
        print(f"{archivo.name}: pantalla {pantalla['numero']}, {pantalla['titulo']} ({dupla}), {palabras} palabras")
    return 0


if __name__ == "__main__":
    sys.exit(main())
