import type { Sonido } from '../audio/sonido';
import type { Almacen } from '../engine/estado';
import { t } from '../engine/historia';
import { h, svg } from './dom';
import { iconoMoneda, iconoSaltear, iconoSilencio, iconoSonido } from './iconos';

/**
 * Controles que están en todas las pantallas: silenciar (siempre visible),
 * saltear la narración (mientras suena) y las monedas (cuando hay).
 */
export function barra(estado: Almacen, sonido: Sonido): { raiz: HTMLElement; contador: HTMLElement } {
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
    { type: 'button', class: 'control control--saltear', hidden: true, onclick: () => sonido.saltear() },
    svg(iconoSaltear),
    h('span', {}, t('saltearNarracion')),
  );
  sonido.escuchar((narrando) => {
    saltear.hidden = !narrando;
  });

  const cantidad = h('span', { class: 'monedas__cantidad' }, '0');
  const contador = h(
    'p',
    { class: 'monedas', hidden: true, 'aria-live': 'polite' },
    svg(iconoMoneda),
    h('span', { class: 'sr-only' }, `${t('monedas')}: `),
    cantidad,
  );
  estado.escuchar(({ monedas }) => {
    cantidad.textContent = String(monedas);
    contador.hidden = monedas === 0;
  });

  return { raiz: h('div', { class: 'barra' }, contador, saltear, silenciar), contador };
}
