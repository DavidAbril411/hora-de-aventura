import type { Sonido } from '../audio/sonido';
import { palabrasDe, t, tiemposDe } from '../engine/historia';
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
  /** Lo mismo, contando solo letras y signos: para ubicar un fragmento del texto. */
  letras: number;
  /** Palabras del texto hasta el final de esta página, para seguir los tiempos de la narración. */
  palabras: number;
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
  /** Tiempos de la narración, palabra por palabra (`tiempos` en historia.json). */
  tiempos?: string;
  /**
   * Lo que pasa en la escena atado al texto: `hacer` se llama una vez, cuando
   * la voz dice `fragmento` (con los tiempos de la narración) o, si no hay voz,
   * cuando el lector llega al subtítulo que lo contiene. Si está `hasta`, recibe
   * los segundos que la voz tarda en llegar a ese otro fragmento (null sin voz).
   */
  alDecir?: AlDecir[];
}

export interface AlDecir {
  fragmento: string;
  hasta?: string;
  /**
   * `enHora` es true si la voz lo está diciendo justo ahora. Es false sin voz,
   * o si se llegó de golpe (el lector saltó hacia adelante): entonces lo que
   * pasa se encadena en vez de amontonarse.
   */
  hacer: (segundos: number | null, enHora: boolean) => void;
}

/** Si la narración no arranca en este tiempo, lo atado al texto sigue a los subtítulos. */
const ESPERA_VOZ = 4000;
/** Segundos de atraso con los que un momento todavía va con la voz. */
const A_TIEMPO = 0.6;

/** Milisegundos sin tocar las flechas después de los cuales el subtítulo vuelve a seguir la voz. */
const RETOMAR_NARRACION = 8000;
/** El subtítulo cambia un instante antes de que la voz diga su primera palabra. */
const ADELANTO = 0.2;

const sinEspacios = (texto: string) => texto.replace(/\s+/g, '');

/**
 * Parte un párrafo en oraciones sin tocar el texto: corta después de un
 * punto, signo de cierre o puntos suspensivos cuando lo que sigue empieza
 * con mayúscula, raya o signo de apertura.
 */
function oraciones(bloque: BloqueTexto): Oracion[] {
  const texto = typeof bloque === 'string' ? bloque : bloque.texto;
  const destacado = typeof bloque !== 'string';
  const palabras = texto.split(/\s+/).filter(Boolean);
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
 * suena una narración, los subtítulos la acompañan solos, palabra por
 * palabra si la narración tiene tiempos; si el lector toca una flecha,
 * la voz salta al comienzo de ese tramo y sigue desde ahí. El texto completo queda
 * disponible para lectores de pantalla.
 */
export function subtitulos({ titulo, texto, acciones, avisos = [], sonido, tiempos, alDecir = [] }: Opciones): Subtitulos {
  const todas = texto.flatMap(oraciones);
  const tiempoDePalabra = tiemposDe(tiempos, texto);
  let paginas: Pagina[] = [];
  let actual = 0;
  let ultimoToque = -Infinity;
  // Hasta qué punto del texto (contando letras, sin espacios) hay que leer para cada aviso.
  const entero = sinEspacios(todas.map((o) => o.texto).join(''));
  // Y en qué palabra empieza, para seguir los tiempos de la voz.
  const palabras = palabrasDe(texto);
  const palabraDe = (fragmento: string | undefined): number | null => {
    const buscadas = fragmento?.split(/\s+/).filter(Boolean) ?? [];
    if (!buscadas.length) return null;
    for (let i = 0; i + buscadas.length <= palabras.length; i++) {
      if (buscadas.every((b, j) => palabras[i + j] === b)) return i;
    }
    return null;
  };
  const marcas = alDecir.map(({ fragmento, hasta, hacer }) => {
    const buscado = sinEspacios(fragmento);
    const donde = entero.indexOf(buscado);
    return {
      letras: donde === -1 ? entero.length : donde + buscado.length,
      palabra: palabraDe(fragmento),
      palabraHasta: palabraDe(hasta),
      hacer,
      hecho: false,
    };
  });
  // Con narración sincronizada, lo atado al texto espera a la voz. Si la voz
  // no llega, se saltea o termina, sigue a los subtítulos.
  let sinVoz = !tiempoDePalabra || !sonido.desbloqueado || !marcas.length;
  const sinVozDespues = window.setTimeout(() => {
    if (!sonido.narrando) seguirAlTexto();
  }, ESPERA_VOZ);
  const cumplir = (marca: (typeof marcas)[number], segundos: number | null, enHora: boolean) => {
    marca.hecho = true;
    marca.hacer(segundos, enHora);
  };
  /** Sin voz: todo lo que está en el subtítulo actual o antes. */
  const alcanzarTexto = () => {
    const pagina = paginas[actual];
    if (!sinVoz || !pagina || raiz.classList.contains('subtitulos--portada')) return;
    for (const marca of marcas) if (!marca.hecho && pagina.letras >= marca.letras) cumplir(marca, null, false);
  };
  /** Con voz: todo lo que la voz ya dijo. */
  const alcanzarVoz = (segundos: number) => {
    if (!tiempoDePalabra) return;
    for (const marca of marcas) {
      if (marca.hecho || marca.palabra === null) continue;
      const desde = tiempoDePalabra[marca.palabra];
      if (desde > segundos) continue;
      const hasta = marca.palabraHasta === null ? null : tiempoDePalabra[marca.palabraHasta];
      cumplir(marca, hasta === null || hasta <= desde ? null : Math.max(0, hasta - segundos), segundos - desde <= A_TIEMPO);
    }
  };
  const seguirAlTexto = () => {
    sinVoz = true;
    window.clearTimeout(sinVozDespues);
    alcanzarTexto();
  };

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
    let letras = 0;
    let palabras = 0;
    let pagina = '';
    let destacada = false;
    const cerrar = () => {
      if (!pagina) return;
      largo += pagina.length;
      letras += sinEspacios(pagina).length;
      palabras += pagina.split(/\s+/).filter(Boolean).length;
      nuevas.push({ texto: pagina, destacado: destacada, hasta: largo, letras, palabras });
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
    // Mientras queda texto por leer, la flecha de seguir leyendo es lo que más se ve.
    const ultima = indice === paginas.length - 1;
    if (ultima) raiz.classList.add('subtitulos--leido');
    raiz.classList.toggle('subtitulos--leyendo', !ultima && !raiz.classList.contains('subtitulos--leido'));
    alcanzarTexto();
  };

  /** El segundo de la narración en que empieza una página: con los tiempos si están, o por el largo del texto. */
  const inicioDePagina = (indice: number): number | null => {
    if (indice <= 0) return 0;
    if (tiempoDePalabra) return tiempoDePalabra[paginas[indice - 1].palabras] ?? null;
    const duracion = sonido.duracionNarracion;
    const total = paginas[paginas.length - 1].hasta;
    return duracion === null || !total ? null : (paginas[indice - 1].hasta / total) * duracion + 0.05;
  };

  const pasar = (paso: number) => {
    const destino = Math.min(paginas.length - 1, Math.max(0, actual + paso));
    mostrar(destino);
    // Si suena la narración, la voz salta al comienzo de esta página y el subtítulo la sigue desde ahí.
    const inicio = sonido.narrando ? inicioDePagina(destino) : null;
    if (inicio !== null && sonido.irANarracion(inicio)) {
      ultimoToque = -Infinity;
      salto = performance.now();
      return;
    }
    // Si no se puede llevar la voz, la narración no mueve el texto mientras el lector lo maneja.
    ultimoToque = performance.now();
  };

  // Mientras suena la narración, el subtítulo la sigue: con los tiempos de
  // cada palabra si están, o repartido según el largo del texto si no.
  let reloj = 0;
  let salto = -Infinity;
  const acompanar = () => {
    const avance = sonido.avanceNarracion;
    const segundos = sonido.tiempoNarracion;
    if (segundos !== null) alcanzarVoz(segundos);
    if (avance === null || segundos === null || performance.now() - ultimoToque < RETOMAR_NARRACION || !paginas.length) return;
    let indice: number;
    if (tiempoDePalabra) {
      // La página que sigue entra cuando la voz llega a su primera palabra.
      indice = paginas.findIndex((p) => (tiempoDePalabra[p.palabras] ?? Infinity) > segundos + ADELANTO);
    } else {
      const total = paginas[paginas.length - 1].hasta;
      indice = paginas.findIndex((p) => p.hasta / total > avance);
    }
    indice = indice === -1 ? paginas.length - 1 : indice;
    // Justo después de un salto, la voz arranca en el borde de la página: no se vuelve a la anterior.
    if (indice < actual && performance.now() - salto < 1500) return;
    mostrar(indice);
  };
  let narro = false;
  const dejarDeEscuchar = sonido.escuchar((narrando) => {
    window.clearInterval(reloj);
    // La voz terminó o se salteó: lo que falta sigue al texto.
    if (!narrando) {
      if (narro) seguirAlTexto();
      return;
    }
    narro = true;
    window.clearTimeout(sinVozDespues);
    ultimoToque = -Infinity;
    reloj = window.setInterval(acompanar, 100);
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
      window.clearTimeout(sinVozDespues);
    },
  };
}
