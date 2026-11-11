import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaCierre } from '../../engine/tipos';
import { aparecerEnCascada, nubeDePolvo } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario } from '../componentes';
import { iconoSeguir, iconoVolver } from '../iconos';
import { subtitulos } from '../subtitulos';

/**
 * Pantalla 11. El final: el viejo se va en una nube de polvo. Después,
 * los créditos y "Volver a jugar", que lleva a elegir otra dupla.
 */
export function cierre(ctx: Contexto<PantallaCierre>): HTMLElement {
  const { pantalla: p, estado, sonido } = ctx;
  const raiz = h('main', { class: 'disposicion' });
  const dibujo = escenario(p.escenario, p.momento);

  // El viejo desaparece cuando el lector llega al final del texto, no antes.
  const viejo = dibujo.elementos.get('viejo')?.contenedor;
  let espera = 0;
  const alTerminar = () => {
    if (viejo) espera = window.setTimeout(() => void nubeDePolvo(viejo, dibujo.raiz), 1800);
  };
  ctx.alSalir(() => window.clearTimeout(espera));

  const mostrarCreditos = () => {
    sonido.saltear();
    lectura.destruir();
    window.clearTimeout(espera);
    const { creditos } = historia;
    const secciones = creditos.secciones.map((s) =>
      h(
        'section',
        { class: 'creditos__seccion' },
        h('h2', {}, s.titulo),
        s.detalle ? h('p', { class: 'creditos__detalle' }, s.detalle) : null,
        s.nombres.length ? h('ul', {}, ...s.nombres.map((n) => h('li', {}, n))) : null,
        s.pendiente ? h('p', { class: 'aviso-pendiente' }, h('strong', {}, t('pendiente')), ` ${s.pendiente}`) : null,
      ),
    );
    const otraVez = boton(t('volverAJugar'), () => {
      estado.reiniciar();
      ctx.irA(p.reiniciarEn);
    }, { iconoAntes: iconoVolver });
    const lista = h('div', { class: 'creditos__lista' }, ...secciones);
    raiz.className = 'creditos';
    document.documentElement.dataset.creditos = '';
    ctx.alSalir(() => delete document.documentElement.dataset.creditos);
    raiz.replaceChildren(h('h1', { class: 'creditos__titulo', tabindex: '-1' }, creditos.titulo), lista, acciones(otraVez));
    window.scrollTo(0, 0);
    aparecerEnCascada([...lista.children]);
    raiz.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  };

  const lectura = subtitulos({
    titulo: p.titulo,
    texto: p.texto,
    acciones: acciones(boton(t('verCreditos'), mostrarCreditos, { icono: iconoSeguir })),
    avisos: [avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []))],
    sonido,
    alTerminar,
  });
  ctx.alSalir(lectura.destruir);
  raiz.append(dibujo.raiz, lectura.raiz);
  return raiz;
}
