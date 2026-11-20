# Fuentes de los sonidos que no grabaron los chicos

Decisión de la revisión del 26/10: los tres sonidos que faltaban se buscan en bancos libres.
Freesound y Pixabay no responden desde el entorno de trabajo, así que se usó BigSoundBank
(LaSonotheque), de Joseph Sardin: todo su catálogo está bajo **CC0 1.0 (dominio público)**,
uso libre incluso comercial, sin obligación de citar. Igual se cita, por prolijidad.

Los WAV originales están en la Library, en `SONIDOS/libres-cc0/`, y se procesan con
`procesar-audio-lote.sh` (tipo ambiente, −26 LUFS) como el resto.

| Archivo en el repo | Para qué | Fuente | Licencia |
|---|---|---|---|
| `sfx-clac-clac.m4a` | «Clac, clac, clac…» del viejo de la bolsa (pantallas 6 a 8 y 11) | #0514 «Footsteps, Shoe on Concrete», Joseph Sardin — https://bigsoundbank.com/footsteps-shoe-on-concrete-s0514.html | CC0 1.0 |
| `sfx-tic-tac.m4a` | «Tic… tac…» del reloj (pantallas 6 a 8) | #1567 «Grandfather clock, ticking», Joseph Sardin — https://bigsoundbank.com/grandfather-clock-ticking-s1567.html | CC0 1.0 |
| `sfx-risa-viejo.m4a` | La risa del viejo de la bolsa cuando llega (pantallas 6 a 8). Pedido del equipo del 13/11: «un sonido más de miedo» | #0490 «Laughter», «risa de un hombre o de un ogro», Joseph Sardin — https://bigsoundbank.com/laughter-s0490.html | CC0 1.0 |
| `sfx-moneda.m4a` | Cada moneda que llega al contador (pantallas 6 a 8) | #0340 «Coin in cup #2», DavidGreck Sound — https://bigsoundbank.com/coin-in-cup-2-s0340.html | CC0 1.0 |
| `sfx-colectivo.m4a` | El colectivo que llega y frena (pantalla 9) | Armado con `armar-colectivo.sh` a partir de: #0512 «Van that passes slowly» (https://bigsoundbank.com/van-that-passes-slowly-s0512.html), #1145 «Truck engine» (https://bigsoundbank.com/truck-engine-s1145.html) y #1490 «Pneumatic brake released» (https://bigsoundbank.com/pneumatic-brake-released-s1490.html), los tres de Joseph Sardin | CC0 1.0 |

Alternativas guardadas: para la risa del viejo, #0475 «Horrible Laugh #1» (más corta y más
aguda); para la moneda, #0339 «Coin in cup #1» (con rebote). Para el reloj: #2655 «Tic Tac Mechanical Alarm Clock #2» (despertador,
más rápido y agudo), también en `SONIDOS/libres-cc0/`.

Licencia: https://bigsoundbank.com/licenses.html
