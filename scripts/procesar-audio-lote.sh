#!/usr/bin/env bash
# Procesa todos los audios de la Library con procesar-audio.sh y los deja con los
# nombres que usa el repo.
#
# Uso:
#   scripts/procesar-audio-lote.sh <carpeta SONIDOS de la Library> <carpeta de salida>
#
# Ejemplo:
#   scripts/procesar-audio-lote.sh "/mnt/project-files/SONIDOS" public/audio
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <carpeta SONIDOS> <carpeta de salida>" >&2
  exit 2
fi

origen="$1"
destino="$2"
aqui="$(cd "$(dirname "$0")" && pwd)"

# El colectivo se arma con tres sonidos CC0 antes de procesarlo (ver armar-colectivo.sh).
"$aqui/armar-colectivo.sh" "$origen/libres-cc0" "$origen/libres-cc0/colectivo-armado.wav"

# tipo | archivo en la Library | nombre en el repo
while IFS='|' read -r tipo archivo nombre; do
  [[ -z "$tipo" || "$tipo" == \#* ]] && continue
  "$aqui/procesar-audio.sh" "$tipo" "$origen/$archivo" "$destino/$nombre"
done <<'LISTA'
narracion|audios hora de aventura/Intro (Lucas).m4a.mp4|narracion-intro.m4a
narracion|audios hora de aventura/Juan Pablo y roberto (Jere).m4a.mp4|narracion-jp-roberto.m4a
narracion|audios hora de aventura/Alma y Camila (Juli).m4a.mp4|narracion-camila-alma.m4a
narracion|audios hora de aventura/Diana y Rogelio (Ana Paula).m4a.mp4|narracion-diana-rogelio.m4a
ambiente|ruidos/viento.ogg|amb-viento.m4a
ambiente|ruidos/loritas.ogg|amb-loritas.m4a
ambiente|ruidos/guitarra.mp4|amb-guitarra.m4a
ambiente|ruidos/vecinos saludandose.ogg|amb-vecinos.m4a
ambiente|ruidos/pelotita picando.ogg|amb-pelotita.m4a
ambiente|ruidos/ruido de calle.ogg|amb-calle.m4a
ambiente|ruidos/moto.ogg|sfx-moto.m4a
ambiente|ruidos/perros ladrando.ogg|sfx-perros.m4a
# Sonidos libres (CC0, BigSoundBank). Fuente y licencia en fuentes-sonidos.md.
ambiente|libres-cc0/bsb-0514.wav|sfx-clac-clac.m4a
ambiente|libres-cc0/bsb-1567.wav|sfx-tic-tac.m4a
ambiente|libres-cc0/colectivo-armado.wav|sfx-colectivo.m4a
LISTA
