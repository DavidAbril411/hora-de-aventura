import { historia, t, urlPublica } from '../engine/historia';
import type { BloqueTexto, Elemento, Escenario, Momento } from '../engine/tipos';
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
  return h('img', {
    class: `ilustracion ${clase}${noche}`,
    src: urlPublica(datos.src),
    alt: descripcion,
    decoding: 'async',
    draggable: 'false',
  });
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

export function parrafos(bloques: BloqueTexto[]): HTMLElement[] {
  return bloques.map((b) =>
    typeof b === 'string' ? h('p', {}, b) : h('p', { class: `texto-${b.estilo}` }, b.texto),
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

/** Panel de lectura: título, avisos, texto y la acción de la pantalla. */
export function panelTexto(titulo: string, cuerpo: (HTMLElement | null)[], acciones: HTMLElement): HTMLElement {
  return h(
    'section',
    { class: 'panel' },
    h(
      'div',
      { class: 'panel__lectura' },
      h('h1', { class: 'panel__titulo', tabindex: '-1' }, titulo),
      ...cuerpo,
    ),
    acciones,
  );
}

export function acciones(...hijos: (HTMLElement | null)[]): HTMLElement {
  return h('div', { class: 'acciones' }, ...hijos);
}

export interface EscenarioDibujado {
  raiz: HTMLElement;
  elementos: Map<string, { contenedor: HTMLElement; figura: HTMLElement }>;
}

/**
 * Fondo + elementos posicionados en % (personajes, objetos).
 * Los elementos interactivos son botones; los demás, figuras quietas.
 */
export function escenario(
  datos: Escenario,
  momento: Momento,
  alTocar?: (el: Elemento, boton: HTMLButtonElement, figura: HTMLElement) => void,
): EscenarioDibujado {
  const raiz = h('div', { class: 'escenario' }, ilustracion(datos.fondo, 'escenario__fondo', momento));
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
    contenedor.style.left = `${el.x}%`;
    contenedor.style.top = `${el.y}%`;
    contenedor.style.width = `${el.ancho}%`;
    raiz.append(contenedor);
    elementos.set(el.id, { contenedor, figura });
  }
  return { raiz, elementos };
}
