import type { Contexto } from '../../engine/motor';
import { t } from '../../engine/historia';
import type { Elemento, PantallaExploracion } from '../../engine/tipos';
import { animarElemento, aparecer, invitarATocar, llamarAtencion, moverReloj, volarMonedas } from '../animaciones';
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
  const tocables = (p.escenario.elementos ?? []).filter((el) => el.interaccion);
  const secretos = tocables.filter((el) => el.interaccion!.tipo === 'secreto');
  const tocados = new Set<string>(estado.get().tocados[p.id] ?? []);
  const ocupados = new Set<string>();
  const detenerInvitaciones = new Map<string, () => void>();

  const pista = h('p', { class: 'acciones__pista', id: `pista-${p.id}` });
  const seguir = boton(t('seguir'), () => {
    if (tocados.size >= requeridas) {
      ctx.avanzar();
      return;
    }
    // Un botón que no responde parece roto: se señala qué tocar.
    llamarAtencion(
      tocables
        .filter((el) => !tocados.has(el.id))
        .map((el) => dibujo.elementos.get(el.id)?.figura)
        .filter((f): f is HTMLElement => !!f),
    );
    llamarAtencion([pista]);
  }, { icono: iconoSeguir });

  const actualizar = () => {
    const listo = tocados.size >= requeridas;
    seguir.setAttribute('aria-disabled', String(!listo));
    if (listo) seguir.removeAttribute('aria-describedby');
    else seguir.setAttribute('aria-describedby', pista.id);
    const descubiertos = secretos.filter((el) => tocados.has(el.id)).length;
    if (!listo) pista.textContent = t('seguirBloqueado');
    else if (secretos.length) pista.textContent = `${t('descubiertos')}: ${descubiertos} ${t('de')} ${secretos.length}`;
    else pista.textContent = '';
    pista.classList.toggle('acciones__pista--elegido', listo && secretos.length > 0);
  };
  actualizar();

  const tarjeta = h('div', { class: 'revelacion', 'aria-live': 'polite' });
  const cerrarTarjeta = () => tarjeta.replaceChildren();

  const alTocar = async (el: Elemento, botonEl: HTMLButtonElement, figura: HTMLElement) => {
    const i = el.interaccion!;
    if (ocupados.has(el.id)) return;
    ocupados.add(el.id);
    const primeraVez = !tocados.has(el.id);
    detenerInvitaciones.get(el.id)?.();
    cerrarTarjeta();
    if (primeraVez) {
      // "Seguir" se habilita enseguida, sin esperar que termine la animación.
      tocados.add(el.id);
      estado.marcarTocado(p.id, el.id);
      actualizar();
    }

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

    if (primeraVez) marcarDescubierto(el, botonEl);
    ocupados.delete(el.id);
  };

  const marcarDescubierto = (el: Elemento, botonEl: HTMLElement) => {
    botonEl.classList.add('elemento--descubierto');
    botonEl.append(h('span', { class: 'elemento__marca', 'aria-hidden': 'true' }, svg(iconoDescubierto)));
    botonEl.setAttribute('aria-label', `${el.nombre} (${t('descubierto')})`);
  };

  const mostrarSecreto = (el: Elemento) => {
    const secreto = el.interaccion?.secreto;
    const cerrar = h(
      'button',
      { type: 'button', class: 'revelacion__cerrar', 'aria-label': t('cerrar'), onclick: cerrarTarjeta },
      svg(iconoCerrar),
    );
    const cuerpo = secreto
      ? h('p', {}, secreto)
      : h('p', { class: 'revelacion__pendiente' }, h('strong', {}, t('pendiente')), ` ${t('secretoPendiente')}`);
    const contenido = h('div', { class: 'revelacion__tarjeta' }, h('h2', { class: 'revelacion__titulo' }, el.nombre), cuerpo, cerrar);
    // La tarjeta va del lado opuesto a lo que se tocó, para no taparlo.
    tarjeta.dataset.lado = el.x < 50 ? 'derecha' : 'izquierda';
    tarjeta.dataset.altura = el.y < 50 ? 'abajo' : 'arriba';
    tarjeta.replaceChildren(contenido);
    aparecer(contenido);
  };

  const dibujo = escenario(p.escenario, p.momento, (el, b, f) => void alTocar(el, b, f));
  dibujo.raiz.append(tarjeta);
  // Tocar cualquier otra parte del dibujo cierra el secreto.
  dibujo.raiz.addEventListener('click', (e) => {
    const destino = e.target as Element;
    if (!destino.closest('.revelacion__tarjeta, .elemento--tocable')) cerrarTarjeta();
  });

  for (const el of tocables) {
    const contenedor = dibujo.elementos.get(el.id)?.contenedor;
    if (!contenedor) continue;
    // Al retomar después de recargar, lo ya descubierto queda descubierto.
    if (tocados.has(el.id)) {
      marcarDescubierto(el, contenedor);
      continue;
    }
    const anillo = contenedor.querySelector('.elemento__invitacion');
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
