import type { Contexto } from '../../engine/motor';
import { t } from '../../engine/historia';
import type { PantallaIntro } from '../../engine/tipos';
import { aparecerEnCascada } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario } from '../componentes';
import { iconoSeguir } from '../iconos';
import { subtitulos } from '../subtitulos';

/**
 * Pantalla 1. Primero solo el título y "Empezar": ese toque habilita el
 * audio del navegador. Después aparecen los subtítulos y arranca la narración.
 */
export function intro(ctx: Contexto<PantallaIntro>): HTMLElement {
  const { pantalla: p, sonido } = ctx;
  const accion = acciones();
  const lectura = subtitulos({
    titulo: p.titulo,
    texto: p.texto,
    acciones: accion,
    avisos: [avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []))],
    sonido,
  });
  lectura.raiz.classList.add('subtitulos--portada');
  ctx.alSalir(lectura.destruir);

  const empezar = boton(t('empezar'), async () => {
    empezar.disabled = true;
    await sonido.desbloquear();
    lectura.raiz.classList.remove('subtitulos--portada');
    accion.replaceChildren(boton(t('seguir'), ctx.avanzar, { icono: iconoSeguir }));
    aparecerEnCascada([...lectura.raiz.children]);
    lectura.raiz.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    void sonido.narrar(p.narracion);
  }, { icono: iconoSeguir });
  accion.append(empezar);

  return h('main', { class: 'disposicion' }, escenario(p.escenario, p.momento).raiz, lectura.raiz);
}
