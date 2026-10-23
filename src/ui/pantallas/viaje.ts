import { animate } from 'motion';
import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaViaje } from '../../engine/tipos';
import { movimientoReducido } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, ilustracion, panelTexto, parrafos } from '../componentes';
import { iconoSeguir } from '../iconos';

/**
 * Pantalla 10. Vista por la ventana del colectivo: las capas se desplazan
 * a distinta velocidad (las cercanas, más rápido). El cartel muestra el
 * destino elegido en el mapa.
 */
export function viaje(ctx: Contexto<PantallaViaje>): HTMLElement {
  const { pantalla: p, estado } = ctx;

  const capas = p.capas.map((id, i) =>
    h('div', { class: 'ventana__capa', style: `--capa:${i}` }, ilustracion(id, 'ventana__imagen', p.momento), ilustracion(id, 'ventana__imagen', p.momento)),
  );
  const ventana = h('div', { class: 'escenario ventana' }, ...capas);

  const destinoId = estado.get().destino;
  const destino = historia.pantallas
    .flatMap((x) => (x.tipo === 'mapa' ? x.destinos : []))
    .find((d) => d.id === destinoId);
  if (destino) ventana.append(h('p', { class: 'cartel' }, destino.nombre));

  if (!movimientoReducido()) {
    const controles = capas.map((capa, i) =>
      animate(capa, { x: ['0%', '-50%'] }, { duration: 36 - i * 9, ease: 'linear', repeat: Infinity }),
    );
    ctx.alSalir(() => controles.forEach((c) => c.stop()));
  }

  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const panel = panelTexto(p.titulo, [...parrafos(p.texto), aviso], acciones(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir })));
  return h('main', { class: 'disposicion' }, ventana, panel);
}
