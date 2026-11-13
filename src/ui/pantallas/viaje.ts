import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaViaje } from '../../engine/tipos';
import { mecerVentana } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion } from '../componentes';
import { iconoSeguir } from '../iconos';
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
  ctx.alSalir(mecerVentana(ventana));

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
  });
  ctx.alSalir(lectura.destruir);
  return h('main', { class: 'disposicion' }, dibujo.raiz, lectura.raiz);
}
