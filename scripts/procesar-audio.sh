#!/usr/bin/env bash
# Tratamiento de audio de "Hora de aventura".
#
# Uso:
#   scripts/procesar-audio.sh <narracion|ambiente> <entrada> <salida.m4a>
#
# Variables opcionales:
#   MEZCLA_RNN   mezcla del filtro arnndn para narraciones (default 0.85; bajar a 0.6-0.7 si suena robótico)
#   RNNOISE_MODEL ruta a un modelo .rnnn (default: std.rnnn de richardpl/arnndn-models, se descarga solo)
#
# Detalle de cada paso en especificacion.md, sección "Tratamiento de audio".
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Uso: $0 <narracion|ambiente> <entrada> <salida.m4a>" >&2
  exit 2
fi

tipo="$1"
entrada="$2"
salida="$3"

MEZCLA_RNN="${MEZCLA_RNN:-0.85}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/hora-de-aventura"
RNNOISE_MODEL="${RNNOISE_MODEL:-$CACHE/std.rnnn}"
RNNOISE_URL="https://raw.githubusercontent.com/richardpl/arnndn-models/master/std.rnnn"

if [[ "$tipo" == "narracion" && ! -s "$RNNOISE_MODEL" ]]; then
  mkdir -p "$(dirname "$RNNOISE_MODEL")"
  echo "Descargando modelo RNNoise: $RNNOISE_URL" >&2
  curl -fsSL -o "$RNNOISE_MODEL" "$RNNOISE_URL"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

ff() { ffmpeg -hide_banner -nostdin -loglevel error -y "$@"; }

# Recorte de silencios en los dos extremos: se recorta el principio, se da vuelta,
# se recorta de nuevo y se vuelve a dar vuelta. Deja 0,25 s de aire al principio y
# 0,35 s al final para no cortar respiraciones ni la última sílaba. Umbral -45 dB:
# por encima del ruido de sala que queda después de la limpieza (~-48 dB).
recorte_extremos="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25:detection=rms,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.35:detection=rms,areverse"

case "$tipo" in
  narracion)
    # 1-7: limpieza, inteligibilidad, compresión y recorte de extremos.
    cadena="highpass=f=90,lowpass=f=11000"
    cadena+=",arnndn=m='${RNNOISE_MODEL}':mix=${MEZCLA_RNN}"
    cadena+=",afftdn=nr=6:nf=-50:tn=1"
    cadena+=",deesser=i=0.4:m=0.5:f=0.5"
    cadena+=",equalizer=f=3000:t=q:w=1.2:g=3"
    cadena+=",acompressor=threshold=-22dB:ratio=3:attack=15:release=200:knee=4"
    cadena+=",${recorte_extremos}"
    objetivo_lufs=-16
    # -2 en vez de -1,5: la codificación AAC sube el pico unas décimas.
    objetivo_tp=-2
    ;;
  ambiente)
    # 1: pasa-altos y reducción de ruido muy suave. El fundido se agrega más abajo,
    # cuando ya se conoce la duración.
    cadena="highpass=f=40,afftdn=nr=4:nf=-60"
    objetivo_lufs=-26
    objetivo_tp=-3
    ;;
  *)
    echo "Tipo desconocido: $tipo (usar narracion o ambiente)" >&2
    exit 2
    ;;
esac

ff -i "$entrada" -ac 1 -ar 48000 -af "$cadena" -c:a pcm_s24le "$tmp/limpio.wav"

if [[ "$tipo" == "ambiente" ]]; then
  # 2: fundido de entrada y de salida para que el loop no "salte".
  dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/limpio.wav")"
  fundido="$(awk -v d="$dur" 'BEGIN { f = d * 0.05; if (f > 0.4) f = 0.4; printf "%.3f", f }')"
  inicio_salida="$(awk -v d="$dur" -v f="$fundido" 'BEGIN { printf "%.3f", d - f }')"
  ff -i "$tmp/limpio.wav" -af "afade=t=in:d=${fundido},afade=t=out:st=${inicio_salida}:d=${fundido}" -c:a pcm_s24le "$tmp/fundido.wav"
  mv "$tmp/fundido.wav" "$tmp/limpio.wav"
fi

# 8: loudnorm en dos pasadas. Primera: medir.
medida="$(ffmpeg -hide_banner -nostdin -i "$tmp/limpio.wav" \
  -af "loudnorm=I=${objetivo_lufs}:TP=${objetivo_tp}:LRA=11:print_format=json" -f null - 2>&1 \
  | sed -n '/^{/,/^}/p')"

valor() { printf '%s' "$medida" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }

# Segunda: aplicar con los valores medidos (modo lineal cuando es posible).
ff -i "$tmp/limpio.wav" -af "loudnorm=I=${objetivo_lufs}:TP=${objetivo_tp}:LRA=11:\
measured_I=$(valor input_i):measured_TP=$(valor input_tp):measured_LRA=$(valor input_lra):\
measured_thresh=$(valor input_thresh):offset=$(valor target_offset):linear=true,aresample=48000" \
  -c:a pcm_s24le "$tmp/normalizado.wav"

# Ajuste fino: en archivos cortos loudnorm puede quedar a ±1 LU del objetivo.
# Se mide de nuevo y se corrige con una ganancia fija, sin pasar el pico máximo.
medida_fina="$(ffmpeg -hide_banner -nostdin -i "$tmp/normalizado.wav" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p')"
lufs_actual="$(printf '%s' "$medida_fina" | sed -n 's/^ *I: *\(-*[0-9.]*\) LUFS.*/\1/p')"
pico_actual="$(printf '%s' "$medida_fina" | sed -n 's/^ *Peak: *\(-*[0-9.]*\) dBFS.*/\1/p')"
ganancia="$(awk -v o="$objetivo_lufs" -v l="$lufs_actual" -v t="$objetivo_tp" -v p="$pico_actual" \
  'BEGIN { g = o - l; if (p + g > t) g = t - p; printf "%.2f", g }')"
ff -i "$tmp/normalizado.wav" -af "volume=${ganancia}dB" -c:a pcm_s24le "$tmp/final.wav"
mv "$tmp/final.wav" "$tmp/normalizado.wav"

# 9: AAC mono 96 kbps, con el índice al principio para que arranque rápido en la web.
mkdir -p "$(dirname "$salida")"
ff -i "$tmp/normalizado.wav" -ac 1 -ar 48000 -c:a aac -b:a 96k -movflags +faststart "$salida"

echo "OK $tipo: $entrada -> $salida" >&2
