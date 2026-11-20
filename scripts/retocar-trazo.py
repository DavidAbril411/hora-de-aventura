#!/usr/bin/env python3
"""Retoque para dibujos en lápiz muy claro (por ahora, «Economía»). Pedido de la
revisión del 26/10: «si se puede intervenir con color; si no, dejarlo como está».

No redibuja: toma el recorte B (papel a transparente) y
  1. limpia el borde de la hoja que quedó como línea vertical y las motas sueltas,
  2. «trazo»: oscurece el lápiz claro (el negro no se toca) y lo engrosa 1 px,
  3. «trazo-color»: además pinta un color pálido parejo debajo de las líneas, en las
     zonas que el dibujo deja cerradas.

Genera <nombre>-trazo.png y <nombre>-trazo-color.png para elegir. Ninguno se usa
hasta que el equipo apruebe uno.

Uso:
  scripts/retocar-trazo.py <recorte-B.png> <carpeta de salida> [--color R,G,B]
"""
import argparse
import os

import cv2
import numpy as np
from PIL import Image


def limpiar(a):
    h, w = a.shape
    banda = np.zeros_like(a, np.uint8)
    banda[:, int(w * 0.95):] = 1
    banda[:, :int(w * 0.03)] = 1
    vertical = cv2.morphologyEx(((a > 0.05) & (banda > 0)).astype(np.uint8), cv2.MORPH_OPEN,
                                np.ones((80, 1), np.uint8))
    a[cv2.dilate(vertical, np.ones((5, 5), np.uint8)) > 0] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.05).astype(np.uint8), 8)
    for i in range(1, n):
        if st[i, 4] < 60:
            a[lab == i] = 0
    return a


def oscurecer_lapiz(rgb, a, lum):
    lapiz = (lum > 95) & (a > 0.05)
    grueso = cv2.dilate((a * lapiz).astype(np.float32), np.ones((3, 3), np.uint8))
    tocado = lapiz | (grueso > a)
    a2 = np.where(tocado, np.minimum(1, np.maximum(a, grueso) * 1.5), a)
    objetivo = 50 + 45 * np.clip((lum - 95) / (200 - 95), 0, 1)
    factor = np.where(tocado, objetivo / np.maximum(lum, 1), 1)[..., None]
    return np.clip(rgb * factor, 0, 255), a2


def zonas_cerradas(a, cierre=15):
    h, w = a.shape
    lineas = cv2.dilate((a > 0.25).astype(np.uint8), np.ones((cierre, cierre), np.uint8))
    relleno = np.pad(lineas, 1)
    cv2.floodFill(relleno, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2)
    adentro = (relleno[1:-1, 1:-1] == 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(adentro, 8)
    zonas = np.isin(lab, [i for i in range(1, n) if st[i, 4] > 1000]).astype(np.uint8)
    return cv2.dilate(zonas, np.ones((cierre, cierre), np.uint8)) > 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("entrada")
    ap.add_argument("destino")
    ap.add_argument("--color", default="236,224,196")
    args = ap.parse_args()
    os.makedirs(args.destino, exist_ok=True)
    nombre = os.path.basename(args.entrada).rsplit(".", 1)[0].removesuffix("-B")

    im = np.array(Image.open(args.entrada).convert("RGBA")).astype(np.float32)
    rgb, a = im[..., :3], limpiar(im[..., 3] / 255)
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1)
    rgb2, a2 = oscurecer_lapiz(rgb, a, lum)
    Image.fromarray(np.dstack([rgb2, a2 * 255]).astype(np.uint8)).save(
        os.path.join(args.destino, f"{nombre}-trazo.png"))

    color = np.array([float(c) for c in args.color.split(",")])
    fondo = zonas_cerradas(a2).astype(np.float32)[..., None]
    la = a2[..., None]
    alfa = la + fondo * (1 - la)
    mezcla = (rgb2 * la + color * fondo * (1 - la)) / np.maximum(alfa, 1e-6)
    Image.fromarray(np.dstack([mezcla, alfa * 255]).clip(0, 255).astype(np.uint8)).save(
        os.path.join(args.destino, f"{nombre}-trazo-color.png"))
    print(f"{nombre}: trazo y trazo-color en {args.destino}")


if __name__ == "__main__":
    main()
