#!/usr/bin/env python3
"""Logos institucionales para los créditos.

Los logos no se recolorean: van con sus colores sobre una placa clara. El
tratamiento solo los deja livianos y sin fondo:

  - Si el original trae transparencia (PNG), se recorta al contenido.
  - Si viene con fondo claro (los JPEG que llegan por WhatsApp), el fondo
    pasa a transparente y se recorta al contenido.
  - Se achica (220 px de alto, salvo que se pida otro) y se guarda en WebP sin pérdida.

Uso:
  python3 scripts/procesar-logos.py <original> <salida.webp> [alto en px]

El alto por defecto es 220 px; un logo apilado, que se muestra más alto, pide más (440).

Necesita Pillow y numpy.
"""
import sys

import numpy as np
from PIL import Image

ALTO = 220


def sin_fondo_claro(imagen: Image.Image) -> Image.Image:
    """El fondo claro pasa a transparente; los bordes quedan suaves."""
    pixeles = np.asarray(imagen.convert("RGB")).astype(np.float32)
    fondo = float(pixeles[:4, :4].mean())  # el gris muy claro de la esquina
    pixeles = np.clip(pixeles * 255 / fondo, 0, 255) / 255
    alfa = 1 - pixeles.min(axis=2)
    alfa = np.where(alfa < 0.03, 0, alfa)
    color = np.where(alfa[..., None] > 0, (pixeles - (1 - alfa[..., None])) / np.maximum(alfa[..., None], 1e-6), 1)
    salida = np.dstack([np.clip(color, 0, 1), alfa])
    return Image.fromarray((salida * 255).round().astype(np.uint8), "RGBA")


def main() -> int:
    if len(sys.argv) not in (3, 4):
        print(__doc__)
        return 2
    alto = int(sys.argv[3]) if len(sys.argv) == 4 else ALTO
    original = Image.open(sys.argv[1])
    tiene_alfa = original.mode in ("RGBA", "LA") and original.getchannel("A").getextrema()[0] < 255
    logo = original.convert("RGBA") if tiene_alfa else sin_fondo_claro(original)
    logo = logo.crop(logo.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    logo = logo.resize((round(logo.width * alto / logo.height), alto), Image.LANCZOS)
    logo.save(sys.argv[2], lossless=True, method=6)
    print(f"{sys.argv[2]}: {logo.width}x{logo.height}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
