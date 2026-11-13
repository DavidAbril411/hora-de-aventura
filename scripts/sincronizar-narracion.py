#!/usr/bin/env python3
"""Tiempos de las narraciones para que los subtítulos avancen con la voz.

Para cada narración de src/data/historia.json:
  1. Whisper (faster-whisper) transcribe el audio con el tiempo de cada palabra.
  2. La transcripción se alinea con el texto que se ve en pantalla.
  3. En historia.json queda "tiempos": el segundo en que empieza cada palabra
     del texto, en orden y separados por espacios.

También da de alta las narraciones nuevas: si existe
public/audio/narracion-<id de pantalla>.m4a y esa pantalla no tiene narración,
la anota en "audios" y en la pantalla. Los audios nuevos pasan antes por
scripts/procesar-audio.sh, como todo el material.

Uso:
  python3 scripts/sincronizar-narracion.py              # todas las narraciones
  python3 scripts/sincronizar-narracion.py p03-dia-jp-roberto jp-roberto
  python3 scripts/sincronizar-narracion.py --verificar  # no escribe; falla si algo quedó viejo

Necesita ffmpeg y faster-whisper (una sola vez):
  python3 -m venv .venv-narracion && .venv-narracion/bin/pip install faster-whisper
  .venv-narracion/bin/python scripts/sincronizar-narracion.py

Si el texto de una pantalla cambia, hay que volver a correrlo: los tiempos van
palabra por palabra. Cuando la voz no dice el texto tal cual (las narraciones
de las duplas son adaptaciones), los tramos que no coinciden se reparten entre
las palabras que sí, y el script avisa cuánto coincidió.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
HISTORIA = RAIZ / "src" / "data" / "historia.json"
PUBLICO = RAIZ / "public"
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "hora-de-aventura" / "transcripciones"
# Por debajo de esto, la voz y el texto se parecen poco y conviene escuchar el resultado.
COINCIDENCIA_MINIMA = 0.8


def normalizar(palabra: str) -> str:
    sin_tildes = "".join(c for c in unicodedata.normalize("NFD", palabra.lower()) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", sin_tildes)


def palabras_del_texto(bloques: list) -> list[str]:
    """Las palabras tal como las cuenta el motor: cada bloque partido por espacios."""
    texto = " ".join(b if isinstance(b, str) else b["texto"] for b in bloques)
    return texto.split()


def transcribir(audio: Path, modelo: str) -> dict:
    """Palabras de la voz con su tiempo. Se guarda en caché según el contenido del audio."""
    huella = hashlib.sha1(audio.read_bytes()).hexdigest()[:16]
    guardado = CACHE / f"{huella}-{modelo}.json"
    if guardado.exists():
        return json.loads(guardado.read_text())
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Falta faster-whisper. Ver las instrucciones al principio de este archivo.")
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    muestras = np.frombuffer(pcm, dtype=np.float32)
    global _modelo
    if _modelo is None or _modelo[0] != modelo:
        _modelo = (modelo, WhisperModel(modelo, device="cpu", compute_type="int8"))
    tramos, _ = _modelo[1].transcribe(
        muestras, language="es", word_timestamps=True, beam_size=5, condition_on_previous_text=False
    )
    resultado = {
        "duracion": round(len(muestras) / 16000, 2),
        "palabras": [
            {"p": p.word.strip(), "i": round(p.start, 2), "f": round(p.end, 2)} for tramo in tramos for p in tramo.words
        ],
    }
    CACHE.mkdir(parents=True, exist_ok=True)
    guardado.write_text(json.dumps(resultado, ensure_ascii=False))
    return resultado


_modelo = None


def alinear(texto: list[str], voz: dict) -> tuple[list[float], float]:
    """El segundo en que empieza cada palabra del texto, y qué parte del texto coincidió con la voz."""
    dichas = [p for p in voz["palabras"] if normalizar(p["p"])]
    a = [normalizar(p) for p in texto]
    b = [normalizar(p["p"]) for p in dichas]
    tiempos: list[float | None] = [None] * len(a)
    pareja: list[int | None] = [None] * len(a)
    bloques = difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks()
    for bloque in bloques:
        # Una coincidencia suelta de una palabra corta ("y", "de") no es un ancla confiable.
        if bloque.size == 1 and len(a[bloque.a]) <= 3:
            continue
        for k in range(bloque.size):
            pareja[bloque.a + k] = bloque.b + k
            tiempos[bloque.a + k] = dichas[bloque.b + k]["i"]
    coincidencia = sum(1 for p, n in zip(pareja, a) if p is not None) / max(1, sum(1 for n in a if n))

    # Los tramos sin ancla: si de los dos lados hay la misma cantidad de palabras,
    # van de a una (la voz dijo otra palabra); si no, se reparten según su largo.
    i = 0
    while i < len(a):
        if tiempos[i] is not None:
            i += 1
            continue
        j = i
        while j < len(a) and tiempos[j] is None:
            j += 1
        antes = pareja[i - 1] if i > 0 else None
        despues = pareja[j] if j < len(a) else None
        desde_voz = antes + 1 if antes is not None else 0
        hasta_voz = despues if despues is not None else len(dichas)
        if hasta_voz - desde_voz == j - i:
            for k in range(j - i):
                tiempos[i + k] = dichas[desde_voz + k]["i"]
        else:
            if hasta_voz > desde_voz:
                inicio = dichas[desde_voz]["i"]
            else:
                inicio = dichas[antes]["f"] if antes is not None else 0.0
            fin = dichas[despues]["i"] if despues is not None else (dichas[-1]["f"] if dichas else voz["duracion"])
            fin = max(fin, inicio)
            largos = [len(p) + 1 for p in texto[i:j]]
            recorrido = 0
            for k in range(j - i):
                tiempos[i + k] = inicio + (fin - inicio) * recorrido / sum(largos)
                recorrido += largos[k]
        i = j

    # Nunca hacia atrás.
    salida: list[float] = []
    for t in tiempos:
        salida.append(round(max(t or 0.0, salida[-1] if salida else 0.0), 2))
    return salida, coincidencia


def con_clave_despues(objeto: dict, despues_de: str, clave: str, valor) -> dict:
    """Devuelve el objeto con `clave` ubicada justo después de `despues_de`."""
    nuevo = {}
    for k, v in objeto.items():
        if k != clave:
            nuevo[k] = v
        if k == despues_de:
            nuevo[clave] = valor
    if clave not in nuevo:
        nuevo[clave] = valor
    return nuevo


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("ids", nargs="*", help="ids de pantallas o de duplas (por defecto, todas)")
    parser.add_argument("--modelo", default="medium", help="modelo de Whisper (por defecto, medium)")
    parser.add_argument("--verificar", action="store_true", help="no escribe: falla si historia.json quedaría distinto")
    args = parser.parse_args()

    original = HISTORIA.read_text()
    historia = json.loads(original)
    audios = historia["audios"]
    flojas = []

    # Narraciones nuevas: el archivo se llama como la pantalla.
    for n, pantalla in enumerate(historia["pantallas"]):
        id_audio = f"narracion-{pantalla['id']}"
        if pantalla.get("narracion") or not pantalla.get("texto"):
            continue
        if not (PUBLICO / "audio" / f"{id_audio}.m4a").exists():
            continue
        audios[id_audio] = {
            "src": f"audio/{id_audio}.m4a",
            "tipo": "narracion",
            "descripcion": f"Narración de la pantalla {pantalla['numero']} ({pantalla['id']})",
        }
        historia["pantallas"][n] = con_clave_despues(pantalla, "texto", "narracion", id_audio)
        print(f"+ {pantalla['id']}: narración nueva, {id_audio}.m4a")

    def sincronizar(nombre: str, dueno: dict, bloques: list) -> dict:
        id_audio = dueno.get("narracion")
        if not id_audio or (args.ids and nombre not in args.ids):
            return dueno
        datos = audios.get(id_audio)
        if not datos or datos.get("pendiente"):
            return dueno
        archivo = PUBLICO / datos["src"]
        if not archivo.exists():
            print(f"! {nombre}: no está {datos['src']}")
            return dueno
        texto = palabras_del_texto(bloques)
        voz = transcribir(archivo, args.modelo)
        tiempos, coincidencia = alinear(texto, voz)
        aviso = "" if coincidencia >= COINCIDENCIA_MINIMA else "  (la voz no dice el texto tal cual: tiempos aproximados)"
        if aviso:
            flojas.append(nombre)
        print(f"  {nombre}: {len(texto)} palabras, {voz['duracion']:.1f} s, coincide {coincidencia:.0%}{aviso}")
        return con_clave_despues(dueno, "narracion", "tiempos", " ".join(f"{t:.2f}" for t in tiempos))

    for id_dupla, dupla in list(historia["duplas"].items()):
        historia["duplas"][id_dupla] = sincronizar(id_dupla, dupla, dupla["presentacion"])
    for n, pantalla in enumerate(historia["pantallas"]):
        historia["pantallas"][n] = sincronizar(pantalla["id"], pantalla, pantalla.get("texto", []))

    nuevo = json.dumps(historia, ensure_ascii=False, indent=2) + "\n"
    if args.verificar:
        if nuevo != original:
            print("historia.json no está al día: correr scripts/sincronizar-narracion.py")
            return 1
        print("historia.json está al día.")
        return 0
    if nuevo != original:
        HISTORIA.write_text(nuevo)
        print("historia.json actualizado.")
    else:
        print("Sin cambios.")
    if flojas:
        print("Para escuchar con atención: " + ", ".join(flojas))
    return 0


if __name__ == "__main__":
    sys.exit(main())
