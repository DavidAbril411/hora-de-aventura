import type { Sonido } from '../audio/sonido';
import { t } from '../engine/historia';
import type { BloqueTexto } from '../engine/tipos';
import { cambiarSubtitulo } from './animaciones';
import { h, svg } from './dom';
import { iconoAnterior, iconoSiguiente } from './iconos';

interface Oracion {
  texto: string;
  destacado: boolean;
  /** Primera oración de su párrafo. */
  abreParrafo: boolean;
}

interface Pagina {
  texto: string;
  destacado: boolean;
  /** Caracteres del texto hasta el final de esta página, para seguir a la narración. */
  hasta: number;
}

export interface Subtitulos {
  raiz: HTMLElement;
  destruir: () => void;
}

interface Opciones {
  titulo: string;
  texto: BloqueTexto[];
  /** Los botones de la pantalla (y su pista, si tiene). */
  acciones: HTMLElement;
  avisos?: (HTMLElement | null)[];
  sonido: Sonido;
  /** Se llama una vez, cuando el lector llega al último subtítulo. */
  alTerminar?: () => void;
}

/**
 * Parte un párrafo en oraciones sin tocar el texto: corta después de un
 * punto, signo de cierre o puntos suspensivos cuando lo que sigue empieza
 * con mayúscula, raya o signo de apertura.
 */
function oraciones(bloque: BloqueTexto): Oracion[] {
  const texto = typeof bloque === 'string' ? bloque : bloque.texto;
  const destacado = typeof bloque !== 'string';
  const palabras = texto.split(' ').filter(Boolean);
  const salida: Oracion[] = [];
  let actual: string[] = [];
  palabras.forEach((palabra, i) => {
    actual.push(palabra);
    const siguiente = palabras[i + 1];
    const cierra = /[.!?…]["»”]?$/.test(palabra);
    if (!siguiente || (cierra && /^[—¿¡«“"A-ZÁÉÍÓÚÑ]/.test(siguiente))) {
      salida.push({ texto: actual.join(' '), destacado, abreParrafo: salida.length === 0 });
      actual = [];
    }
  });
  return salida;
}

/**
 * El texto de la pantalla como subtítulos sobre la imagen: se muestra de a
 * un tramo que entra en la franja, y el resto se lee con las flechas. Si
 * suena una narración, los subtítulos la acompañan solos hasta que el
 * lector toca una flecha. El texto completo queda disponible para lectores
 * de pantalla.
 */
export function subtitulos({ titulo, texto, acciones, avisos = [], sonido, alTerminar }: Opciones): Subtitulos {
  const todas = texto.flatMap(oraciones);
  let paginas: Pagina[] = [];
  let actual = 0;
  let manual = false;
  let avisado = false;

  const linea = h('p', { class: 'subtitulo' });
  const medida = h('p', { class: 'subtitulo subtitulo--medida' });
  const caja = h('div', { class: 'subtitulos__texto', 'aria-hidden': 'true' }, linea, medida);
  const cuenta = h('span', { class: 'subtitulos__cuenta', 'aria-hidden': 'true' });
  const anterior = h(
    'button',
    { type: 'button', class: 'subtitulos__paso subtitulos__paso--anterior', 'aria-label': t('leerAnterior'), onclick: () => pasar(-1) },
    svg(iconoAnterior),
  );
  const siguiente = h(
    'button',
    { type: 'button', class: 'subtitulos__paso subtitulos__paso--siguiente', 'aria-label': t('leerSiguiente'), onclick: () => pasar(1) },
    svg(iconoSiguiente),
  );
  const completo = h(
    'div',
    { class: 'sr-only' },
    ...texto.map((b) => h('p', {}, typeof b === 'string' ? b : b.texto)),
  );
  const raiz = h(
    'section',
    { class: 'subtitulos sobre-imagen' },
    h('div', { class: 'subtitulos__cabecera' }, h('h1', { class: 'subtitulos__titulo', tabindex: '-1' }, titulo), cuenta),
    caja,
    completo,
    h('div', { class: 'subtitulos__nav' }, anterior, siguiente),
    ...avisos,
    acciones,
  );

  const cabe = (candidato: string, destacado: boolean): boolean => {
    medida.classList.toggle('subtitulo--destacado', destacado);
    medida.textContent = candidato;
    return medida.scrollHeight <= caja.clientHeight + 1;
  };

  /** Reparte las oraciones en páginas que entran en la franja, midiendo el texto real. */
  const paginar = () => {
    if (!caja.clientHeight || !caja.clientWidth) return;
    const desde = actual > 0 ? (paginas[actual - 1]?.hasta ?? 0) : 0;
    const nuevas: Pagina[] = [];
    let largo = 0;
    let pagina = '';
    let destacada = false;
    const cerrar = () => {
      if (!pagina) return;
      largo += pagina.length;
      nuevas.push({ texto: pagina, destacado: destacada, hasta: largo });
      pagina = '';
    };
    for (const oracion of todas) {
      // Una frase destacada va sola; los párrafos comunes pueden compartir página.
      if (oracion.destacado !== destacada || (oracion.destacado && oracion.abreParrafo)) cerrar();
      destacada = oracion.destacado;
      const union = oracion.abreParrafo ? '\n' : ' ';
      const sumar = (base: string, agregado: string, separador = ' ') => (base ? base + separador + agregado : agregado);
      if (cabe(sumar(pagina, oracion.texto, union), destacada)) {
        pagina = sumar(pagina, oracion.texto, union);
        continue;
      }
      // No entra entera. Si la página ya está bastante llena, la oración
      // empieza en la siguiente; si no, se reparte por palabras para no
      // dejar un subtítulo casi vacío.
      medida.textContent = pagina;
      if (pagina && medida.scrollHeight > caja.clientHeight / 2) cerrar();
      let resto = oracion.texto.split(' ');
      let separador = union;
      while (resto.length) {
        let entran = 0;
        let candidato = pagina;
        while (entran < resto.length && cabe(sumar(candidato, resto[entran], entran ? ' ' : separador), destacada)) {
          candidato = sumar(candidato, resto[entran], entran ? ' ' : separador);
          entran += 1;
        }
        if (entran === resto.length) {
          pagina = candidato;
          break;
        }
        if (!entran && pagina) {
          cerrar();
          continue;
        }
        // Mejor cortar en una coma o dos puntos, si hay uno cerca del final.
        let corte = Math.max(1, entran);
        for (let k = corte; k > Math.ceil(corte * 0.6); k -= 1) {
          if (/[,;:]$/.test(resto[k - 1])) {
            corte = k;
            break;
          }
        }
        pagina = sumar(pagina, resto.slice(0, corte).join(' '), separador);
        cerrar();
        resto = resto.slice(corte);
        separador = ' ';
      }
    }
    cerrar();
    medida.textContent = '';
    paginas = nuevas;
    // Al cambiar el tamaño de la pantalla se retoma desde el mismo punto del texto.
    const donde = paginas.findIndex((p) => p.hasta > desde);
    mostrar(donde === -1 ? Math.max(0, paginas.length - 1) : donde, false);
  };

  const mostrar = (indice: number, conFundido = true) => {
    const pagina = paginas[indice];
    if (!pagina) return;
    const cambio = indice !== actual || linea.textContent !== pagina.texto;
    actual = indice;
    linea.textContent = pagina.texto;
    linea.classList.toggle('subtitulo--destacado', pagina.destacado);
    if (cambio && conFundido) cambiarSubtitulo(linea);
    const varias = paginas.length > 1;
    raiz.classList.toggle('subtitulos--una', !varias);
    cuenta.textContent = varias ? `${indice + 1} / ${paginas.length}` : '';
    anterior.setAttribute('aria-disabled', String(indice === 0));
    siguiente.setAttribute('aria-disabled', String(indice === paginas.length - 1));
    if (indice === paginas.length - 1 && !avisado && !raiz.classList.contains('subtitulos--portada')) {
      avisado = true;
      alTerminar?.();
    }
  };

  const pasar = (paso: number) => {
    // Desde que el lector maneja el texto, la narración deja de moverlo.
    manual = true;
    mostrar(Math.min(paginas.length - 1, Math.max(0, actual + paso)));
  };

  // Mientras suena la narración, el subtítulo sigue su avance (según el largo del texto).
  let reloj = 0;
  const acompanar = () => {
    const avance = sonido.avanceNarracion;
    if (avance === null || manual || !paginas.length) return;
    const total = paginas[paginas.length - 1].hasta;
    const indice = paginas.findIndex((p) => p.hasta / total > avance);
    mostrar(indice === -1 ? paginas.length - 1 : indice);
  };
  const dejarDeEscuchar = sonido.escuchar((narrando) => {
    window.clearInterval(reloj);
    if (!narrando) return;
    manual = false;
    reloj = window.setInterval(acompanar, 250);
    acompanar();
  });

  // La escena deja libre el alto de la franja; el texto se reparte de nuevo si cambia el tamaño.
  const observador = new ResizeObserver(() => {
    raiz.parentElement?.style.setProperty('--alto-subtitulos', `${raiz.offsetHeight}px`);
    paginar();
  });
  observador.observe(raiz);
  observador.observe(caja);
  void document.fonts.ready.then(paginar);

  return {
    raiz,
    destruir: () => {
      observador.disconnect();
      dejarDeEscuchar();
      window.clearInterval(reloj);
    },
  };
}
