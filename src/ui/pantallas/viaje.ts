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
 * Con movimiento reducido, los paisajes se funden uno tras otro.
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
  } else {
    // Sin desplazamiento: los paisajes se suceden en el mismo orden, fundiéndose.
    paisaje.classList.add('ventana__paisaje--fundido');
    const vistas = [...paisaje.children] as HTMLElement[];
    vistas.forEach((vista, i) => (vista.style.opacity = i === 0 ? '1' : '0'));
    let actual = 0;
    const pasar = window.setInterval(() => {
      actual += 1;
      if (actual < vistas.length) animate(vistas[actual], { opacity: 1 }, { duration: 0.8 });
      else window.clearInterval(pasar);
    }, 6000);
    ctx.alSalir(() => window.clearInterval(pasar));
  }

  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const panel = panelTexto(p.titulo, [...parrafos(p.texto), aviso], acciones(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir })));
  return h('main', { class: 'disposicion' }, ventana, panel);
}
