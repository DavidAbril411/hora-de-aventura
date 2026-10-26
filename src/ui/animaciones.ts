import { animate, stagger } from 'motion';
import type { Animacion } from '../engine/tipos';
import { h, svg } from './dom';
import { iconoMoneda } from './iconos';

// Curva de salida exponencial: arranca rápido y se asienta suave.
const SALIDA = [0.16, 1, 0.3, 1] as const;

const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Motion no aplica la preferencia del sistema por su cuenta en JavaScript
 * (MotionConfig es solo para React). Igual que su modo "user": con
 * movimiento reducido no hay transformaciones, solo opacidad y brillo.
 */
export function movimientoReducido(): boolean {
  return consulta.matches;
}

export async function entrarPantalla(el: HTMLElement): Promise<void> {
  if (movimientoReducido()) {
    await animate(el, { opacity: [0, 1] }, { duration: 0.2 });
    return;
  }
  await animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: SALIDA });
}

export async function salirPantalla(el: HTMLElement): Promise<void> {
  await animate(el, { opacity: 0 }, { duration: movimientoReducido() ? 0.12 : 0.2 });
}

export function aparecerEnCascada(els: Element[]): void {
  if (!els.length) return;
  if (movimientoReducido()) {
    animate(els, { opacity: [0, 1] }, { duration: 0.2 });
    return;
  }
  animate(els, { opacity: [0, 1], y: [12, 0] }, { duration: 0.5, ease: SALIDA, delay: stagger(0.07) });
}

export function aparecer(el: Element): void {
  if (movimientoReducido()) {
    animate(el, { opacity: [0, 1] }, { duration: 0.2 });
    return;
  }
  animate(el, { opacity: [0, 1], scale: [0.6, 1] }, { type: 'spring', bounce: 0.4, duration: 0.6 });
}

/**
 * El paso del día a la noche: cada imagen se ve un momento y se funde,
 * dejando ver la siguiente, hasta que queda el fondo. Es solo opacidad, así
 * que vale igual con movimiento reducido.
 */
export function fundirTransicion(capas: Element[]): void {
  capas.forEach((capa, i) => {
    animate(capa, { opacity: [1, 0] }, { duration: 1.4, delay: 1 + i * 2.4, ease: 'easeInOut' }).then(() => capa.remove());
  });
}

/** Pulso lento que invita a tocar. Se detiene al descubrir el elemento. */
export function invitarATocar(el: Element): () => void {
  if (movimientoReducido()) return () => {};
  const control = animate(el, { scale: [1, 1.12, 1], opacity: [0.9, 0.35, 0.9] }, {
    duration: 2.2,
    repeat: Infinity,
    ease: 'easeInOut',
  });
  return () => control.stop();
}

/** Un llamado de atención breve: "acá es donde hay que tocar". */
export function llamarAtencion(els: Element[]): void {
  if (!els.length) return;
  if (movimientoReducido()) {
    animate(els, { opacity: [1, 0.3, 1, 0.3, 1] }, { duration: 0.8 });
    return;
  }
  animate(els, { scale: [1, 1.18, 1, 1.12, 1] }, { duration: 0.8, delay: stagger(0.06) });
}

/** La animación de cada elemento al tocarlo. */
export async function animarElemento(el: HTMLElement, tipo: Animacion, escenario: HTMLElement): Promise<void> {
  if (movimientoReducido()) {
    if (tipo === 'flash') return destello(escenario, 0.5);
    await animate(el, { filter: ['brightness(1)', 'brightness(1.35)', 'brightness(1)'] }, { duration: 0.5 });
    return;
  }
  switch (tipo) {
    case 'crecer':
      await animate(el, { scale: [1, 1.7, 1.3] }, { duration: 0.9, ease: SALIDA });
      return;
    case 'brillar':
      await animate(el, { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1.1)'] }, { duration: 0.8 });
      return;
    case 'sacudir':
      await animate(el, { rotate: [0, -7, 6, -4, 3, 0] }, { duration: 0.8 });
      return;
    case 'despertar':
      await animate(el, { y: [0, -18, 0, -7, 0], rotate: [0, -4, 3, 0, 0] }, { duration: 0.9 });
      return;
    case 'miami':
      // La bici se para en una rueda y vuelve a bajar.
      await animate(el, { rotate: [0, -24, -20, -24, 0], y: [0, -10, -12, -10, 0] }, { duration: 1.4, ease: 'easeInOut' });
      return;
    case 'mortal':
      await animate(el, { y: [0, -70, 0], rotate: [0, -360] }, { duration: 1, ease: 'easeInOut' });
      return;
    case 'flash':
      await destello(escenario, 1);
      return;
    case 'destellos':
      await chispas(el, escenario);
      return;
  }
}

async function destello(escenario: HTMLElement, intensidad: number): Promise<void> {
  const capa = h('div', { class: 'flash', 'aria-hidden': 'true' });
  escenario.append(capa);
  await animate(capa, { opacity: [0, intensidad, 0] }, { duration: 0.7, times: [0, 0.1, 1] });
  capa.remove();
}

async function chispas(el: HTMLElement, escenario: HTMLElement): Promise<void> {
  const caja = el.getBoundingClientRect();
  const base = escenario.getBoundingClientRect();
  const cx = caja.left + caja.width / 2 - base.left;
  const cy = caja.top + caja.height / 2 - base.top;
  const piezas = Array.from({ length: 10 }, (_, i) => {
    const p = h('span', { class: 'chispa', 'aria-hidden': 'true' });
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    escenario.append(p);
    return { p, angulo: (i / 10) * Math.PI * 2 };
  });
  await Promise.all(
    piezas.map(({ p, angulo }, i) =>
      animate(
        p,
        { x: [0, Math.cos(angulo) * 90], y: [0, Math.sin(angulo) * 90], scale: [0.2, 1.2, 0], opacity: [1, 1, 0] },
        { duration: 0.9, delay: i * 0.03, ease: SALIDA },
      ),
    ),
  );
  piezas.forEach(({ p }) => p.remove());
}

/** Monedas que saltan del elemento y vuelan hasta el contador. */
export async function volarMonedas(desde: HTMLElement, hasta: HTMLElement, cantidad: number): Promise<void> {
  if (movimientoReducido()) {
    await animate(hasta, { opacity: [0.4, 1] }, { duration: 0.4 });
    return;
  }
  const origen = desde.getBoundingClientRect();
  const destino = hasta.getBoundingClientRect();
  const x0 = origen.left + origen.width / 2;
  const y0 = origen.top + origen.height * 0.3;
  const dx = destino.left + destino.width / 2 - x0;
  const dy = destino.top + destino.height / 2 - y0;
  const monedas = Array.from({ length: cantidad }, () => {
    const m = h('span', { class: 'moneda-volando', 'aria-hidden': 'true' }, svg(iconoMoneda));
    m.style.left = `${x0}px`;
    m.style.top = `${y0}px`;
    document.body.append(m);
    return m;
  });
  await Promise.all(
    monedas.map((m, i) =>
      animate(
        m,
        { x: [0, (i - (cantidad - 1) / 2) * 34, dx], y: [0, -80, dy], scale: [0.4, 1.2, 0.7], opacity: [0, 1, 1] },
        { duration: 1.1, delay: i * 0.12, times: [0, 0.35, 1], ease: ['easeOut', 'easeIn'] },
      ),
    ),
  );
  monedas.forEach((m) => m.remove());
  await animate(hasta, { scale: [1, 1.18, 1] }, { duration: 0.35 });
}

/** Agujas del reloj decorativo: van de una hora a otra y se quedan ahí. */
export function moverReloj(horas: Element, minutos: Element, desde: string, hasta: string): void {
  const angulos = (hora: string) => {
    const [hh, mm] = hora.split(':').map(Number);
    return { h: ((hh % 12) + mm / 60) * 30, m: mm * 6 };
  };
  const a = angulos(desde);
  const b = angulos(hasta);
  if (movimientoReducido()) {
    animate(horas, { rotate: b.h }, { duration: 0 });
    animate(minutos, { rotate: b.m }, { duration: 0 });
    return;
  }
  animate(horas, { rotate: [a.h, b.h] }, { duration: 50, ease: 'linear' });
  animate(minutos, { rotate: [a.m, b.m] }, { duration: 50, ease: 'linear' });
}

/** La nube de polvo del viejo: se eleva y desaparece. */
export async function nubeDePolvo(sobre: HTMLElement, escenario: HTMLElement): Promise<void> {
  const caja = sobre.getBoundingClientRect();
  const base = escenario.getBoundingClientRect();
  const cx = caja.left + caja.width / 2 - base.left;
  const cy = caja.top + caja.height * 0.75 - base.top;
  if (movimientoReducido()) {
    await animate(sobre, { opacity: 0 }, { duration: 0.8 });
    return;
  }
  const bolitas = Array.from({ length: 9 }, (_, i) => {
    const b = h('span', { class: 'polvo', 'aria-hidden': 'true' });
    b.style.left = `${cx + (i - 4) * 14}px`;
    b.style.top = `${cy}px`;
    escenario.append(b);
    return b;
  });
  animate(sobre, { opacity: 0, filter: ['blur(0px)', 'blur(6px)'] }, { duration: 1.2, delay: 0.4 });
  await Promise.all(
    bolitas.map((b, i) =>
      animate(
        b,
        {
          y: [0, -120 - (i % 3) * 30],
          x: [0, (i - 4) * 10],
          scale: [0.4, 2.2],
          opacity: [0, 0.8, 0],
          filter: ['blur(0px)', 'blur(8px)'],
        },
        { duration: 2.6, delay: i * 0.06, ease: SALIDA },
      ),
    ),
  );
  bolitas.forEach((b) => b.remove());
}
