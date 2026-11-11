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
- Donde hay narración (la intro y la presentación de cada dupla), los subtítulos avanzan solos, repartidos según el largo del texto. Como no hay marcas de tiempo, el acompañamiento es aproximado; y las narraciones de las duplas son adaptaciones, así que la voz no dice palabra por palabra lo que muestra el subtítulo. Si el equipo quiere sincronía exacta hacen falta los tiempos de cada frase.
- Las escenas de día y de noche no tienen narración: ahí el texto se pasa a mano.
- Mientras queda texto por leer, la flecha de seguir leyendo es el botón amarillo y la acción de la pantalla («Seguir») queda en contorno; al llegar al último tramo se invierte. Se puede avanzar igual en cualquier momento.
- Si el lector toca una flecha mientras suena la narración, los subtítulos esperan 8 segundos y vuelven a seguir la voz.
- En el final, el viejo desaparece cuando el lector llega a «el viejo ya no está» (`desaparece.alLeer` en `historia.json`).

### Audio

Integrados los 12 audios tratados. La narración de Juan Pablo y Roberto es la regrabación del 11/11: ya cuenta lo de Roberto (que lo echen de su casa y Tulio), pero sigue en primera persona, así que el audio no coincide palabra por palabra con el texto en pantalla. Las de Camila y Alma y de Diana y Rogelio quedan como están: no se van a regrabar. La narración de la intro lee el texto tal cual.

Integrados también los tres sonidos libres (CC0) que buscó el thread de material: `sfx-clac-clac`, `sfx-tic-tac` y `sfx-colectivo`. La fuente y la licencia de cada uno están en `scripts/fuentes-sonidos.md` de la rama del material.

**La mezcla** (pedido de David, 11/11) está en `src/audio/sonido.ts`: la voz va siempre adelante. Mientras habla un narrador, el ambiente baja al 20 % y los efectos al 30 %. Los efectos de una pantalla suenan de a uno, en el orden de `efectos`, y se cortan al pasar de pantalla. Cuando hay varios ambientes juntos (la calle, los vecinos y la pelotita en p03), el primero es la base y los otros acompañan más bajo. Falta escucharlo en una tablet real: el navegador de prueba no reproduce los `.m4a`, así que los niveles se midieron, no se oyeron.

### Contenido que tiene que indicar el equipo (no se inventa)

- **Créditos:** los nombres de los chicos (autores, ilustradores y narradores) y del equipo UNVM, tal como los indiquen el equipo y Lucila.
- **De qué color se pone Rogelio de noche.** Está resuelto con un filtro (`.cambia-de-noche` en `src/styles/pantallas.css`); falta saber el color.
- **Variación por destino en el viaje (p10).** Por ahora solo cambia el cartel del colectivo, que muestra el nombre del destino elegido. No se agregó texto. A confirmar con el equipo.

### Para que decida David

- **Erratas del PDF:** las tres aprobadas el 26/10 ya están corregidas («una cámara de fotos que les puede ayudar», «Tic… tac… La noche», «Tocá en el mapa»). Quedan dos comas que separan sujeto y verbo, sin decisión: «Camila y Alma**,** son amigas» y «Rogelio**,** generalmente es negro». Se muestran tal cual.
- **El nombre «Hora de aventura»:** Lucila consultó por los derechos. Si el cuento se publica abierto, puede convenir sumarle algo al título. Para cambiarlo alcanza con `titulo` en `historia.json`.

### Para la sesión de `/design`

Lo que dejó abierto la critique de Impeccable del 11/11 (22/32; el detalle está en `.impeccable/critique/`):

- Los colores y la tipografía siguen siendo provisorios (`src/styles/tokens.css`). La franja de subtítulos usa la paleta de noche sobre cualquier imagen.
- La invitación a tocar es un marco rectangular encima del dibujo; sobre los collages oscuros se ve poco. Conviene que la marca salga del propio dibujo.
- La tarjeta del secreto aparece en la esquina opuesta a lo que se tocó. Queda mejor pegada al dibujo.
- El contador de monedas usa una moneda genérica y las que vuelan son las de los chicos.
- Los créditos son hoy una lista al final. Es el momento en que los autores se ven a sí mismos: vale la pena diseñarlo con los dibujos y los nombres reales. Las fichas que no entraron como secretos pueden ir ahí.
- No hay forma de volver a la pantalla anterior ni de empezar de nuevo antes del final (para tablets compartidas), ni se ve por dónde va el lector en el cuento.
- El texto de las noches es largo para leerlo por subtítulos (de 9 a 14 tramos). Sin narración, depende de una decisión del equipo.

### Técnico

- **PWA y service worker:** fuera de este PR (prioridad 4 del plan).
- **Verificación de audio con Playwright:** el Chromium del contenedor no decodifica AAC (`.m4a` en AAC da `EncodingError`), porque no trae códecs propietarios. Safari y Chrome de tablets y celulares sí lo decodifican. El recorrido con Playwright comprueba que cada `.m4a` real responde 200 y, para que suene, le sirve al navegador una copia en Opus del mismo audio. La reproducción de los `.m4a` hay que probarla en un dispositivo.
