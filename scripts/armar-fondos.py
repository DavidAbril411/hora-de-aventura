#!/usr/bin/env python3
"""Arma los fondos de cada pantalla con las partes del mural colectivo, según la
tabla de la revisión del 26/10:

  Intro (p01)          cielo (sin la pared gris) + isla como capa aparte
  Día JP-Roberto       bosque con casas
  Día Diana-Rogelio    selva
  Noches (p06 y p08)   el fondo de día de esa dupla, oscurecido con tono azul
  Viaje (p10)          casas, bosque y laguna (mar), de noche
  Paso al atardecer    atardecer 1 y 2
  Capas para la noche  espacio, hada y estrellas

Día y noche de Camila-Alma (p04, p07), el colectivo (p09) y el cierre (p11) quedan
sin fondo hasta que lleguen los dibujos y los secretos (ver PENDIENTES.md).

Uso:
  scripts/armar-fondos.py <carpeta masters de procesar-imagenes.py> <carpeta de salida>

La pared gris del cielo se saca con el mismo recorte A (rembg) que los personajes:
queda transparente y el color de atrás lo pone el motor.
"""
import argparse
import importlib.util
import os

import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("procesar_imagenes", os.path.join(AQUI, "procesar-imagenes.py"))
pi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pi)

# nombre de salida | master | tratamiento (dia, noche, sin-pared, sin-pared-noche)
FONDOS = """
p01-intro-fondo|mural-cielo|sin-pared
p01-intro-isla|isla-A|dia
p03-dia-jp-roberto-fondo|mural-bosque-casas|dia
p05-dia-diana-rogelio-fondo|mural-selva|dia
p06-noche-jp-roberto-fondo|mural-bosque-casas|noche
p08-noche-diana-rogelio-fondo|mural-selva|noche
p10-viaje-casas|mural-casas|noche
p10-viaje-bosque|mural-bosque-casas|noche
p10-viaje-laguna|mural-mar|noche
p10-viaje-cielo|mural-cielo|sin-pared-noche
atardecer-1|atardecer-1|dia
atardecer-2|atardecer2|dia
capa-espacio|mural-espacio|dia
capa-hada-estrellas|mural-hada-estrellas|dia
"""


def noche(rgba, oscuro=0.45, tinte=(0.68, 0.82, 1.3), base=(0.02, 0.03, 0.09)):
    """Oscurece y lleva a azul: baja un poco la saturación, aplica una curva que
    hunde las sombras y multiplica por un tinte frío. No toca el alfa."""
    a = rgba.astype(np.float32) / 255
    rgb = a[..., :3]
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1, keepdims=True)
    rgb = 0.55 * rgb + 0.45 * lum
    a[..., :3] = (rgb ** 1.15 * oscuro * np.array(tinte) + np.array(base)).clip(0, 1)
    return (a * 255 + 0.5).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("masters")
    ap.add_argument("destino")
    args = ap.parse_args()
    os.makedirs(args.destino, exist_ok=True)

    sin_pared = {}
    for linea in FONDOS.strip().splitlines():
        nombre, master, tratamiento = linea.split("|")
        img = np.array(Image.open(os.path.join(args.masters, master + ".png")).convert("RGBA"))
        if tratamiento.startswith("sin-pared"):
            if master not in sin_pared:
                sin_pared[master] = pi.recortar_margenes(pi.recorte_rembg(img[..., :3]))
            img = sin_pared[master]
        if tratamiento.endswith("noche"):
            img = noche(img)
        if img[..., 3].min() == 255:
            img = img[..., :3]
        pi.guardar_webp(img, os.path.join(args.destino, nombre + ".webp"))
        print(f"{nombre}: {img.shape[1]}x{img.shape[0]} ({master}, {tratamiento})")


if __name__ == "__main__":
    main()
