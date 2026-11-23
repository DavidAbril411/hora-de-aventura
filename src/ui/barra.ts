import type { Sonido } from '../audio/sonido';
import type { Almacen } from '../engine/estado';
import { t } from '../engine/historia';
import type { ContadorMonedas } from '../engine/motor';
import { contarMoneda } from './animaciones';
import { h, svg } from './dom';
import { iconoEscuchar, iconoMoneda, iconoSaltear, iconoSilencio, iconoSonido, iconoVolver } from './iconos';

/**
 * Controles que están en todas las pantallas: volver (arriba a la izquierda,
 * cuando hay adónde), silenciar (siempre visible), escuchar la voz del
 * narrador (cuando no suena sola), saltear la narración (mientras suena) y
 * las monedas (cuando hay).
 */
export function barra(
  estado: Almacen,
  sonido: Sonido,
): { raiz: HTMLElement; volver: HTMLButtonElement; contador: ContadorMonedas } {
  const silenciar = h('button', { type: 'button', class: 'control control--sonido', 'aria-pressed': 'false' });
  const pintarSonido = () => {
    silenciar.replaceChildren(svg(sonido.silenciado ? iconoSilencio : iconoSonido));
    silenciar.setAttribute('aria-pressed', String(sonido.silenciado));
    silenciar.setAttribute('aria-label', t('silenciar'));
    silenciar.title = sonido.silenciado ? t('activarSonido') : t('silenciar');
  };
  silenciar.addEventListener('click', () => {
    sonido.setSilenciado(!sonido.silenciado);
    pintarSonido();
  });
  pintarSonido();

  const saltear = h(
    'button',
    { type: 'button', class: 'control control--saltear', hidden: true, onclick: () => sonido.saltearPorElLector() },
    svg(iconoSaltear),
    h('span', {}, t('saltearNarracion')),
  );
  const escuchar = h(
    'button',
    { type: 'button', class: 'control control--escuchar', hidden: true, onclick: () => sonido.escucharNarrador() },
    svg(iconoEscuchar),
    h('span', {}, t('escucharNarracion')),
  );
  sonido.escuchar((narrando) => {
    saltear.hidden = !narrando;
    escuchar.hidden = !sonido.hayParaEscuchar;
  });

  const volver = h(
    'button',
    { type: 'button', class: 'control control--volver', hidden: true },
    svg(iconoVolver),
    h('span', {}, t('volver')),
  );

  const cantidad = h('span', { class: 'monedas__cantidad' }, '0');
  const el = h(
    'p',
    { class: 'monedas', hidden: true, 'aria-live': 'polite' },
    svg(iconoMoneda),
    h('span', { class: 'sr-only' }, `${t('monedas')}: `),
    cantidad,
  );
  // Mientras las monedas vuelan, el contador muestra las que ya llegaron.
  let retenidas: number | null = null;
  const pintar = (n: number) => {
    cantidad.textContent = String(n);
    el.hidden = n === 0 && retenidas === null;
  };
  estado.escuchar(({ monedas }) => {
    if (retenidas === null) pintar(monedas);
  });
  const contador: ContadorMonedas = {
    el,
    retener: () => {
      if (retenidas === null) retenidas = Number(cantidad.textContent) || 0;
      pintar(retenidas);
    },
    llegaUna: () => {
      if (retenidas === null) return;
      retenidas = Math.min(retenidas + 1, estado.get().monedas);
      pintar(retenidas);
      contarMoneda(el);
    },
    soltar: () => {
      retenidas = null;
      pintar(estado.get().monedas);
    },
  };

  return { raiz: h('div', { class: 'barra' }, el, escuchar, saltear, silenciar), volver, contador };
}
