# Pendientes

Material que falta y placeholders en uso. Cada placeholder se ve en pantalla con la palabra **PENDIENTE**. En `src/data/historia.json`, todo lo que tiene `"pendiente": true` todavía no está: al integrar el material aprobado se cambia a `false` (o se borra la clave) y el placeholder desaparece solo.

## Motor y pantallas

### Ilustraciones (todas, hasta que David apruebe la hoja de contactos)

| id en `historia.json` | Qué muestra | Pantallas |
|---|---|---|
| `p01-intro-fondo` | La isla flotante y el pueblo visto desde arriba | p01 |
| `p02-dupla-jp-roberto` | Juan Pablo con su bici y Roberto | p02 |
| `p02-dupla-camila-alma` | Camila y Alma | p02 |
| `p02-dupla-diana-rogelio` | Diana, el hada muñeca, y Rogelio, el gato negro | p02 |
| `personaje-juan-pablo` | Juan Pablo con su bicicleta | p03, p06 |
| `personaje-roberto` | Roberto | p03, p06 |
| `personaje-camila` | Camila | p04 |
| `personaje-alma` | Alma con su celular | p04, p07 |
| `personaje-diana` | Diana, el hada muñeca | p05 |
| `personaje-rogelio` | Rogelio, el gato | p05, p08 |
| `personaje-viejo-de-la-bolsa` | El viejo de la bolsa | p06, p07, p08, p11 |
| `objeto-flor` | Una flor | p03, p04, p05 |
| `objeto-piedra` | Una piedra | p03, p04, p05 |
| `objeto-arbol` | Un árbol | p03, p04, p05 |
| `objeto-dormido` | Un objeto que parece dormido | p03, p04, p05 |
| `objeto-camara` | La cámara de fotos de Camila | p07 |
| `objeto-sobre-herencia` | El sobre de la herencia lleno de pitbulls | p07 |
| `objeto-varita` | La varita mágica de Diana | p08 |
| `objeto-dientes` | Dientes | p08 |
| `objeto-perro-pitbull` | El perrito pitbull | p11 |
| `p03-dia-jp-roberto-fondo` | Las calles y los rincones del pueblo, de día | p03 |
| `p04-dia-camila-alma-fondo` | La fiesta del pueblo, con música, de día | p04 |
| `p05-dia-diana-rogelio-fondo` | El bosque y la laguna, de día | p05 |
| `p06-noche-jp-roberto-fondo` | Las calles del pueblo de noche, con las casas iluminadas | p06 |
| `p07-noche-camila-alma-fondo` | La fiesta del pueblo, de noche | p07 |
| `p08-noche-diana-rogelio-fondo` | El bosque y la laguna, de noche | p08 |
| `p09-colectivo-fondo` | El colectivo llegando con las luces encendidas | p09 |
| `p09-mapa` | El mapa que ofrece el chofer | p09 |
| `p10-viaje-casas` | Las casas del pueblo que quedan atrás | p10 |
| `p10-viaje-bosque` | El bosque entre las nubes | p10 |
| `p10-viaje-laguna` | La laguna bajo la luz de la luna | p10 |
| `p11-cierre-fondo` | Los chicos bajando del colectivo | p11 |

Cuando lleguen las ilustraciones hay que reubicar los elementos tocables (`x`, `y`, `ancho` en `historia.json`) sobre cada fondo. Si no hay ilustraciones de noche, los fondos de noche pueden ser los de día con filtro (la especificación lo permite).

### Audio

Todos los audios de `historia.json` están en `pendiente: true` hasta que David apruebe el informe del thread de material. Los nombres ya coinciden con los del tratamiento: `narracion-intro`, `narracion-jp-roberto`, `narracion-camila-alma`, `narracion-diana-rogelio`, `amb-viento`, `amb-calle`, `amb-vecinos`, `amb-pelotita`, `amb-guitarra`, `amb-loritas`, `sfx-moto`, `sfx-perros` (para el "¡Guau!" de la pantalla 11).

No existen todavía y hay que pedirlos al equipo (lo ideal es que los graben los chicos):
- `sfx-clac-clac`: el "clac, clac, clac" del viejo de la bolsa (p06 a p08 y p11).
- `sfx-tic-tac`: el reloj (p06 a p08).
- `sfx-colectivo`: el colectivo que llega y frena (p09).

### Contenido que tiene que indicar el equipo (no se inventa)

- **Qué revela cada secreto del día** (p03 a p05). Cada escena tiene cuatro elementos tocables sacados del texto (una flor, una piedra, un árbol, un objeto que despierta). La tarjeta del secreto dice PENDIENTE. Se carga en `interaccion.secreto` de cada elemento.
- **Créditos:** los nombres de los chicos (autores, ilustradores y narradores) y del equipo UNVM, tal como los indiquen el equipo y Lucila.
- **De qué color se pone Rogelio de noche.** Está resuelto con un filtro (`.cambia-de-noche` en `src/styles/pantallas.css`); falta saber el color.
- **Variación por destino en el viaje (p10).** Por ahora solo cambia el cartel del colectivo, que muestra el nombre del destino elegido. No se agregó texto. A confirmar con el equipo.

### Para que decida David

- **Narraciones de la pantalla 2 y texto en pantalla.** Según el thread de material, las tres narraciones de las duplas no leen el texto del PDF. Son adaptaciones en primera persona ("Somos Juan Pablo y Roberto…"), y la de Juan Pablo y Roberto termina antes. En pantalla se muestra el texto del PDF, así que el audio y el texto no van a coincidir palabra por palabra.
- **Erratas del PDF**, mostradas tal cual y sin corregir:
  - Escena 3: "tienen una cámara de fotos **donde que** les puede ayudar". Propuesta: "una cámara de fotos que les puede ayudar".
  - Escena 3: "Tic… tac… tic… tac…**La** noche se acerca." Falta un espacio: "tac… La noche".
  - Escena 4: "**Toca** en el mapa el camino elegido." En el resto del cuento se usa voseo ("Tocá para saber…"). Propuesta: "Tocá".
  - Escena 1: "Camila y Alma**,** son amigas" y "Rogelio**,** generalmente es negro". Las comas separan sujeto y verbo. Propuesta: sacarlas.

### Para la sesión de `/design`

- La critique de Impeccable marcó que en tablet horizontal el texto le compite al dibujo. Ya se agrandó la ilustración (dos tercios del ancho, fija mientras se lee) y se sacó el scroll anidado. Queda abierto para `/design` si el texto va al costado, como un epígrafe sobre el dibujo o en páginas que se pasan tocando. En cualquier caso las palabras no cambian, solo cómo se muestran.
- Los créditos son hoy una lista al final. Es el momento en que los autores se ven a sí mismos: vale la pena diseñarlo con los dibujos y los nombres reales.

### Técnico

- **PWA y service worker:** fuera de este PR (prioridad 4 del plan).
- **Verificación de audio con Playwright:** el Chromium del contenedor no decodifica AAC (`.m4a` en AAC da `EncodingError`), porque no trae códecs propietarios. Safari y Chrome de tablets y celulares sí lo decodifican. Para probar el motor de audio acá se usaron tonos de prueba en Opus dentro de MP4. Al integrar los `.m4a` reales, la verificación con Playwright puede confirmar que cada archivo existe y responde 200, pero la reproducción hay que probarla en un dispositivo.
