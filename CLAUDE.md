# hora-de-aventura

Ficción digital interactiva hecha con chicos de la Escuela San Martín (Villa María). El contexto del proyecto, el alcance y las reglas de trabajo están en las instrucciones del proyecto de Claude Code. Este archivo solo cubre lo técnico del repositorio.

## Comandos
- `npm install` — instala dependencias
- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (tiene que pasar sin errores antes de cualquier PR)
- `npm run preview` — sirve el build para probarlo con Playwright

## Estructura
```
src/
  data/historia.json   # TODO el contenido: textos, escenas, hotspots, rutas de imagen y audio
  engine/              # motor de escenas, estado (dupla, destino, monedas), navegación
  audio/               # reproducción, loops de ambiente, ducking durante la narración
  ui/                  # componentes visuales
  styles/              # tokens de diseño (colores, tipografía, espaciado) y estilos
public/
  img/                 # ilustraciones procesadas (WebP)
  audio/               # audios procesados (.m4a)
scripts/
  procesar-audio.sh     # ffmpeg + RNNoise: limpieza, inteligibilidad, loudnorm, AAC
  procesar-imagenes.py  # ImageMagick + OpenCV + rembg: perspectiva, luz, color, recorte, WebP
  inventario.csv        # cada imagen: pantalla, tipo (fondo/recorte), método de recorte elegido
PENDIENTES.md          # material que falta y placeholders en uso
```

## Convenciones
- Ningún texto del cuento escrito en el código: todo sale de `historia.json`.
- Una pantalla nueva se agrega como datos en `historia.json`; el motor no debería necesitar cambios para eso.
- Todo material nuevo pasa por los scripts de `scripts/` antes de usarse; nunca se mete un archivo crudo en `public/`.
- Los originales pesados (fotos de las ilustraciones, audios crudos) no se commitean. Están en `/mnt/project-files`. En el repo solo van los procesados.
- Los placeholders se marcan visiblemente con la palabra `PENDIENTE` y se listan en `PENDIENTES.md`.
- Animaciones con Motion. Respetar `prefers-reduced-motion`.
- Viewports de verificación: 1180×820, 820×1180 y 390×844.

## Verificación antes de un PR
- `npm run build` sin errores ni warnings.
- Recorrido completo con Playwright (librería + Chromium del contenedor), sin errores de consola ni 404.
- Capturas en 1180×820, 820×1180 y 390×844 de cada pantalla tocada.
- Si el PR toca UI: `/impeccable audit` y `/impeccable critique`, con su resumen en el mensaje final.
- APIs de Vite, Motion y del service worker: consultadas en Context7 antes de usarlas.
