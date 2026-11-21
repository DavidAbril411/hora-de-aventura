import type { Contexto } from '../../engine/motor';
import { t } from '../../engine/historia';
import type { Elemento, PantallaExploracion } from '../../engine/tipos';
import { animarElemento, apagarBrillo, aparecer, balancearReloj, invitarATocar, llamarAtencion, moverReloj, titilar, volarMonedas } from '../animaciones';
import { h, svg } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion, ubicar } from '../componentes';
import { iconoCerrar, iconoDescubierto, iconoReloj, iconoSeguir } from '../iconos';
import { buscarEnEscenario, momentosNarrados } from '../momentos';
import { subtitulos } from '../subtitulos';

/**
 * Pantallas 3 a 8: el escenario de la dupla, de día o de noche.
 * De día, cada elemento esconde un secreto. De noche, cada truco da monedas.
 * No hay tiempo límite ni forma de perder: el reloj es decorativo.
 */
export function exploracion(ctx: Contexto<PantallaExploracion>): HTMLElement {
  const { pantalla: p, estado } = ctx;
  const requeridas = p.requiereInteracciones ?? 0;
  const objetivo = p.monedasParaSeguir;
  const tocables = (p.escenario.elementos ?? []).filter((el) => el.interaccion);
  const secretos = tocables.filter((el) => el.interaccion!.tipo === 'secreto');
  const tocados = new Set<string>(estado.get().tocados[p.id] ?? []);
  const ocupados = new Set<string>();
  const detenerInvitaciones = new Map<string, () => void>();

  const pista = h('p', { class: 'acciones__pista', id: `pista-${p.id}` });
  // Monedas que ya se sumaron al estado pero todavía están volando al contador:
  // la consigna y «Seguir» cuentan lo que el lector ve llegar.
  let enVuelo = 0;
  const monedasVistas = () => estado.get().monedas - enVuelo;
  const alcanza = () => (objetivo ? monedasVistas() >= objetivo : tocados.size >= requeridas);
  const quedanMonedas = () => tocables.some((el) => el.interaccion?.monedas && !tocados.has(el.id));
  const seguir = boton(t('seguir'), () => {
    if (alcanza()) {
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
    const listo = alcanza();
    seguir.setAttribute('aria-disabled', String(!listo));
    if (listo) seguir.removeAttribute('aria-describedby');
    else seguir.setAttribute('aria-describedby', pista.id);
    const descubiertos = secretos.filter((el) => tocados.has(el.id)).length;
    if (objetivo) {
      const plantilla = !listo ? t('monedasConsigna') : quedanMonedas() ? t('monedasLogradas') : t('monedasTodas');
      pista.textContent = plantilla.replace('{objetivo}', String(objetivo)).replace('{tenes}', String(monedasVistas()));
    } else if (!listo) pista.textContent = t('seguirBloqueado');
    else if (secretos.length) pista.textContent = `${t('descubiertos')}: ${descubiertos} ${t('de')} ${secretos.length}`;
    else pista.textContent = '';
    pista.classList.toggle('acciones__pista--elegido', listo && (secretos.length > 0 || !!objetivo));
  };
  actualizar();
  if (objetivo) ctx.alSalir(estado.escuchar(() => actualizar()));

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
      ubicar(objeto, Math.min(el.x + el.ancho, 88), Math.max(el.y - 18, 14), el.ancho);
      dibujo.juego.append(objeto);
      aparecer(objeto);
    }
    if (i.monedas && primeraVez) {
      // El total se guarda enseguida; el contador las va mostrando a medida que llegan.
      const contador = ctx.contadorMonedas();
      contador.retener();
      let faltan = i.monedas;
      enVuelo += faltan;
      estado.sumarMonedas(i.monedas);
      const sonido = i.sonidoMoneda;
      void volarMonedas(botonEl, contador.el, i.monedas, () => {
        contador.llegaUna();
        if (faltan > 0) { faltan--; enVuelo--; }
        actualizar();
        if (sonido) ctx.sonido.golpe(sonido);
      }, dibujo.raiz).finally(() => {
        enVuelo -= faltan;
        faltan = 0;
        contador.soltar();
        actualizar();
      });
    }
    if (i.tipo === 'secreto') mostrarSecreto(el);

    if (primeraVez && i.tipo === 'escondite') void vaciar(el, botonEl, figura);
    else if (primeraVez) marcarDescubierto(el, botonEl);
    ocupados.delete(el.id);
  };

  // Un escondite que ya dio sus monedas se apaga y deja de ser tocable.
  const vaciar = async (el: Elemento, botonEl: HTMLElement, figura: HTMLElement) => {
    await apagarBrillo(figura);
    botonEl.hidden = true;
    botonEl.setAttribute('aria-label', `${el.nombre} (${t('descubierto')})`);
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
    const contenido = h('div', { class: 'revelacion__tarjeta' }, h('h2', { class: 'revelacion__titulo' }, el.interaccion?.titulo ?? el.nombre), cuerpo, cerrar);
    // La tarjeta va del lado opuesto a lo que se tocó, para no taparlo.
    tarjeta.dataset.lado = el.x < 50 ? 'derecha' : 'izquierda';
    tarjeta.dataset.altura = el.y < 50 ? 'abajo' : 'arriba';
    tarjeta.replaceChildren(contenido);
    aparecer(contenido);
  };

  const dibujo = escenario(p.escenario, p.momento, (el, b, f) => void alTocar(el, b, f));
  ctx.alSalir(dibujo.detener);
  ctx.sonido.precargar(tocables.map((el) => el.interaccion?.sonidoMoneda));
  dibujo.juego.append(tarjeta);
  // Tocar cualquier otra parte del dibujo cierra el secreto.
  dibujo.raiz.addEventListener('click', (e) => {
    const destino = e.target as Element;
    if (!destino.closest('.revelacion__tarjeta, .elemento--tocable')) cerrarTarjeta();
  });

  const invitaLaVoz = new Set((p.momentos ?? []).filter((m) => m.accion === 'invitar' && m.elemento).map((m) => m.elemento!));
  let relojEl: HTMLElement | null = null;
  for (const el of tocables) {
    const contenedor = dibujo.elementos.get(el.id)?.contenedor;
    if (!contenedor) continue;
    // Al retomar después de recargar, lo ya descubierto queda descubierto.
    if (tocados.has(el.id)) {
      if (el.interaccion?.tipo === 'escondite') contenedor.hidden = true;
      else marcarDescubierto(el, contenedor);
      continue;
    }
    const anillo = contenedor.querySelector('.elemento__invitacion');
    const brillo = contenedor.querySelector('.escondite__brillo');
    // Si la narración dice cuándo invitar a tocarlo, espera a ese momento.
    if (anillo && !invitaLaVoz.has(el.id)) detenerInvitaciones.set(el.id, invitarATocar(anillo));
    else if (brillo) detenerInvitaciones.set(el.id, titilar(brillo));
  }
  ctx.alSalir(() => detenerInvitaciones.forEach((detener) => detener()));

  if (p.reloj?.imagen) {
    // El reloj que dibujaron los chicos: no tiene agujas que mover, se balancea con el tic tac.
    const reloj = h('div', { class: 'reloj reloj--dibujo', role: 'img', 'aria-label': t('reloj') }, ilustracion(p.reloj.imagen, 'reloj__imagen', p.momento));
    dibujo.juego.append(reloj);
    relojEl = reloj;
    // El reloj arranca cuando la narración dice que empieza a avanzar.
    if (!p.momentos?.some((m) => m.elemento === 'reloj' && m.accion === 'balancear')) ctx.alSalir(balancearReloj(reloj));
  } else if (p.reloj) {
    const reloj = h('div', { class: 'reloj', role: 'img', 'aria-label': t('reloj') }, svg(iconoReloj));
    dibujo.juego.append(reloj);
    relojEl = reloj;
    const horas = reloj.querySelector('.reloj__horas');
    const minutos = reloj.querySelector('.reloj__minutos');
    if (horas && minutos) moverReloj(horas, minutos, p.reloj.desde, p.reloj.hasta);
  }

  const alDecir = momentosNarrados(p.momentos, {
    sonido: ctx.sonido,
    escenario: dibujo.raiz,
    buscar: buscarEnEscenario(dibujo, relojEl ? { reloj: [relojEl] } : {}),
    invitar: (id) => {
      const anillo = dibujo.elementos.get(id)?.contenedor.querySelector('.elemento__invitacion');
      if (anillo && !tocados.has(id) && !detenerInvitaciones.has(id)) detenerInvitaciones.set(id, invitarATocar(anillo));
    },
    alSalir: ctx.alSalir,
  });
  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const lectura = subtitulos({ titulo: p.titulo, texto: p.texto, acciones: acciones(pista, seguir), avisos: [aviso], sonido: ctx.sonido, tiempos: p.tiempos, alDecir });
  ctx.alSalir(lectura.destruir);
  return h('main', { class: 'disposicion' }, dibujo.raiz, lectura.raiz);
}
