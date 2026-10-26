import type { Contexto } from '../../engine/motor';
import { t } from '../../engine/historia';
import type { PantallaIntro } from '../../engine/tipos';
import { aparecerEnCascada } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, panelTexto, parrafos } from '../componentes';
import { iconoSeguir } from '../iconos';

/**
 * Pantalla 1. Primero solo el título y "Empezar": ese toque habilita el
 * audio del navegador. Después aparece el texto y arranca la narración.
 */
export function intro(ctx: Contexto<PantallaIntro>): HTMLElement {
  const { pantalla: p, sonido } = ctx;
  const lectura = h('div', { class: 'intro__texto' });
  const accion = acciones();
  const panel = panelTexto(p.titulo, [lectura], accion);
  panel.classList.add('panel--portada');

  const empezar = boton(t('empezar'), async () => {
    empezar.disabled = true;
    await sonido.desbloquear();
    panel.classList.remove('panel--portada');
    const bloques = parrafos(p.texto);
    const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []));
    lectura.append(...bloques, ...(aviso ? [aviso] : []));
    accion.replaceChildren(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir }));
    aparecerEnCascada([...lectura.children, accion]);
    panel.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    void sonido.narrar(p.narracion);
  }, { icono: iconoSeguir });
  accion.append(empezar);

  return h('main', { class: 'disposicion' }, escenario(p.escenario, p.momento).raiz, panel);
}
