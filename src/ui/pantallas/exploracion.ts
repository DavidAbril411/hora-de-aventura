import type { Contexto } from '../../engine/motor';
import { t } from '../../engine/historia';
import type { Elemento, PantallaExploracion } from '../../engine/tipos';
import { animarElemento, aparecer, invitarATocar, moverReloj, volarMonedas } from '../animaciones';
import { h, svg } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion, panelTexto, parrafos } from '../componentes';
import { iconoCerrar, iconoDescubierto, iconoReloj, iconoSeguir } from '../iconos';

/**
 * Pantallas 3 a 8: el escenario de la dupla, de día o de noche.
 * De día, cada elemento esconde un secreto. De noche, cada truco da monedas.
 * No hay tiempo límite ni forma de perder: el reloj es decorativo.
 */
export function exploracion(ctx: Contexto<PantallaExploracion>): HTMLElement {
  const { pantalla: p, estado } = ctx;
  const requeridas = p.requiereInteracciones ?? 0;
  const tocados = new Set<string>();
  const ocupados = new Set<string>();
  const detenerInvitaciones = new Map<string, () => void>();

  const seguir = boton(t('seguir'), () => {
    if (tocados.size >= requeridas) ctx.avanzar();
  }, { icono: iconoSeguir });
  const pista = h('p', { class: 'acciones__pista', id: `pista-${p.id}` }, t('seguirBloqueado'));
  const actualizarSeguir = () => {
    const listo = tocados.size >= requeridas;
    seguir.setAttribute('aria-disabled', String(!listo));
    if (listo) {
      seguir.removeAttribute('aria-describedby');
      pista.hidden = true;
    } else {
      seguir.setAttribute('aria-describedby', pista.id);
    }
  };
  actualizarSeguir();

  const tarjeta = h('div', { class: 'revelacion', 'aria-live': 'polite' });

  const alTocar = async (el: Elemento, botonEl: HTMLButtonElement, figura: HTMLElement) => {
    const i = el.interaccion!;
    if (ocupados.has(el.id)) return;
    ocupados.add(el.id);
    const primeraVez = !tocados.has(el.id);
    detenerInvitaciones.get(el.id)?.();
    tarjeta.replaceChildren();

    await animarElemento(figura, i.animacion, dibujo.raiz);

    if (i.aparece && primeraVez) {
      const objeto = h('div', { class: 'elemento elemento--aparece' }, h('span', { class: 'elemento__figura' }, ilustracion(i.aparece, 'elemento__imagen', p.momento)));
      objeto.style.left = `${Math.min(el.x + el.ancho, 88)}%`;
      objeto.style.top = `${Math.max(el.y - 18, 14)}%`;
      objeto.style.width = `${el.ancho}%`;
      dibujo.raiz.append(objeto);
      aparecer(objeto);
    }
    if (i.monedas && primeraVez) {
      estado.sumarMonedas(i.monedas);
      void volarMonedas(botonEl, ctx.contadorMonedas(), i.monedas);
    }
    if (i.tipo === 'secreto') mostrarSecreto(el);

    if (primeraVez) {
      tocados.add(el.id);
      botonEl.classList.add('elemento--descubierto');
      botonEl.append(h('span', { class: 'elemento__marca', 'aria-hidden': 'true' }, svg(iconoDescubierto)));
      botonEl.setAttribute('aria-label', `${el.nombre} (${t('descubiertos').toLowerCase()})`);
      actualizarSeguir();
    }
    ocupados.delete(el.id);
  };

  const mostrarSecreto = (el: Elemento) => {
    const secreto = el.interaccion?.secreto;
    const cerrar = h(
      'button',
      { type: 'button', class: 'revelacion__cerrar', 'aria-label': t('cerrar'), onclick: () => tarjeta.replaceChildren() },
      svg(iconoCerrar),
    );
    const cuerpo = secreto
      ? h('p', {}, secreto)
      : h('p', { class: 'revelacion__pendiente' }, h('strong', {}, t('pendiente')), ` ${t('secretoPendiente')}`);
    const contenido = h('div', { class: 'revelacion__tarjeta' }, h('h2', { class: 'revelacion__titulo' }, el.nombre), cuerpo, cerrar);
    tarjeta.replaceChildren(contenido);
    aparecer(contenido);
  };

  const dibujo = escenario(p.escenario, p.momento, (el, b, f) => void alTocar(el, b, f));
  dibujo.raiz.append(tarjeta);

  for (const el of p.escenario.elementos ?? []) {
    if (!el.interaccion) continue;
    const anillo = dibujo.elementos.get(el.id)?.contenedor.querySelector('.elemento__invitacion');
    if (anillo) detenerInvitaciones.set(el.id, invitarATocar(anillo));
  }
  ctx.alSalir(() => detenerInvitaciones.forEach((detener) => detener()));

  if (p.reloj) {
    const reloj = h('div', { class: 'reloj', role: 'img', 'aria-label': t('reloj') }, svg(iconoReloj));
    dibujo.raiz.append(reloj);
    const horas = reloj.querySelector('.reloj__horas');
    const minutos = reloj.querySelector('.reloj__minutos');
    if (horas && minutos) moverReloj(horas, minutos, p.reloj.desde, p.reloj.hasta);
  }

  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const panel = panelTexto(p.titulo, [...parrafos(p.texto), aviso], acciones(pista, seguir));
  return h('main', { class: 'disposicion' }, dibujo.raiz, panel);
}
