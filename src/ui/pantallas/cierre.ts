import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaCierre } from '../../engine/tipos';
import { aparecerEnCascada, nubeDePolvo } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion } from '../componentes';
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

  // El viejo desaparece cuando el texto lo cuenta, no antes.
  const seVa = p.desaparece ? dibujo.elementos.get(p.desaparece.elemento)?.contenedor : undefined;
  let espera = 0;
  const desaparecer = () => {
    if (seVa) espera = window.setTimeout(() => void nubeDePolvo(seVa, dibujo.raiz), 900);
  };
  ctx.alSalir(() => window.clearTimeout(espera));

  const mostrarCreditos = () => {
    sonido.saltear();
    lectura.destruir();
    window.clearTimeout(espera);
    const { creditos } = historia;
    const secciones = creditos.secciones.map((s) =>
      h(
        s.titulo ? 'section' : 'div',
        { class: 'creditos__seccion' },
        s.titulo ? h('h2', {}, s.titulo) : null,
        s.detalle ? h('p', { class: 'creditos__detalle' }, s.detalle) : null,
        s.nombres?.length ? h('ul', {}, ...s.nombres.map((n) => h('li', {}, n))) : null,
        s.enlace ? h('a', { class: 'creditos__enlace', href: s.enlace.url, target: '_blank', rel: 'noopener' }, s.enlace.texto) : null,
        s.logos?.length ? h('div', { class: 'creditos__placa' }, ...s.logos.map((id) => ilustracion(id, 'creditos__logo'))) : null,
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
    tiempos: p.tiempos,
    acciones: acciones(boton(t('verCreditos'), mostrarCreditos, { icono: iconoSeguir })),
    avisos: [avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []))],
    sonido,
    alLeer: [{ fragmento: p.desaparece?.alLeer, hacer: desaparecer }],
  });
  ctx.alSalir(lectura.destruir);
  raiz.append(dibujo.raiz, lectura.raiz);
  return raiz;
}
