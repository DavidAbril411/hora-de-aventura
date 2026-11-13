# Pendientes

Material que falta y placeholders en uso. Cada placeholder se ve en pantalla con la palabra **PENDIENTE**. En `src/data/historia.json`, todo lo que tiene `"pendiente": true` todavía no está: al integrar el material aprobado se cambia a `false` (o se borra la clave) y el placeholder desaparece solo.

## Motor y pantallas

### Ilustraciones

Material aprobado en la revisión con Lucila del 26/10 (lo marcado «cambiar» sin comentario se toma como aprobado; falta que Lucila lo confirme). Pou, «rogelio 2» y «extra» no se usan. Ya integrado desde `material-tratado/` del thread de material:

- **Personajes y objetos:** Juan Pablo, Roberto, Camila, Alma, Diana, Rogelio, el viejo de la bolsa, el lobo, el celular de Alma, la cámara, los dientes, el pitbull y el Miami.
- **Fondos del mural:** la isla sobre el cielo (p01); el bosque con casas (p03) y la selva (p05) de día; las noches oscurecidas en azul (p06, p08, y p07 con el espacio del mural, como propuesta); el cielo de nubes para el colectivo (p09) y el final (p11).
- **Atardeceres:** al entrar a cada noche se ven los dos dibujos del atardecer, que se funden hasta dejar el fondo de noche (`transicion` en el escenario).

En la pantalla 2 cada dupla se muestra con sus dos personajes (`personajes`) sobre su fondo de día (`fondo`), así que no hacen falta dibujos de las parejas. En la noche de Diana y Rogelio, el truco de la varita se toca sobre Diana, que en su dibujo ya tiene la varita roja.

Material del 3/11 (dibujos nuevos de los chicos), aprobado por David el 11/11: la fiesta de Camila y Alma (fondo de p04, entera; ya trae a Camila y Alma dibujadas, así que sus recortes no se repiten ahí), el colectivo con el mapa del chofer (p09, con los tres destinos ubicados sobre el mapa), los chicos bajando del colectivo (p11), el sobre de la herencia (p07), las monedas (aparecen después del Miami y de la mortal), el reloj (en las tres noches, se balancea con el tic tac), la foto nueva de Tulio (p03) y la ventana del colectivo (p10).

**El viaje (p10)** muestra la ventana que dibujaron los chicos, entera, que se mece con el andar del colectivo (quieta con movimiento reducido). El paisaje del mural ya no se usa ahí.

**Los secretos de día** son doce fichas «No es un… / Es…» de los chicos, cuatro por escena (decisión de David, 11/11). La tarjeta muestra el título impreso de la ficha y lo que escribió cada chico, sin agregar nada:

| Escena | Ficha | Tarjeta |
|---|---|---|
| p03 (Juan Pablo y Roberto) | flor | No es un sombrero · Es… una flor |
| | auto | No es un helado · Es… un auto |
| | gorra | No es un paraguas · Es… una gorra |
| | fantasma | No es un helado · Es… fantasma |
| p04 (Camila y Alma) | muffins | No es un helado · Es… muffins |
| | vincha | No es una estrella · Es… una vincha mágica |
| | globo | No es un huevo · Es… un globo |
| | zanahoria | No es una mariposa · Es… zanahoria |
| p05 (Diana y Rogelio) | pato | No es un sombrero · Es… pato |
| | barco | No es una estrella · Es… un barco |
| | mariquita | No es un huevo · Es… una mariquita |
| | pulpo | No es un helado · Es… un pulpo |

Para revisar con Lucila sobre las fichas:

- En la vincha se agregó la tilde de «mágica» (la ficha dice «magica»). Es el único cambio respecto de lo escrito a mano.
- La ficha del pulpo tiene además tres globitos escritos a mano (una «curiosidad» sobre un hermano, «algo ruidoso» y algo sobre sus tentáculos) que no se leen con seguridad en la foto: no se cargaron. Si el equipo los transcribe, se suman en `interaccion.secreto`.
- Fichas que no se usan todavía (9): abeja, calabaza, carpa, chica endemoniada, economía, físico culturista, globo aerostático, una luz y pata de oso. Las que tienen la letra dudosa o una falta de ortografía (calabaza, abeja, carpa, físico culturista, globo aerostático, pata de oso) necesitan que el equipo confirme cómo se escribe antes de mostrarlas. La de la economía espera que David elija el retoque; la de la luz es un lápiz muy suave.
- El texto de las escenas de día sigue nombrando «una flor», «una piedra» y «un árbol». La flor está en p03; piedra y árbol no hay entre las fichas.

No queda ninguna ilustración PENDIENTE.

### Disposición: pantalla completa y subtítulos (pedido de David, 11/11)

- Cada escena ocupa la pantalla entera. El fondo la cubre y los elementos se ubican en el área que queda arriba de los subtítulos. `x` e `y` son % de esa área; `ancho` está en una unidad que promedia su ancho y su alto, para que un personaje pese parecido en la tablet apaisada y en el celular vertical.
- Los dibujos que tienen que verse enteros (la fiesta de p04, el mapa de p09, la ventana de p10) no se recortan: se muestran completos dentro de esa área.
- El texto va abajo, como subtítulos, de a un tramo que entra en la franja (3 renglones en tablet, 4 en celular). El resto se lee con las flechas. El corte es automático, por oraciones, y no cambia ninguna palabra. El texto completo sigue disponible para lectores de pantalla.
- Donde hay narración (la intro y la presentación de cada dupla), los subtítulos avanzan solos, con el tiempo de cada palabra (ver «Subtítulos sincronizados con la voz»). Las narraciones de las duplas son adaptaciones, así que la voz no dice palabra por palabra lo que muestra el subtítulo.
- Las escenas de día y de noche, el colectivo, el viaje y el final todavía no tienen narración: ahí el texto se pasa a mano.
- Mientras queda texto por leer, la flecha de seguir leyendo es el botón amarillo y la acción de la pantalla («Seguir») queda en contorno; al llegar al último tramo se invierte. Se puede avanzar igual en cualquier momento.
- Si el lector toca una flecha mientras suena la narración, los subtítulos esperan 8 segundos y vuelven a seguir la voz.
- En el final, el viejo desaparece cuando el lector llega a «el viejo ya no está» (`desaparece.alLeer` en `historia.json`).

### Audio

Integrados los 12 audios tratados. La narración de Juan Pablo y Roberto es la regrabación del 11/11: ya cuenta lo de Roberto (que lo echen de su casa y Tulio), pero sigue en primera persona, así que el audio no coincide palabra por palabra con el texto en pantalla. Las de Camila y Alma y de Diana y Rogelio quedan como están: no se van a regrabar. La narración de la intro lee el texto tal cual.

Integrados también los tres sonidos libres (CC0) que buscó el thread de material: `sfx-clac-clac`, `sfx-tic-tac` y `sfx-colectivo`. La fuente y la licencia de cada uno están en `scripts/fuentes-sonidos.md` de la rama del material.

**La mezcla** (pedido de David, 11/11) está en `src/audio/sonido.ts`: la voz va siempre adelante. Mientras habla un narrador, el ambiente baja al 20 % y los efectos al 30 %. Los efectos de una pantalla suenan de a uno, en el orden de `efectos`, y se cortan al pasar de pantalla. Cuando hay varios ambientes juntos (la calle, los vecinos y la pelotita en p03), el primero es la base y los otros acompañan más bajo. Falta escucharlo en una tablet real: el navegador de prueba no reproduce los `.m4a`, así que los niveles se midieron, no se oyeron.

### Narraciones que faltan grabar (David las genera con ElevenLabs, 13/11)

Nueve pantallas no tienen narración: los tres días (p03, p04, p05), las tres noches (p06, p07, p08), el colectivo (p09), el viaje (p10) y el final (p11). No hay placeholder en pantalla: hasta que llegue el audio, el texto se pasa a mano.

- Los guiones salen de `historia.json` con `python3 scripts/guiones-narracion.py <carpeta>`: un `.txt` por pantalla, con el texto tal cual. Los del 13/11 están en la Library, en `motor/guiones-narracion/`.
- Cada audio se llama como su pantalla: `narracion-p03-dia-jp-roberto`, `narracion-p09-colectivo`, etc.
- Cuando el audio tratado está en `public/audio/` con ese nombre, `scripts/sincronizar-narracion.py` lo da de alta en `historia.json` y calcula sus tiempos. No hace falta tocar nada más.
- En las noches y en el final la voz va a decir «Clac, clac, clac…» y «Tic… tac…» y esas pantallas ya tienen esos sonidos como efecto al entrar. Cuando estén los audios hay que escuchar si conviene atar el efecto al momento en que la voz lo nombra, bajarlo o sacarlo.

### Subtítulos sincronizados con la voz (pedido de David, 13/11)

- `scripts/sincronizar-narracion.py` transcribe cada narración con Whisper (tiempo de cada palabra), la alinea con el texto de la pantalla y guarda en `historia.json` el campo `tiempos`: el segundo en que empieza cada palabra del texto. El subtítulo cambia 0,2 s antes de la primera palabra del tramo que sigue.
- La introducción lee el texto tal cual (coincide el 97 %). Las tres duplas son adaptaciones en primera persona: coinciden el 82 % (Juan Pablo y Roberto), el 83 % (Camila y Alma) y el 75 % (Diana y Rogelio). Los tramos donde la voz dice otra cosa se reparten entre las palabras que sí coinciden, así que el cambio de subtítulo cae en la frase correcta aunque las palabras no sean las mismas.
- Si se cambia el texto de una pantalla con narración hay que volver a correr el script. Si no, el motor avisa en la consola y vuelve a repartir los subtítulos según el largo del texto.

### Créditos (indicación de Lucila, 13/11)

- No van los nombres de los chicos ni los del equipo. Quedan «Escuela General San Martín», los logos y David Abril con su página.
- Se mantuvo el encabezado «Escribieron, ilustraron y narraron» arriba de la escuela. Si no va, se borra `titulo` en esa sección de `creditos`.
- Logos usados: el horizontal de PESIJuD (con CONICET, UNVM y CCONFINES) y el de la Municipalidad de Villa María, los dos en color sobre una placa clara, sin recolorear. Lucila mandó además el de la Secretaría de Educación (color, negro y blanco) y versiones de PESIJuD sobre fondo azul. El de la Secretaría en color quedó tratado en `material-tratado/logos/`: para cambiarlo alcanza con copiarlo a `public/img/` y cambiar el id en `creditos`. Los originales están en `IMAGENES/logos-2026-11-13/`.
- En el celular el logo de PESIJuD usa la versión apilada (`srcAngosta` en `imagenes`), porque en la horizontal la letra chica no se lee.
- La página de David es `abrilcodes.com`, tomada del dominio donde está publicado el cuento. A confirmar.

### Figura y fondo (pedido de David, 13/11)

Para que los personajes se distingan del mural, el fondo va más transparente sobre una base oscura y con menos color, y los dibujos de encima van más saturados y con sombra. Es todo presentación: los archivos no cambian. Se ajusta en `src/styles/tokens.css` con `--fondo-opacidad` (0,6 de día y 0,8 de noche), `--fondo-saturacion` (0,75) y `--dibujo-saturacion` (1,3). La portada y los dibujos que se muestran enteros (la fiesta, el mapa, la ventana) no se apagan.

### Contenido que tiene que indicar el equipo (no se inventa)

- **De qué color se pone Rogelio de noche.** Está resuelto con un filtro (`.cambia-de-noche` en `src/styles/pantallas.css`); falta saber el color.
- **Variación por destino en el viaje (p10).** Por ahora solo cambia el cartel del colectivo, que muestra el nombre del destino elegido. No se agregó texto. A confirmar con el equipo.

### Para que decida David

- **Erratas del PDF:** las tres aprobadas el 26/10 ya están corregidas («una cámara de fotos que les puede ayudar», «Tic… tac… La noche», «Tocá en el mapa»). Quedan dos comas que separan sujeto y verbo, sin decisión: «Camila y Alma**,** son amigas» y «Rogelio**,** generalmente es negro». Se muestran tal cual.
- **El nombre «Hora de aventura»:** Lucila consultó por los derechos. Si el cuento se publica abierto, puede convenir sumarle algo al título. Para cambiarlo alcanza con `titulo` en `historia.json`.

### Para la sesión de `/design`

Lo que dejaron abierto las critiques de Impeccable del 11/11 (22/32) y del 13/11 (23/32); el detalle está en `.impeccable/critique/`:

- Los colores y la tipografía siguen siendo provisorios (`src/styles/tokens.css`). La franja de subtítulos usa la paleta de noche sobre cualquier imagen.
- La invitación a tocar es un marco rectangular encima del dibujo; sobre los collages oscuros se ve poco. Conviene que la marca salga del propio dibujo.
- La tarjeta del secreto aparece en la esquina opuesta a lo que se tocó. Queda mejor pegada al dibujo.
- El contador de monedas usa una moneda genérica y las que vuelan son las de los chicos.
- Los créditos son una lista corta con la placa de logos. Se pueden vestir con los dibujos de los chicos; las fichas que no entraron como secretos pueden ir ahí.
- No hay forma de volver a la pantalla anterior ni de empezar de nuevo antes del final (para tablets compartidas), ni se ve por dónde va el lector en el cuento.
- El texto de las noches es largo para leerlo por subtítulos (de 9 a 14 tramos). Sin narración, depende de una decisión del equipo.
- Con el mural apagado, el día se parece más a un atardecer que a una mañana (critique del 13/11). Se dejó así porque David pidió el fondo más oscuro; si hace falta, `--fondo-opacidad` vuelve a subir.
- El marco que invita a tocar es dorado sobre el mural apagado y azul sobre la fiesta de Camila y Alma, que va sobre blanco.
- En cada pantalla hay dos formas de avanzar una al lado de la otra: la flecha de seguir leyendo y «Seguir». Un chico puede saltearse la narración sin querer. Cambiarlo toca la regla de que siempre se puede avanzar.
- En la elección, la consigna queda debajo de las tres parejas, y al volver a elegir no se marca cuál ya se jugó.

### Técnico

- **PWA y service worker:** fuera de este PR (prioridad 4 del plan).
- **Verificación de audio con Playwright:** el Chromium del contenedor no decodifica AAC (`.m4a` en AAC da `EncodingError`), porque no trae códecs propietarios. Safari y Chrome de tablets y celulares sí lo decodifican. El recorrido con Playwright comprueba que cada `.m4a` real responde 200 y, para que suene, le sirve al navegador una copia en Opus del mismo audio. La reproducción de los `.m4a` hay que probarla en un dispositivo.

## Tratamiento del material

Registro del thread de material, tal como quedó el 11/11 en el PR #2 (cerrado sin mergear por conflictos; sus scripts entraron después junto con este archivo). Lo que acá figura como «espera aprobación» o «a definir» sobre los dibujos del 3/11, la narración regrabada, los secretos de día y los créditos ya se resolvió: el estado actual está arriba, en «Motor y pantallas».

Material que falta, dudas para el equipo y placeholders en uso. Cada placeholder en
la app se marca visiblemente con la palabra `PENDIENTE` y se anota acá.

Fuente: inventario de la Library del 23/10/2026 (`scripts/inventario.csv`) contra
`especificacion.md` y `Hora_de_aventura.pdf`, actualizado con la revisión de Lucila
del 26/10/2026 y el material que llegó el 3/11/2026 (el último).

### Llegó el 3/11

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

### Narración nueva (llegó el 3/11, se sumó el 11/11)

La regrabación de Juan Pablo y Roberto (`SONIDOS/nuevos-2026-11-03/`), tratada como
`narracion-jp-roberto.m4a`. Reemplaza a la primera versión (guardada en
`material-tratado/descartados/audio/`) e incluye lo que faltaba de Roberto. Sigue en primera
persona, no es el texto exacto del PDF. Espera aprobación.

### No va a llegar

David avisó el 11/11 que ya es todo el material.

| Qué | Pantalla | Cómo queda |
|---|---|---|
| Los secretos de las escenas de día | 3 · 4 · 5 | Sin contenido propio. No se inventa: hay que decidir con el equipo qué hacer con esas pantallas |
| Regrabación de Camila y Alma y de Diana y Rogelio | 3 · 4 · 5 | Quedan las narraciones actuales, que no leen el texto exacto del PDF |
| Lista de dibujos dados vuelta | — | Quedan como están (se giraron los cuatro que se veían mal) |

### Fondos de cada pantalla

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

### Contenido que falta (no se inventa)

- **Pantallas 3 a 5:** qué revela cada secreto. No va a llegar (ver «No va a llegar»).
  - La ficha del pulpo tiene pistas escritas a mano («curiosidad: tiene un hermano», «no le gusta que le toquen los tentáculos»): pueden ser el contenido de su secreto.
  - Si alguno de los dibujos de Pou era un secreto, hay que reemplazarlo.
- **Pantalla 10:** si el viaje cambia según el destino (el PDF no lo diferencia).
- **Créditos:** los nombres de los chicos tal como los indique el equipo (autores, ilustradores y narradores: Lucas, Jere, Juli y Ana Paula narran; en los dibujos aparecen firmas como Lorenzo, Jonatan, Eva, Franco, Lucas y Yazmín).

### Sonidos

Resueltos con sonidos libres (decisión del 26/10): `sfx-clac-clac`, `sfx-tic-tac` y
`sfx-colectivo`, de BigSoundBank, licencia CC0. Fuente de cada uno en
`scripts/fuentes-sonidos.md`. Falta que el equipo los escuche y los apruebe.

### Esperan aprobación

- **«Economía»:** dos retoques para elegir (`scripts/retocar-trazo.py`): solo el trazo
  repasado, o el trazo repasado con un color pálido parejo adentro. Si no convence
  ninguno, queda como está.

### Dudas para el equipo

- **«Cambiar» sin comentario:** los 59 elementos volvieron marcados «cambiar» casi sin
  comentarios; parece un malentendido con el botón de la página. Se trabaja como si
  estuvieran aprobados hasta que Lucila lo confirme.
- **Nombre de la obra:** «Hora de aventura» es el título en Latinoamérica de *Adventure
  Time*. Preguntar dónde se va a publicar; si es abierto, sugerir sumarle algo al nombre.
- **Chica endemoniada:** las puntas de los cuernos quedan apenas cortadas (tocaban el título
  impreso de la ficha). Si molesta, pedir una foto nueva.

### Decidido en la revisión del 26/10

- Criterio de recorte: solo el dibujo, sin textos impresos ni notas.
- Juan Pablo y Roberto quedan como están; el gato «sin nombre aún» es Rogelio.
- `rogelio 2` y `extra` (imágenes prediseñadas) no se usan.
- Pou (`pou-empresario`, `pou-oruga`) sale del material.
- La chica endemoniada va, nombrada solo como «chica endemoniada».
- El celular es de Alma: `obj-celular-de-alma`.
- Las tres erratas del PDF se corrigen (las aplica el motor):
  «donde que les puede ayudar» → «que les puede ayudar»; «Toca en el mapa» → «Tocá en
  el mapa»; «Tic… tac…La noche» → «Tic… tac… La noche».

### Placeholders en uso

Ninguno desde el material. Los que use el motor se anotan en su PR.
