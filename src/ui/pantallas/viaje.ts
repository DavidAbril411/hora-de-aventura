import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaViaje } from '../../engine/tipos';
import { mecerVentana } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion } from '../componentes';
import { iconoSeguir } from '../iconos';
import { momentosNarrados } from '../momentos';
import { subtitulos } from '../subtitulos';

/**
 * Pantalla 10. Adentro del colectivo: la ventana que dibujaron los chicos,
 * que se mece con el andar. El cartel muestra el destino elegido en el mapa.
 */
export function viaje(ctx: Contexto<PantallaViaje>): HTMLElement {
  const { pantalla: p, estado } = ctx;
  const dibujo = escenario({}, p.momento);
  dibujo.raiz.classList.add('escenario--interior');

  const ventana = h('div', { class: 'ventana' }, ilustracion(p.ventana, 'ventana__imagen', p.momento));
  dibujo.juego.append(ventana);
  // La ventana se mece cuando la narración dice que el colectivo arranca (sin momentos, desde el principio).
  let dejarDeMecer = () => {};
  const mecer = () => {
    dejarDeMecer();
    dejarDeMecer = mecerVentana(ventana);
  };
  if (!p.momentos?.some((m) => m.elemento === 'ventana' && m.accion === 'balancear')) mecer();
  ctx.alSalir(() => dejarDeMecer());

  const destinoId = estado.get().destino;
  const destino = historia.pantallas
    .flatMap((x) => (x.tipo === 'mapa' ? x.destinos : []))
    .find((d) => d.id === destinoId);
  if (destino) dibujo.juego.append(h('p', { class: 'cartel' }, destino.nombre));

  const lectura = subtitulos({
    titulo: p.titulo,
    texto: p.texto,
    tiempos: p.tiempos,
    acciones: acciones(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir })),
    avisos: [avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []))],
    sonido: ctx.sonido,
    // La ventana se mece mientras la narración cuenta el viaje.
    alDecir: momentosNarrados(p.momentos, {
      sonido: ctx.sonido,
      escenario: dibujo.raiz,
      buscar: (id) => (id === 'ventana' ? [ventana] : []),
      balancear: (id) => {
        if (id !== 'ventana') return false;
        mecer();
        return true;
      },
      frenar: (id) => {
        if (id === 'ventana') dejarDeMecer();
      },
      alSalir: ctx.alSalir,
    }),
  });
  ctx.alSalir(lectura.destruir);
  return h('main', { class: 'disposicion' }, dibujo.raiz, lectura.raiz);
}
