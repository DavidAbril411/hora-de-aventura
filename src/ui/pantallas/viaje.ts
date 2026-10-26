import { animate } from 'motion';
import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaViaje } from '../../engine/tipos';
import { movimientoReducido } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, ilustracion, panelTexto, parrafos } from '../componentes';
import { iconoSeguir } from '../iconos';

/**
 * Pantalla 10. Vista por la ventana del colectivo: el paisaje (las casas, el
 * bosque, las nubes, la laguna) pasa una sola vez y termina en el último.
 * El cartel muestra el destino elegido en el mapa.
 */
export function viaje(ctx: Contexto<PantallaViaje>): HTMLElement {
  const { pantalla: p, estado } = ctx;

  const paisaje = h('div', { class: 'ventana__paisaje' }, ...p.paisaje.map((id) => ilustracion(id, 'ventana__imagen', p.momento)));
  const ventana = h('div', { class: 'escenario ventana' }, paisaje);

  const destinoId = estado.get().destino;
  const destino = historia.pantallas
    .flatMap((x) => (x.tipo === 'mapa' ? x.destinos : []))
    .find((d) => d.id === destinoId);
  if (destino) ventana.append(h('p', { class: 'cartel' }, destino.nombre));

  if (!movimientoReducido()) {
    let activa = true;
    let control: { stop(): void } | undefined;
    // El recorrido depende del ancho de las imágenes: se mide cuando están listas.
    void Promise.all([...paisaje.querySelectorAll('img')].map((img) => img.decode().catch(() => {})))
      .then(() => new Promise(requestAnimationFrame))
      .then(() => {
        const recorrido = paisaje.scrollWidth - ventana.clientWidth;
        if (activa && recorrido > 0) control = animate(paisaje, { x: [0, -recorrido] }, { duration: 40, ease: 'linear' });
      });
    ctx.alSalir(() => {
      activa = false;
      control?.stop();
    });
  }

  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const panel = panelTexto(p.titulo, [...parrafos(p.texto), aviso], acciones(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir })));
  return h('main', { class: 'disposicion' }, ventana, panel);
}
