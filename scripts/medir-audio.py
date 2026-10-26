#!/usr/bin/env python3
"""Mide audios para el informe de calidad.

Uso:
    python3 scripts/medir-audio.py archivo1 [archivo2 ...] > medidas.csv

Por archivo: duración, LUFS integrado y pico real (filtro ebur128 de ffmpeg),
piso de ruido y nivel de voz (percentiles 5 y 95 del RMS en ventanas de 50 ms),
y silencio al principio y al final (primer y último instante 30 dB por debajo
del nivel de voz).
"""
import csv
import re
import subprocess
import sys

import numpy as np

SR = 48000
VENTANA = int(0.05 * SR)


def ebur128(ruta):
    salida = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-i", ruta, "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr
    resumen = salida[salida.rfind("Summary:"):]
    lufs = float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", resumen).group(1))
    pico = float(re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", resumen).group(1))
    return lufs, pico


def muestras(ruta):
    crudo = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", "-i", ruta,
         "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(crudo, dtype=np.float32)


def medir(ruta):
    x = muestras(ruta)
    duracion = len(x) / SR
    n = len(x) // VENTANA
    rms = np.sqrt(np.mean(x[: n * VENTANA].reshape(n, VENTANA) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    piso = float(np.percentile(db, 5))
    voz = float(np.percentile(db, 95))
    activas = np.nonzero(db > voz - 30)[0]
    sil_ini = activas[0] * VENTANA / SR if len(activas) else duracion
    sil_fin = duracion - (activas[-1] + 1) * VENTANA / SR if len(activas) else 0.0
    lufs, pico = ebur128(ruta)
    return {
        "archivo": ruta,
        "duracion_s": round(duracion, 2),
        "lufs": lufs,
        "pico_dbtp": pico,
        "piso_ruido_db": round(piso, 1),
        "nivel_voz_db": round(voz, 1),
        "relacion_voz_ruido_db": round(voz - piso, 1),
        "silencio_inicio_s": round(sil_ini, 2),
        "silencio_final_s": round(sil_fin, 2),
    }


def main():
    filas = [medir(r) for r in sys.argv[1:]]
    if not filas:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    w = csv.DictWriter(sys.stdout, fieldnames=list(filas[0]))
    w.writeheader()
    w.writerows(filas)


if __name__ == "__main__":
    main()
