# Pendientes

Material que falta y placeholders en uso. Cada placeholder se ve en pantalla con la palabra **PENDIENTE**. En `src/data/historia.json`, todo lo que tiene `"pendiente": true` todavía no está: al integrar el material aprobado se cambia a `false` (o se borra la clave) y el placeholder desaparece solo.

## Motor y pantallas

### Ilustraciones

Material aprobado en la revisión con Lucila del 26/10 (lo marcado «cambiar» sin comentario se toma como aprobado; falta que Lucila lo confirme). Pou, «rogelio 2» y «extra» no se usan. Ya integrado desde `material-tratado/` del thread de material:

- **Personajes y objetos:** Juan Pablo, Roberto, Camila, Alma, Diana, Rogelio, el viejo de la bolsa, el lobo, el celular de Alma, la cámara, los dientes, el pitbull y el Miami.
- **Fondos del mural:** la isla sobre el cielo (p01); el bosque con casas (p03) y la selva (p05) de día; las noches oscurecidas en azul (p06, p08, y p07 con el espacio del mural, como propuesta); el paisaje del viaje (p10: casas, bosque, nubes y laguna, que pasan una sola vez por la ventana).
- **Atardeceres:** al entrar a cada noche se ven los dos dibujos del atardecer, que se funden hasta dejar el fondo de noche (`transicion` en el escenario).

En la pantalla 2 cada dupla se muestra con sus dos personajes (`personajes`) sobre su fondo de día (`fondo`), así que no hacen falta dibujos de las parejas. En la noche de Diana y Rogelio, el truco de la varita se toca sobre Diana, que en su dibujo ya tiene la varita roja.

Siguen PENDIENTE:

| id en `historia.json` | Qué muestra | Pantallas | Cuándo |
|---|---|---|---|
| `p04-dia-camila-alma-fondo` | La fiesta del pueblo | p02, p04 | Con los secretos y el dibujo de la fiesta, 27/10 |
| `objeto-flor`, `objeto-piedra`, `objeto-arbol`, `objeto-dormido` | Los cuatro secretos de cada escena de día | p03, p04, p05 | Con los secretos, 27/10 |
| `objeto-sobre-herencia` | El sobre de la herencia lleno de pitbulls | p07 | Dibujo nuevo, 27/10 |
| `p09-colectivo-fondo`, `p09-mapa` | El colectivo y el mapa del chofer | p09 | Dibujo nuevo, 27/10 |
| `p11-cierre-fondo` | Los chicos bajando del colectivo | p11 | Dibujo nuevo, 27/10 |
| `personaje-tulio` | Tulio, el amigo de Roberto (no está en ninguna pantalla todavía) | p03 | Foto nueva, 27/10 |

Los fondos del mural son fotos verticales y la escena es apaisada (4:3), así que se ve la franja del medio de cada una. Las posiciones de los elementos (`x`, `y`, `ancho` en `historia.json`) se vuelven a ajustar cuando lleguen los secretos.

### Audio

Integrados los 12 audios tratados. Las tres narraciones de las duplas (`narracion-jp-roberto`, `narracion-camila-alma`, `narracion-diana-rogelio`) son **provisorias**: los chicos las vuelven a grabar leyendo el texto del cuento (27/10, o 27/11 según el comentario de Lucila; falta confirmar). Hasta entonces el audio no coincide palabra por palabra con el texto en pantalla. Cuando lleguen, alcanza con reemplazar los `.m4a` en `public/audio/`. La narración de la intro queda como está.

Integrados también los tres sonidos libres (CC0) que buscó el thread de material: `sfx-clac-clac`, `sfx-tic-tac` y `sfx-colectivo`. La fuente y la licencia de cada uno están en `scripts/fuentes-sonidos.md` de la rama del material.

### Contenido que tiene que indicar el equipo (no se inventa)

- **Qué revela cada secreto del día** (p03 a p05). Llegan el 27/10. Cada escena tiene cuatro elementos tocables sacados del texto (una flor, una piedra, un árbol, un objeto que despierta). La tarjeta del secreto dice PENDIENTE. Se carga en `interaccion.secreto` de cada elemento.
- **Créditos:** los nombres de los chicos (autores, ilustradores y narradores) y del equipo UNVM, tal como los indiquen el equipo y Lucila.
- **De qué color se pone Rogelio de noche.** Está resuelto con un filtro (`.cambia-de-noche` en `src/styles/pantallas.css`); falta saber el color.
- **Variación por destino en el viaje (p10).** Por ahora solo cambia el cartel del colectivo, que muestra el nombre del destino elegido. No se agregó texto. A confirmar con el equipo.

### Para que decida David

- **Erratas del PDF:** las tres aprobadas el 26/10 ya están corregidas («una cámara de fotos que les puede ayudar», «Tic… tac… La noche», «Tocá en el mapa»). Quedan dos comas que separan sujeto y verbo, sin decisión: «Camila y Alma**,** son amigas» y «Rogelio**,** generalmente es negro». Se muestran tal cual.
- **El nombre «Hora de aventura»:** Lucila consultó por los derechos. Si el cuento se publica abierto, puede convenir sumarle algo al título. Para cambiarlo alcanza con `titulo` en `historia.json`.

### Para la sesión de `/design`

- La critique de Impeccable marcó que en tablet horizontal el texto le compite al dibujo. Ya se agrandó la ilustración (dos tercios del ancho, fija mientras se lee) y se sacó el scroll anidado. Queda abierto para `/design` si el texto va al costado, como un epígrafe sobre el dibujo o en páginas que se pasan tocando. En cualquier caso las palabras no cambian, solo cómo se muestran.
- Los créditos son hoy una lista al final. Es el momento en que los autores se ven a sí mismos: vale la pena diseñarlo con los dibujos y los nombres reales.

### Técnico

- **PWA y service worker:** fuera de este PR (prioridad 4 del plan).
- **Verificación de audio con Playwright:** el Chromium del contenedor no decodifica AAC (`.m4a` en AAC da `EncodingError`), porque no trae códecs propietarios. Safari y Chrome de tablets y celulares sí lo decodifican. El recorrido con Playwright comprueba que cada `.m4a` real responde 200 y, para que suene, le sirve al navegador una copia en Opus del mismo audio. La reproducción de los `.m4a` hay que probarla en un dispositivo.
