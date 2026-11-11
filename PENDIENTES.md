# Pendientes

Material que falta, dudas para el equipo y placeholders en uso. Cada placeholder en
la app se marca visiblemente con la palabra `PENDIENTE` y se anota acá.

Fuente: inventario de la Library del 23/10/2026 (`scripts/inventario.csv`) contra
`especificacion.md` y `Hora_de_aventura.pdf`, actualizado con la revisión de Lucila
del 26/10/2026 y el material que llegó el 3/11/2026 (el último).

## Llegó el 3/11

Los siete dibujos que faltaban y el Tulio nuevo, en la Library en
`IMAGENES/nuevos-2026-11-03/`. Ya tratados (`material-tratado/webp/`), esperan aprobación:

| Dibujo | Archivo | Pantalla |
|---|---|---|
| La fiesta de Camila y Alma | `esc-fiesta-camila-alma.webp` | 4 |
| El colectivo con el mapa del chofer | `esc-colectivo-mapa.webp` | 9 (el mapa no marca los tres destinos: los toques los ubica el motor) |
| La vista por la ventana | `esc-ventana.webp` | 10 |
| Los chicos bajando del colectivo | `esc-chicos-bajando.webp` | 11 |
| El sobre de la herencia | `obj-sobre-herencia.webp` | 7 |
| Las monedas | `obj-monedas.webp` | 6 · 7 · 8 |
| El reloj | `obj-reloj.webp` | 6 · 7 · 8 |
| Tulio (dibujo nuevo) | `pj-tulio.webp` | 3 (reemplaza al de lápiz claro) |

## Narración nueva (llegó el 3/11, se sumó el 11/11)

La regrabación de Juan Pablo y Roberto (`SONIDOS/nuevos-2026-11-03/`), tratada como
`narracion-jp-roberto.m4a`. Reemplaza a la primera versión (guardada en
`material-tratado/descartados/audio/`) e incluye lo que faltaba de Roberto. Sigue en primera
persona, no es el texto exacto del PDF. Espera aprobación.

## No va a llegar

David avisó el 11/11 que ya es todo el material.

| Qué | Pantalla | Cómo queda |
|---|---|---|
| Los secretos de las escenas de día | 3 · 4 · 5 | Sin contenido propio. No se inventa: hay que decidir con el equipo qué hacer con esas pantallas |
| Regrabación de Camila y Alma y de Diana y Rogelio | 3 · 4 · 5 | Quedan las narraciones actuales, que no leen el texto exacto del PDF |
| Lista de dibujos dados vuelta | — | Quedan como están (se giraron los cuatro que se veían mal) |

## Fondos de cada pantalla

Armados con partes del mural colectivo (`scripts/armar-fondos.py`), según la tabla de la
revisión. Están en la Library, en `material-tratado/pantallas/`.

| Pantalla | Fondo | Estado |
|---|---|---|
| 1 · Intro | Cielo sin la pared gris (`p01-intro-fondo`, con transparencia) + isla como capa (`p01-intro-isla`) | Listo para revisar |
| 3 · Día jp-roberto | Bosque con casas | Listo para revisar |
| 4 · Día camila-alma | — | **A definir**: ya llegó la fiesta (`esc-fiesta-camila-alma`); falta elegir qué parte del mural va detrás |
| 5 · Día diana-rogelio | Selva | Listo para revisar |
| Paso al atardecer | Atardecer 1 y 2 | Listo para revisar |
| 6 · Noche jp-roberto | Bosque con casas, oscurecido en azul | Listo para revisar |
| 7 · Noche camila-alma | Espacio, oscurecido en azul | Propuesta (celulares y cámara, como ellas). Se revisa cuando se defina su día |
| 8 · Noche diana-rogelio | Selva, oscurecida en azul | Listo para revisar |
| 9 · Colectivo | — | El dibujo `esc-colectivo-mapa` puede ir solo o sobre un fondo del mural, a definir |
| 10 · Viaje | Capas de noche: casas, bosque con casas, laguna (mar) y cielo | Listo para revisar. Llegó la vista por la ventana (`esc-ventana`): se puede usar el marco con las capas pasando detrás |
| 11 · Cierre | — | El dibujo `esc-chicos-bajando` puede ir solo o sobre un fondo del mural, a definir |

## Contenido que falta (no se inventa)

- **Pantallas 3 a 5:** qué revela cada secreto. No va a llegar (ver «No va a llegar»).
  - La ficha del pulpo tiene pistas escritas a mano («curiosidad: tiene un hermano», «no le gusta que le toquen los tentáculos»): pueden ser el contenido de su secreto.
  - Si alguno de los dibujos de Pou era un secreto, hay que reemplazarlo.
- **Pantalla 10:** si el viaje cambia según el destino (el PDF no lo diferencia).
- **Créditos:** los nombres de los chicos tal como los indique el equipo (autores, ilustradores y narradores: Lucas, Jere, Juli y Ana Paula narran; en los dibujos aparecen firmas como Lorenzo, Jonatan, Eva, Franco, Lucas y Yazmín).

## Sonidos

Resueltos con sonidos libres (decisión del 26/10): `sfx-clac-clac`, `sfx-tic-tac` y
`sfx-colectivo`, de BigSoundBank, licencia CC0. Fuente de cada uno en
`scripts/fuentes-sonidos.md`. Falta que el equipo los escuche y los apruebe.

## Esperan aprobación

- **«Economía»:** dos retoques para elegir (`scripts/retocar-trazo.py`): solo el trazo
  repasado, o el trazo repasado con un color pálido parejo adentro. Si no convence
  ninguno, queda como está.

## Dudas para el equipo

- **«Cambiar» sin comentario:** los 59 elementos volvieron marcados «cambiar» casi sin
  comentarios; parece un malentendido con el botón de la página. Se trabaja como si
  estuvieran aprobados hasta que Lucila lo confirme.
- **Nombre de la obra:** «Hora de aventura» es el título en Latinoamérica de *Adventure
  Time*. Preguntar dónde se va a publicar; si es abierto, sugerir sumarle algo al nombre.
- **Chica endemoniada:** las puntas de los cuernos quedan apenas cortadas (tocaban el título
  impreso de la ficha). Si molesta, pedir una foto nueva.

## Decidido en la revisión del 26/10

- Criterio de recorte: solo el dibujo, sin textos impresos ni notas.
- Juan Pablo y Roberto quedan como están; el gato «sin nombre aún» es Rogelio.
- `rogelio 2` y `extra` (imágenes prediseñadas) no se usan.
- Pou (`pou-empresario`, `pou-oruga`) sale del material.
- La chica endemoniada va, nombrada solo como «chica endemoniada».
- El celular es de Alma: `obj-celular-de-alma`.
- Las tres erratas del PDF se corrigen (las aplica el motor):
  «donde que les puede ayudar» → «que les puede ayudar»; «Toca en el mapa» → «Tocá en
  el mapa»; «Tic… tac…La noche» → «Tic… tac… La noche».

## Placeholders en uso

Ninguno desde el material. Los que use el motor se anotan en su PR.
