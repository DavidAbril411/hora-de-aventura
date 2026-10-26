#!/usr/bin/env python3
"""Tratamiento de las ilustraciones de "Hora de aventura".

Uso:
    python3 scripts/procesar-imagenes.py <carpeta IMAGENES de la Library> <carpeta de salida> \
        [--inventario scripts/inventario.csv] [--solo id1,id2] [--sin-recorte] [--webp public/img]

Lee el inventario (una fila por imagen) y, para cada una:
  1. Orientación: EXIF del celular y la rotación anotada en el inventario.
  2. Perspectiva: si es una foto de una hoja, busca el contorno del papel y la endereza.
  3. Zona: tapa con blanco lo que no es dibujo (nombres, consignas; columna `tapar`)
     y recorta la parte de la hoja que interesa (sin el marco ni el texto impreso).
  4. Luz pareja: divide por una estimación suave del papel (flat-field), que borra
     sombras y deja el papel blanco.
  5. Color y contraste: estirado suave de niveles y +12 % de saturación.
  6. Nitidez: máscara de enfoque suave.
  7. Tamaño: máximo 2000 px en el lado largo.
  Si la fila tiene `quitar_marco=si`, borra las líneas rectas largas del marco
  impreso de la ficha que cruzan la zona.
Para personajes y objetos genera además dos recortes de fondo:
  A. rembg (modelo birefnet-general con alpha matting).
  B. Papel a transparente: la opacidad sale de cuánto se aleja cada píxel del blanco.
Después del recorte rellena el papel encerrado por el dibujo (para que una cara
sin pintar no quede transparente) y saca los márgenes vacíos y los píxeles sueltos.

Salida en <carpeta de salida>:
  masters/<id>.png        imagen tratada (sin recorte de fondo)
  masters/<id>-A.png      recorte A
  masters/<id>-B.png      recorte B
  originales/<id>.jpg     el original extraído, para comparar
Con --webp, escribe además el WebP final (calidad 85) de las filas que tienen
`salida` y `metodo` elegidos en el inventario.

Mejorar la foto, nunca el dibujo: no se redibuja, no se completa nada y no se usa
IA generativa. Detalle en especificacion.md, sección "Tratamiento de imágenes".
"""
import argparse
import csv
import os
import shutil
import subprocess
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image, ImageOps

LADO_MAXIMO = 2000
AQUI = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------- lectura

def extraer_original(ruta):
    """Devuelve la imagen original como RGB (numpy). Los PDF de una sola foto se
    extraen sin recomprimir; los que tienen varias piezas se renderizan a 200 ppp."""
    if not ruta.lower().endswith(".pdf"):
        img = ImageOps.exif_transpose(Image.open(ruta)).convert("RGB")
        return np.array(img)
    with tempfile.TemporaryDirectory() as tmp:
        lista = subprocess.run(["pdfimages", "-list", ruta], capture_output=True, text=True, check=True).stdout
        piezas = [l for l in lista.splitlines()[2:] if l.split()[2] == "image"]
        if len(piezas) == 1:
            subprocess.run(["pdfimages", "-all", ruta, os.path.join(tmp, "x")], check=True)
            archivo = os.path.join(tmp, sorted(os.listdir(tmp))[0])
        else:
            subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", ruta, os.path.join(tmp, "x")], check=True)
            archivo = os.path.join(tmp, "x.png")
        img = ImageOps.exif_transpose(Image.open(archivo)).convert("RGB")
        return np.array(img)


def rotar(img, grados):
    giros = {0: None, 90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}
    return img if not giros[grados] else cv2.rotate(img, giros[grados])


# ---------------------------------------------------------------- geometría

def ordenar_esquinas(p):
    p = p.reshape(4, 2).astype(np.float32)
    s, d = p.sum(1), np.diff(p, axis=1).ravel()
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]], dtype=np.float32)


def enderezar_hoja(img):
    """Busca el papel (la región clara más grande con 4 esquinas) y corrige la
    perspectiva. Si no encuentra un cuadrilátero creíble, devuelve la imagen igual."""
    h, w = img.shape[:2]
    escala = 800 / max(h, w)
    chica = cv2.resize(img, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA)
    gris = cv2.GaussianBlur(cv2.cvtColor(chica, cv2.COLOR_RGB2GRAY), (5, 5), 0)
    _, papel = cv2.threshold(gris, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    papel = cv2.morphologyEx(papel, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    contornos, _ = cv2.findContours(papel, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contornos:
        return img, False
    c = max(contornos, key=cv2.contourArea)
    area = cv2.contourArea(c) / (chica.shape[0] * chica.shape[1])
    aprox = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
    if len(aprox) != 4 or not (0.25 < area < 0.95):
        return img, False
    esq = ordenar_esquinas(aprox) / escala
    ancho = int(max(np.linalg.norm(esq[0] - esq[1]), np.linalg.norm(esq[3] - esq[2])))
    alto = int(max(np.linalg.norm(esq[0] - esq[3]), np.linalg.norm(esq[1] - esq[2])))
    destino = np.array([[0, 0], [ancho - 1, 0], [ancho - 1, alto - 1], [0, alto - 1]], dtype=np.float32)
    m = cv2.getPerspectiveTransform(esq, destino)
    return cv2.warpPerspective(img, m, (ancho, alto), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), True


def recortar_zona(img, zona):
    """zona = "x0 y0 x1 y1" en fracciones de la imagen (0 a 1)."""
    if not zona.strip():
        return img
    x0, y0, x1, y1 = (float(v) for v in zona.split())
    h, w = img.shape[:2]
    return img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]


def tapar(img, rectangulos):
    """rectangulos = "x0 y0 x1 y1; x0 y0 x1 y1" en fracciones. Se pintan del color
    del papel (blanco); sirve para nombres o consignas que quedan cerca del dibujo."""
    if not rectangulos.strip():
        return img
    img = img.copy()
    h, w = img.shape[:2]
    papel = np.percentile(img.reshape(-1, 3), 90, axis=0).astype(np.uint8)
    for r in rectangulos.split(";"):
        x0, y0, x1, y1 = (float(v) for v in r.split())
        img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = papel
    return img


def quitar_marco(img):
    """Borra las líneas rectas horizontales y verticales largas (el marco impreso de
    las fichas). Solo se usa en las filas marcadas, porque también borraría una
    línea recta larga del dibujo."""
    gris = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    tinta = (gris < 150).astype(np.uint8) * 255
    h, w = gris.shape
    vertical = cv2.morphologyEx(tinta, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 6)))
    horizontal = cv2.morphologyEx(tinta, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (w // 6, 1)))
    # Las zonas pintadas (más gruesas que una línea) no se tocan.
    grueso = cv2.morphologyEx(tinta, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
    grueso = cv2.dilate(grueso, np.ones((9, 9), np.uint8))
    lineas = cv2.dilate((vertical | horizontal) & ~grueso, np.ones((5, 5), np.uint8))
    img = img.copy()
    img[lineas > 0] = 252
    return img


def limitar_tamano(img, lado=LADO_MAXIMO):
    h, w = img.shape[:2]
    if max(h, w) <= lado:
        return img
    f = lado / max(h, w)
    return cv2.resize(img, (round(w * f), round(h * f)), interpolation=cv2.INTER_AREA)


# ---------------------------------------------------------------- luz y color

def luz_pareja(img):
    """Flat-field: estima cómo se ve el papel en cada punto (ignorando el dibujo,
    que se rellena desde el papel de alrededor), lo suaviza y divide la imagen por
    esa estimación. Borra sombras y dominantes de color del papel."""
    h, w = img.shape[:2]
    escala = 400 / max(h, w)
    chica = cv2.resize(img, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(chica, cv2.COLOR_RGB2HSV)
    v, s = hsv[..., 2].astype(np.float32), hsv[..., 1]
    es_papel = (s < 45) & (v > 0.8 * np.percentile(v, 90))
    es_papel = cv2.erode(es_papel.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    if es_papel.mean() < 0.05:
        return img
    rellenar = (~es_papel).astype(np.uint8) * 255
    fondo = cv2.inpaint(chica, rellenar, 7, cv2.INPAINT_TELEA)
    fondo = cv2.GaussianBlur(fondo.astype(np.float32), (0, 0), sigmaX=max(h, w) * escala / 40)
    fondo = cv2.resize(fondo, (w, h), interpolation=cv2.INTER_CUBIC)
    salida = img.astype(np.float32) / np.maximum(fondo, 1) * 252
    return np.clip(salida, 0, 255).astype(np.uint8)


def color_y_contraste(img, saturacion=1.12):
    gris = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    negro = float(np.percentile(gris, 0.3)) * 0.6
    f = img.astype(np.float32)
    f = (f - negro) / (255 - negro) * 255
    hsv = cv2.cvtColor(np.clip(f, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * saturacion, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def nitidez(img, radio=1.2, cantidad=0.6):
    borroso = cv2.GaussianBlur(img, (0, 0), radio)
    return cv2.addWeighted(img, 1 + cantidad, borroso, -cantidad, 0)


# ---------------------------------------------------------------- recortes

def limpiar_alfa(alfa, umbral=0.25):
    """Deja solo el dibujo principal y lo que está cerca: borra motas y manchas
    sueltas lejos del dibujo."""
    marca = (alfa > umbral).astype(np.uint8)
    radio = max(9, int(max(alfa.shape) * 0.012)) | 1
    unido = cv2.dilate(marca, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radio, radio)))
    n, etiquetas, stats, _ = cv2.connectedComponentsWithStats(unido, connectivity=8)
    if n <= 1:
        return alfa
    areas = stats[1:, cv2.CC_STAT_AREA]
    conservar = np.zeros(n, dtype=bool)
    conservar[1:] = areas >= 0.03 * areas.max()
    return alfa * conservar[etiquetas]


def rellenar_huecos(rgba, umbral=0.5):
    """Las partes blancas que quedan encerradas por el dibujo (una cara sin pintar,
    los lunares de una mariquita) son papel que forma parte del dibujo: se dejan
    opacas en vez de transparentes. Solo se rellena lo que no toca el borde."""
    alfa = rgba[..., 3].astype(np.float32) / 255
    marca = (alfa > umbral).astype(np.uint8)
    relleno = np.pad(marca, 1)
    afuera = np.zeros((relleno.shape[0] + 2, relleno.shape[1] + 2), np.uint8)
    cv2.floodFill(relleno, afuera, (0, 0), 1)
    huecos = relleno[1:-1, 1:-1] == 0
    rgba = rgba.copy()
    rgba[..., 3] = np.where(huecos, 255, rgba[..., 3])
    return rgba


def papel_a_transparente(img, t0=14.0, t1=70.0):
    """Recorte B: la opacidad crece con la distancia al blanco (255 - canal mínimo).
    El color se 'des-mezcla' del blanco para que el lápiz claro no quede lavado
    sobre otros fondos."""
    f = img.astype(np.float32)
    distancia = 255 - f.min(axis=2)
    alfa = np.clip((distancia - t0) / (t1 - t0), 0, 1)
    alfa = limpiar_alfa(alfa)
    a = np.maximum(alfa, 1e-3)[..., None]
    color = np.clip(255 - (255 - f) / a, 0, 255)
    rgba = np.dstack([color, alfa * 255]).astype(np.uint8)
    # En los huecos rellenados va el color tratado tal cual (el papel blanco).
    huecos = rellenar_huecos(rgba)[..., 3] > rgba[..., 3]
    rgba[huecos, :3] = img[huecos]
    rgba[huecos, 3] = 255
    return rgba


_sesion_rembg = None


def recorte_rembg(img, lado_mascara=1100):
    """Recorte A: rembg con birefnet-general y alpha matting. La máscara se calcula
    sobre una copia de hasta 1100 px (el alpha matting a 2000 px pide más de 13 GB
    de memoria) y después se escala al tamaño de la imagen."""
    global _sesion_rembg
    from rembg import new_session, remove
    if _sesion_rembg is None:
        import onnxruntime as ort
        # Sin el arena de memoria de ONNX, birefnet se queda en ~8 GB; con el arena
        # crece en cada imagen hasta que el sistema mata el proceso.
        opciones = ort.SessionOptions()
        opciones.enable_cpu_mem_arena = False
        opciones.enable_mem_pattern = False
        _sesion_rembg = new_session("birefnet-general", sess_opts=opciones)
    chica = limitar_tamano(img, lado_mascara)
    mascara = remove(Image.fromarray(chica), session=_sesion_rembg, only_mask=True, alpha_matting=True,
                     alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=20,
                     alpha_matting_erode_size=6)
    alfa = np.array(mascara.convert("L")).astype(np.float32) / 255
    alfa = cv2.resize(alfa, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC).clip(0, 1)
    alfa = limpiar_alfa(alfa)
    return rellenar_huecos(np.dstack([img, (alfa * 255).astype(np.uint8)]))


def recortar_margenes(rgba, margen=8):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    if len(xs) == 0:
        return rgba
    h, w = rgba.shape[:2]
    return rgba[max(ys.min() - margen, 0):min(ys.max() + margen + 1, h),
                max(xs.min() - margen, 0):min(xs.max() + margen + 1, w)]


# ---------------------------------------------------------------- salida

def guardar_png(arr, ruta):
    Image.fromarray(arr).save(ruta, optimize=True)


def guardar_webp(arr, ruta):
    img = Image.fromarray(arr)
    opciones = {"quality": 85, "method": 6}
    if img.mode == "RGBA":
        opciones["alpha_quality"] = 90
    img.save(ruta, "WEBP", **opciones)


def procesar(fila, origen, destino, con_recorte):
    ident = fila["id"]
    img = extraer_original(os.path.join(origen, fila["origen"]))
    guardar_jpg = os.path.join(destino, "originales", ident + ".jpg")
    img = rotar(img, int(fila.get("rotacion") or 0))
    Image.fromarray(limitar_tamano(img, 1200)).save(guardar_jpg, quality=85)
    enderezada = False
    if fila.get("enderezar", "auto") == "auto":
        img, enderezada = enderezar_hoja(img)
    img = tapar(img, fila.get("tapar", ""))
    img = recortar_zona(img, fila.get("zona", ""))
    if fila["tipo"] != "fondo-foto":
        img = luz_pareja(img)
    if fila.get("quitar_marco", "") == "si":
        img = quitar_marco(img)
    img = color_y_contraste(img)
    img = limitar_tamano(img)
    img = nitidez(img)
    guardar_png(img, os.path.join(destino, "masters", ident + ".png"))
    resultado = {"id": ident, "enderezada": enderezada, "tamano": f"{img.shape[1]}x{img.shape[0]}"}

    if con_recorte and fila["tipo"] == "recorte":
        b = recortar_margenes(papel_a_transparente(img))
        guardar_png(b, os.path.join(destino, "masters", ident + "-B.png"))
        a = recortar_margenes(recorte_rembg(img))
        guardar_png(a, os.path.join(destino, "masters", ident + "-A.png"))
    return resultado


def exportar_webp(fila, destino, carpeta_webp):
    metodo = fila.get("metodo", "").strip()
    nombre = fila.get("salida", "").strip()
    if not nombre or metodo in ("", "pendiente"):
        return None
    sufijo = "" if metodo == "fondo" else "-" + metodo
    master = os.path.join(destino, "masters", fila["id"] + sufijo + ".png")
    guardar_webp(np.array(Image.open(master)), os.path.join(carpeta_webp, nombre))
    return nombre


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("origen", help="carpeta IMAGENES de la Library")
    ap.add_argument("destino", help="carpeta de salida (masters y originales)")
    ap.add_argument("--inventario", default=os.path.join(AQUI, "inventario.csv"))
    ap.add_argument("--solo", default="", help="ids separados por coma")
    ap.add_argument("--sin-recorte", action="store_true", help="no generar recortes A y B")
    ap.add_argument("--webp", default="", help="carpeta donde escribir los WebP elegidos (p. ej. public/img)")
    args = ap.parse_args()

    with open(args.inventario, newline="", encoding="utf-8") as f:
        filas = [r for r in csv.DictReader(f) if r["tipo"] not in ("descartar", "referencia")]
    if args.solo:
        elegidos = set(args.solo.split(","))
        filas = [r for r in filas if r["id"] in elegidos]

    for sub in ("masters", "originales"):
        os.makedirs(os.path.join(args.destino, sub), exist_ok=True)
    if args.webp:
        os.makedirs(args.webp, exist_ok=True)

    for fila in filas:
        r = procesar(fila, args.origen, args.destino, not args.sin_recorte)
        print(f"{r['id']}: {r['tamano']}{' (perspectiva corregida)' if r['enderezada'] else ''}", file=sys.stderr)
        if args.webp:
            nombre = exportar_webp(fila, args.destino, args.webp)
            if nombre:
                print(f"  -> {nombre}", file=sys.stderr)


if __name__ == "__main__":
    main()
