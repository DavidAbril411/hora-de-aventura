import '@fontsource/atkinson-hyperlegible-next/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/pantallas.css';

import { Sonido } from './audio/sonido';
import { Almacen } from './engine/estado';
import { historia, validarHistoria } from './engine/historia';
import { Motor } from './engine/motor';
import { barra } from './ui/barra';
import { cierre } from './ui/pantallas/cierre';
import { eleccion } from './ui/pantallas/eleccion';
import { exploracion } from './ui/pantallas/exploracion';
import { intro } from './ui/pantallas/intro';
import { mapa } from './ui/pantallas/mapa';
import { viaje } from './ui/pantallas/viaje';

const problemas = validarHistoria();
if (problemas.length) console.error('historia.json tiene problemas:\n' + problemas.join('\n'));

document.title = historia.titulo;

const app = document.querySelector<HTMLElement>('#app')!;
const estado = new Almacen();
const sonido = new Sonido();
const controles = barra(estado, sonido);
const escena = document.createElement('div');
escena.className = 'escena';
app.append(controles.raiz, escena);

const motor = new Motor(
  escena,
  estado,
  sonido,
  { intro, 'eleccion-dupla': eleccion, exploracion, mapa, viaje, cierre },
  () => controles.contador,
);
motor.iniciar(estado.pantallaGuardada);

// El navegador habilita el audio con el primer toque. En la intro eso lo hace
// "Empezar"; si se retomó la historia después de recargar, cualquier toque.
document.addEventListener('pointerdown', () => void sonido.desbloquear(), { once: true, capture: true });
