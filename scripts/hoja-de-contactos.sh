#!/usr/bin/env bash
# Hoja de contactos antes/después para el control de calidad de las imágenes.
# Una fila por imagen: original | tratada | recorte A | recorte B, sobre un fondo
# a cuadros para que se vea la transparencia. Usa montage de ImageMagick.
#
# Uso:
#   scripts/hoja-de-contactos.sh <carpeta de salida de procesar-imagenes.py> <carpeta destino> [filas por hoja]
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 <carpeta procesada> <carpeta destino> [filas por hoja]" >&2
  exit 2
fi

origen="$1"
destino="$2"
por_hoja="${3:-6}"
aqui="$(cd "$(dirname "$0")" && pwd)"
lado=420

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$destino"

# Una baldosa: la imagen centrada en un cuadro de lado×lado sobre fondo a cuadros,
# o un cuadro vacío con un guion si no existe.
baldosa() {
  local archivo="$1" salida="$2"
  if [[ -f "$archivo" ]]; then
    convert -size ${lado}x${lado} pattern:checkerboard -modulate 103,0 \
      \( "$archivo" -resize $((lado - 12))x$((lado - 12)) \) -gravity center -composite "$salida"
  else
    convert -size ${lado}x${lado} xc:'#f4f1ea' -gravity center -pointsize 40 -fill '#b8b1a3' -annotate 0 '—' "$salida"
  fi
}

# Ids en el orden del inventario, sin las filas de referencia.
mapfile -t ids < <(python3 -I - "$aqui/inventario.csv" <<'PY'
import csv, sys
for fila in csv.DictReader(open(sys.argv[1], encoding="utf-8")):
    if fila["tipo"] not in ("referencia", "descartar"):
        print(fila["id"])
PY
)

n=0
for id in "${ids[@]}"; do
  n=$((n + 1))
  fila="$(printf '%03d' "$n")"
  baldosa "$origen/originales/$id.jpg" "$tmp/$fila-1.png"
  baldosa "$origen/masters/$id.png" "$tmp/$fila-2.png"
  baldosa "$origen/masters/$id-A.png" "$tmp/$fila-3.png"
  baldosa "$origen/masters/$id-B.png" "$tmp/$fila-4.png"
  convert -size $((lado * 4 + 24))x34 xc:white -gravity west -pointsize 22 -fill '#2b2722' \
    -annotate +8+0 "$id" "$tmp/$fila-0.png"
done

total=$n
hoja=0
for ((inicio = 1; inicio <= total; inicio += por_hoja)); do
  hoja=$((hoja + 1))
  filas=()
  for ((i = inicio; i < inicio + por_hoja && i <= total; i++)); do
    f="$(printf '%03d' "$i")"
    montage "$tmp/$f-1.png" "$tmp/$f-2.png" "$tmp/$f-3.png" "$tmp/$f-4.png" \
      -tile 4x1 -geometry +3+3 -background white "$tmp/$f-fila.png"
    convert "$tmp/$f-0.png" "$tmp/$f-fila.png" -background white -gravity west -append "$tmp/$f-bloque.png"
    filas+=("$tmp/$f-bloque.png")
  done
  convert -size $((lado * 4 + 24))x44 xc:white -gravity center -pointsize 24 -fill '#2b2722' \
    -annotate 0 "original   |   tratada   |   recorte A (rembg)   |   recorte B (papel a transparente)" "$tmp/encabezado.png"
  convert "$tmp/encabezado.png" "${filas[@]}" -background white -append -quality 82 \
    "$destino/hoja-de-contactos-$(printf '%02d' "$hoja").jpg"
  echo "hoja $hoja" >&2
done
