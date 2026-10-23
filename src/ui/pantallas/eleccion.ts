import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaEleccion } from '../../engine/tipos';
import { aparecerEnCascada } from '../animaciones';
import { h } from '../dom';
import { avisoAudioPendiente, boton, ilustracion, parrafos } from '../componentes';
import { iconoSeguir, iconoVolver } from '../iconos';

/**
 * Pantalla 2. Tres duplas; tocar una la abre con su presentación y su
 * narración. "Recorrer con ellos" define la dupla. Se puede volver y
 * escuchar otra antes de elegir.
 */
export function eleccion(ctx: Contexto<PantallaEleccion>): HTMLElement {
  const { pantalla: p, sonido, estado } = ctx;
  const raiz = h('main', { class: 'eleccion' });

  const mostrarLista = (enfocar?: string) => {
    sonido.saltear();
    const lista = h(
      'ul',
      { class: 'eleccion__lista' },
      ...p.duplas.map((id) => {
        const dupla = historia.duplas[id];
        return h(
          'li',
          {},
          h(
            'button',
            { type: 'button', class: 'tarjeta-dupla', 'data-dupla': id, onclick: () => mostrarDupla(id) },
            ilustracion(dupla.imagen, 'tarjeta-dupla__imagen'),
            h('span', { class: 'tarjeta-dupla__nombre' }, dupla.nombre),
          ),
        );
      }),
    );
    raiz.replaceChildren(h('h1', { class: 'eleccion__titulo', tabindex: '-1' }, p.titulo), ...parrafos(p.texto), lista);
    aparecerEnCascada([...lista.children]);
    const foco = enfocar ? raiz.querySelector<HTMLElement>(`[data-dupla="${enfocar}"]`) : raiz.querySelector<HTMLElement>('h1');
    foco?.focus({ preventScroll: true });
  };

  const mostrarDupla = (id: string) => {
    const dupla = historia.duplas[id];
    const elegir = boton(t('recorrerConEllos'), () => {
      estado.set({ dupla: id });
      ctx.avanzar();
    }, { icono: iconoSeguir });
    const volver = boton(t('volver'), () => mostrarLista(id), { variante: 'secundario', iconoAntes: iconoVolver });
    const detalle = h(
      'div',
      { class: 'disposicion' },
      h('div', { class: 'escenario escenario--retrato' }, ilustracion(dupla.imagen, 'escenario__fondo')),
      h(
        'section',
        { class: 'panel' },
        h(
          'div',
          { class: 'panel__lectura' },
          h('h1', { class: 'panel__titulo', tabindex: '-1' }, dupla.nombre),
          avisoAudioPendiente(dupla.narracion),
          ...parrafos(dupla.presentacion),
        ),
        h('div', { class: 'acciones' }, volver, elegir),
      ),
    );
    raiz.replaceChildren(detalle);
    window.scrollTo(0, 0);
    aparecerEnCascada([detalle]);
    detalle.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    void sonido.narrar(dupla.narracion);
  };

  mostrarLista();
  return raiz;
}
