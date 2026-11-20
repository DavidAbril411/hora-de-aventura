#!/usr/bin/env bash
# Arma el sonido crudo del colectivo que llega y frena (pantalla 9) con tres
# grabaciones CC0 de BigSoundBank. El resultado después pasa por
# procesar-audio.sh como cualquier ambiente. Fuentes y licencias en
# scripts/fuentes-sonidos.md.
#
#   0512  camioneta que se acerca despacio y frena al llegar (se usa hasta que pasa)
#   1145  motor diésel de una Iveco Daily en marcha (queda regulando cuando para)
#   1490  soltada de freno neumático (el «pssh» al detenerse)
#
# Uso:
#   scripts/armar-colectivo.sh <carpeta con bsb-0512.wav, bsb-1145.wav y bsb-1490.wav> <salida.wav>
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <carpeta de las fuentes> <salida.wav>" >&2
  exit 2
fi

f="$1"
ffmpeg -v error -y \
  -i "$f/bsb-0512.wav" -i "$f/bsb-1145.wav" -i "$f/bsb-1490.wav" \
  -filter_complex "
    [0:a]aresample=48000,aformat=channel_layouts=mono,atrim=0:8.8,afade=t=out:st=7.8:d=1.0[llega];
    [1:a]aresample=48000,aformat=channel_layouts=mono,atrim=1:7,asetpts=PTS-STARTPTS,volume=-3dB,afade=t=in:d=1.0,afade=t=out:st=4.8:d=1.2,adelay=7800[motor];
    [2:a]aresample=48000,aformat=channel_layouts=mono,volume=-4dB,adelay=8700[freno];
    [llega][motor][freno]amix=inputs=3:normalize=0:duration=longest" \
  -c:a pcm_s24le "$2"
