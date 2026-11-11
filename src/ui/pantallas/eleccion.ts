import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { Dupla, PantallaEleccion } from '../../engine/tipos';
import { aparecerEnCascada } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion, pareja } from '../componentes';
import { iconoSeguir, iconoVolver } from '../iconos';
import { subtitulos, type Subtitulos } from '../subtitulos';

/** El escenario de día de la dupla, si ya llegó: sirve de fondo donde se la presenta. */
function fondoDe(dupla: Dupla): string | undefined {
  return dupla.fondo && !historia.imagenes[dupla.fondo]?.pendiente ? dupla.fondo : undefined;
}

/**
 * Pantalla 2. Tres duplas; tocar una la abre con su presentación y su
 * narración. "Recorrer con ellos" define la dupla. Se puede volver y
 * escuchar otra antes de elegir.
 */
export function eleccion(ctx: Contexto<PantallaEleccion>): HTMLElement {
  const { pantalla: p, sonido, estado } = ctx;
  const raiz = h('main', { class: 'eleccion' });
  let lectura: Subtitulos | null = null;
  const cerrarLectura = () => {
    lectura?.destruir();
    lectura = null;
  };
  ctx.alSalir(cerrarLectura);

  const mostrarLista = (enfocar?: string) => {
    sonido.saltear();
    cerrarLectura();
    const lista = h(
      'ul',
      { class: 'eleccion__lista' },
      ...p.duplas.map((id) => {
        const dupla = historia.duplas[id];
        const fondo = fondoDe(dupla);
        return h(
          'li',
          {},
          h(
            'button',
            { type: 'button', class: 'tarjeta-dupla', 'data-dupla': id, onclick: () => mostrarDupla(id) },
            fondo ? ilustracion(fondo, 'tarjeta-dupla__fondo') : null,
            pareja(dupla, 'tarjeta-dupla__pareja'),
            h('span', { class: 'tarjeta-dupla__nombre sobre-imagen' }, dupla.nombre),
          ),
        );
      }),
    );
    const consigna = h(
      'section',
      { class: 'subtitulos subtitulos--consigna sobre-imagen' },
      h('h1', { class: 'subtitulos__consigna', tabindex: '-1' }, p.titulo),
      ...p.texto.map((b) => h('p', {}, typeof b === 'string' ? b : b.texto)),
    );
    raiz.replaceChildren(lista, consigna);
    aparecerEnCascada([...lista.children]);
    const foco = enfocar ? raiz.querySelector<HTMLElement>(`[data-dupla="${enfocar}"]`) : raiz.querySelector<HTMLElement>('h1');
    foco?.focus({ preventScroll: true });
  };

  const mostrarDupla = (id: string) => {
    const dupla = historia.duplas[id];
    const elegir = boton(dupla.botonElegir ?? t('recorrerConEllos'), () => {
      estado.set({ dupla: id });
      ctx.avanzar();
    }, { icono: iconoSeguir });
    const volver = boton(t('volver'), () => mostrarLista(id), { variante: 'secundario', iconoAntes: iconoVolver });
    const dibujo = escenario({ fondo: fondoDe(dupla) }, p.momento);
    dibujo.juego.append(pareja(dupla, 'escenario__pareja'));
    cerrarLectura();
    lectura = subtitulos({
      titulo: dupla.nombre,
      texto: dupla.presentacion,
      acciones: acciones(volver, elegir),
      avisos: [avisoAudioPendiente(dupla.narracion)],
      sonido,
    });
    const detalle = h('div', { class: 'disposicion' }, dibujo.raiz, lectura.raiz);
    raiz.replaceChildren(detalle);
    aparecerEnCascada([detalle]);
    detalle.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    void sonido.narrar(dupla.narracion);
  };

  mostrarLista();
  return raiz;
}
