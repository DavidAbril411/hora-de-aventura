import { historia, t, urlPublica } from '../engine/historia';
import type { Dupla, Elemento, Escenario, Momento } from '../engine/tipos';
import { fundirTransicion } from './animaciones';
import { h, svg } from './dom';

/** Una ilustración, o un recuadro PENDIENTE si todavía no llegó tratada. */
export function ilustracion(id: string, clase = '', momento?: Momento): HTMLElement {
  const datos = historia.imagenes[id];
  const descripcion = datos?.descripcion ?? id;
  if (!datos || datos.pendiente) {
    return h(
      'div',
      { class: `ilustracion pendiente ${clase}`, role: 'img', 'aria-label': `${t('pendiente')}: ${descripcion}`, 'data-pendiente': id },
      h('span', { class: 'pendiente__marca' }, t('pendiente')),
      h('span', { class: 'pendiente__texto' }, descripcion),
    );
  }
  const noche = momento === 'noche' && datos.cambiaDeColorDeNoche ? ' cambia-de-noche' : '';
  const entero = datos.entero ? ' ilustracion--entera' : '';
  return h('img', {
    class: `ilustracion ${clase}${noche}${entero}`,
    src: urlPublica(datos.src),
    alt: descripcion,
    decoding: 'async',
    draggable: 'false',
  });
}

/** Los dos personajes de una dupla, parados uno al lado del otro. */
export function pareja(dupla: Dupla, clase = '', momento?: Momento): HTMLElement {
  return h(
    'div',
    { class: `pareja ${clase}`, role: 'img', 'aria-label': dupla.nombre },
    ...dupla.personajes.map((id) => ilustracion(id, 'pareja__personaje', momento)),
  );
}

/** Aviso visible, en una sola línea, de los audios que todavía no están. */
export function avisoAudioPendiente(...ids: (string | undefined)[]): HTMLElement | null {
  const pendientes = ids
    .filter((id): id is string => !!id && !!historia.audios[id]?.pendiente)
    .filter((id, i, todos) => todos.indexOf(id) === i);
  if (!pendientes.length) return null;
  return h(
    'p',
    { class: 'aviso-pendiente', 'data-pendiente': pendientes.join(' ') },
    h('strong', {}, t('pendiente')),
    ` ${t('sonido')}: ${pendientes.map((id) => historia.audios[id].descripcion).join(' · ')}`,
  );
}

export function boton(
  texto: string,
  alTocar: () => void,
  { variante = 'principal', icono, iconoAntes }: { variante?: 'principal' | 'secundario'; icono?: string; iconoAntes?: string } = {},
): HTMLButtonElement {
  return h(
    'button',
    { type: 'button', class: `boton boton--${variante}`, onclick: () => alTocar() },
    iconoAntes ? svg(iconoAntes) : null,
    h('span', {}, texto),
    icono ? svg(icono) : null,
  );
}

export function acciones(...hijos: (HTMLElement | null)[]): HTMLElement {
  return h('div', { class: 'acciones' }, ...hijos);
}

export interface EscenarioDibujado {
  raiz: HTMLElement;
  /** El área donde van los elementos: la escena sin la franja de subtítulos. */
  juego: HTMLElement;
  elementos: Map<string, { contenedor: HTMLElement; figura: HTMLElement }>;
}

/**
 * La escena a pantalla completa: el fondo la cubre entera y los elementos
 * (personajes, objetos) se ubican en % dentro del área de juego. Los
 * interactivos son botones; los demás, figuras quietas. Sin `fondo`, la
 * escena queda lisa (el interior del colectivo).
 */
export function escenario(
  datos: Partial<Escenario>,
  momento: Momento,
  alTocar?: (el: Elemento, boton: HTMLButtonElement, figura: HTMLElement) => void,
): EscenarioDibujado {
  const juego = h('div', { class: 'escenario__juego' });
  const raiz = h('div', { class: 'escenario' });
  if (datos.fondo) {
    const fondo = ilustracion(datos.fondo, 'escenario__fondo', momento);
    // Un dibujo que tiene que verse entero va en el área de juego, para que los subtítulos no lo tapen.
    const entero = historia.imagenes[datos.fondo]?.entero;
    (entero ? juego : raiz).append(fondo);
    // El mural que cubre la pantalla queda atrás, apagado, para que se distingan los personajes.
    if (!entero) raiz.classList.add('escenario--mural');
  }
  raiz.append(juego);
  const elementos = new Map<string, { contenedor: HTMLElement; figura: HTMLElement }>();
  for (const el of datos.elementos ?? []) {
    const figura = h('span', { class: 'elemento__figura' }, ilustracion(el.imagen, 'elemento__imagen', momento));
    let contenedor: HTMLElement;
    if (el.interaccion && alTocar) {
      const b = h(
        'button',
        { type: 'button', class: 'elemento elemento--tocable', 'aria-label': el.nombre, 'data-elemento': el.id },
        h('span', { class: 'elemento__invitacion', 'aria-hidden': 'true' }),
        figura,
      );
      b.addEventListener('click', () => alTocar(el, b, figura));
      contenedor = b;
    } else {
      contenedor = h('div', { class: 'elemento', 'data-elemento': el.id }, figura);
    }
    ubicar(contenedor, el.x, el.y, el.ancho);
    juego.append(contenedor);
    elementos.set(el.id, { contenedor, figura });
  }
  // La transición tapa toda la escena, personajes incluidos, y se funde para
  // descubrirla. La primera imagen va arriba de todo: es la que se ve primero.
  const transicion = (datos.transicion ?? []).map((id) => ilustracion(id, 'escenario__fondo escenario__transicion', momento));
  if (transicion.length) {
    raiz.append(...[...transicion].reverse());
    fundirTransicion(transicion);
  }
  return { raiz, juego, elementos };
}

/** Ubica un elemento en el área de juego: centro en % y ancho en unidades de escena. */
export function ubicar(el: HTMLElement, x: number, y: number, ancho: number): void {
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
  el.style.setProperty('--ancho', String(ancho));
}
