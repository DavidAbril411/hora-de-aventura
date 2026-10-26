# Pendientes

Material que falta, dudas para el equipo y placeholders en uso. Cada placeholder en
la app se marca visiblemente con la palabra `PENDIENTE` y se anota acá.

Fuente: inventario de la Library del 23/10/2026 (`scripts/inventario.csv`) contra
`especificacion.md` y `Hora_de_aventura.pdf`, actualizado con la revisión de Lucila
del 26/10/2026.

## Llega el martes 27/10

Lucila avisó que ese día vuelven a ver a los chicos y mandan lo que falta.

| Qué | Para qué pantalla | Qué hacemos cuando llegue |
|---|---|---|
| Los secretos de las escenas de día | 3 · 4 · 5 | Cruzarlos con las fichas «No es un… / Es…» (sin Pou) y armar las escenas de día |
| Foto nueva de Tulio | Personajes | Tratarla y reemplazar `pj-tulio` |
| El colectivo con el mapa del chofer | 9 | Tratarlo y ubicarlo |
| La vista por la ventana | 10 | Tratarla; hoy el viaje usa capas del mural de noche |
| La fiesta de Camila y Alma | 4 | Tratarla; con eso se define el fondo de día de Camila y Alma |
| El sobre de la herencia | 7 | Tratarlo |
| Las monedas | 6 · 7 · 8 | Tratarlas |
| El reloj | 6 · 7 · 8 | Tratarlo |
| Los chicos bajando del colectivo | 11 | Tratarlo |
| Narraciones de las tres duplas, regrabadas leyendo el texto exacto del PDF | 3 · 4 · 5 | Tratarlas igual que las actuales y reemplazarlas. **Fecha a confirmar:** el comentario de Lucila dice «27 de noviembre» |

Se puede pedir ya: **la lista de dibujos dados vuelta** (la tiene Lucila). Al tratarlos se
giraron cuatro que venían de costado o al revés; con la lista se corrigen los que falten.

## Fondos de cada pantalla

Armados con partes del mural colectivo (`scripts/armar-fondos.py`), según la tabla de la
revisión. Están en la Library, en `material-tratado/pantallas/`.

| Pantalla | Fondo | Estado |
|---|---|---|
| 1 · Intro | Cielo sin la pared gris (`p01-intro-fondo`, con transparencia) + isla como capa (`p01-intro-isla`) | Listo para revisar |
| 3 · Día jp-roberto | Bosque con casas | Listo para revisar |
| 4 · Día camila-alma | — | **A definir** cuando lleguen los secretos y la fiesta |
| 5 · Día diana-rogelio | Selva | Listo para revisar |
| Paso al atardecer | Atardecer 1 y 2 | Listo para revisar |
| 6 · Noche jp-roberto | Bosque con casas, oscurecido en azul | Listo para revisar |
| 7 · Noche camila-alma | — | **A definir** junto con el día de Camila y Alma. Hay capas de espacio y de hada y estrellas para usar |
| 8 · Noche diana-rogelio | Selva, oscurecida en azul | Listo para revisar |
| 9 · Colectivo | — | Espera el dibujo del colectivo |
| 10 · Viaje | Capas de noche: casas, bosque con casas, laguna (mar) y cielo | Listo para revisar; se reemplaza si llega la vista por la ventana |
| 11 · Cierre | — | Espera el dibujo de los chicos bajando |

## Contenido que falta (no se inventa)

- **Pantallas 3 a 5:** qué revela cada secreto. Llega el 27/10 (ver arriba).
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
- **Narraciones:** confirmar si se regraban el 27/10 o el 27/11.

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
