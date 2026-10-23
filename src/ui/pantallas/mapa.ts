import type { Contexto } from '../../engine/motor';
import { historia, t } from '../../engine/historia';
import type { PantallaMapa } from '../../engine/tipos';
import { aparecer, llamarAtencion } from '../animaciones';
import { h } from '../dom';
import { acciones, avisoAudioPendiente, boton, escenario, ilustracion, panelTexto, parrafos } from '../componentes';
import { iconoSeguir } from '../iconos';

/**
 * Pantalla 9. El colectivo llega y el chofer ofrece el mapa: tocar un
 * destino lo elige (define `destino`) y "Subir al colectivo" confirma.
 * La dupla elegida aparece subiendo.
 */
export function mapa(ctx: Contexto<PantallaMapa>): HTMLElement {
  const { pantalla: p, estado } = ctx;
  const dibujo = escenario(p.escenario, p.momento);

  const dupla = estado.get().dupla;
  if (dupla) {
    const pasajeros = h('div', { class: 'pasajeros' }, ilustracion(historia.duplas[dupla].imagen, 'pasajeros__imagen', p.momento));
    dibujo.raiz.append(pasajeros);
  }

  const subir = boton(t('subirAlColectivo'), () => {
    if (estado.get().destino) ctx.avanzar();
    else llamarAtencion([...botones, pista]);
  }, { icono: iconoSeguir });
  const pista = h('p', { class: 'acciones__pista', id: `pista-${p.id}` });

  const botones = p.destinos.map((d) => {
    const b = h(
      'button',
      { type: 'button', class: 'destino', 'aria-pressed': 'false', 'data-destino': d.id, onclick: () => elegir(d.id) },
      h('span', { class: 'destino__punto', 'aria-hidden': 'true' }),
      h('span', { class: 'destino__nombre' }, d.nombre),
    );
    b.style.left = `${d.x}%`;
    b.style.top = `${d.y}%`;
    return b;
  });

  const elegir = (id: string) => {
    estado.set({ destino: id });
    botones.forEach((b) => {
      const elegido = b.dataset.destino === id;
      b.setAttribute('aria-pressed', String(elegido));
      if (elegido) aparecer(b.querySelector('.destino__punto')!);
    });
    actualizar();
  };

  const actualizar = () => {
    const destino = p.destinos.find((d) => d.id === estado.get().destino);
    subir.setAttribute('aria-disabled', String(!destino));
    if (destino) subir.removeAttribute('aria-describedby');
    else subir.setAttribute('aria-describedby', pista.id);
    pista.textContent = destino ? `${t('destinoElegido')}: ${destino.nombre}` : t('elegirDestino');
    pista.classList.toggle('acciones__pista--elegido', !!destino);
  };
  // Si vuelve a esta pantalla con un destino ya elegido, se respeta.
  const previo = estado.get().destino;
  if (previo && p.destinos.some((d) => d.id === previo)) elegir(previo);
  else actualizar();

  const plano = h('div', { class: 'mapa' }, ilustracion(p.mapa, 'mapa__imagen', p.momento), ...botones);
  dibujo.raiz.append(plano);

  const aviso = avisoAudioPendiente(p.narracion, ...(p.ambiente ?? []), ...(p.efectos ?? []));
  const panel = panelTexto(p.titulo, [...parrafos(p.texto), aviso], acciones(pista, subir));
  return h('main', { class: 'disposicion' }, dibujo.raiz, panel);
}
