import type { Sonido } from '../audio/sonido';
import type { AccionMomento, MomentoNarrado } from '../engine/tipos';
import {
  acercarse,
  aparecerDeAPoco,
  balancearReloj,
  destello,
  entrarCorriendo,
  inclinarse,
  irseCaminando,
  llamarAtencion,
  mirarArriba,
  movimientoReducido,
  nubeDePolvo,
  saltarDentro,
} from './animaciones';
import type { EscenarioDibujado } from './componentes';
import type { AlDecir } from './subtitulos';

/** Acciones que empiezan con el elemento oculto: aparece recién cuando la narración lo cuenta. */
const ENTRADAS = new Set<AccionMomento>(['acercarse', 'entrar', 'aparecer']);

/**
 * Sin la voz marcando el ritmo (se lee sin sonido, se salteó la narración o el
 * lector saltó hacia adelante) los momentos van uno detrás de otro, con esta
 * pausa entre medio, para que no se amontonen.
 */
const PAUSA_SIN_VOZ = 800;
/** Lo que dura llegar o irse cuando no hay voz que marque cuánto. */
const DURACION_SIN_VOZ = 1.5;

interface Piezas {
  sonido: Sonido;
  /** La escena entera, para las animaciones que cruzan la pantalla. */
  escenario: HTMLElement;
  /** Lo que se puede mover, por id (elementos de la escena, "fondo", "reloj", "ventana", "mapa", "destinos"). */
  buscar: (id: string) => HTMLElement[];
  /** Algo que la pantalla sabe poner en movimiento a su manera (la ventana que se mece). true si lo hizo. */
  balancear?: (id: string) => boolean;
  /** Lo que ya se está moviendo y se puede frenar (la ventana que se mece). */
  frenar?: (id: string) => void;
  /** Empieza la invitación a tocar de un elemento. */
  invitar?: (id: string) => void;
  /** Registra algo que hay que limpiar al salir de la pantalla. */
  alSalir: (limpiar: () => void) => void;
}

/** Busca en una escena: sus elementos por id (el dibujo, no el botón) y "fondo"; `otras` va primero. */
export function buscarEnEscenario(dibujo: EscenarioDibujado, otras: Record<string, HTMLElement[]> = {}) {
  return (id: string): HTMLElement[] => {
    if (otras[id]) return otras[id];
    if (id === 'fondo') return dibujo.fondo ? [dibujo.fondo] : [];
    const figura = dibujo.elementos.get(id)?.figura;
    return figura ? [figura] : [];
  };
}

const esperar = (ms: number) => new Promise<void>((listo) => window.setTimeout(listo, ms));

/**
 * Lo que pasa en la escena atado a la narración (`momentos` en historia.json):
 * el viejo llega cuando la voz dice que se escucha un ruido, el perrito salta a
 * la bolsa cuando lo cuenta, el reloj arranca con el tic tac. Devuelve los
 * avisos para los subtítulos, que saben cuándo la voz dice cada cosa.
 */
export function momentosNarrados(momentos: MomentoNarrado[] | undefined, piezas: Piezas): AlDecir[] {
  const { sonido, escenario, buscar } = piezas;
  // Lo que entra en escena con la narración no se ve (ni lo anuncia un lector de pantalla) antes.
  const ocultos = new Set<string>();
  for (const m of momentos ?? []) {
    if (!m.elemento || !m.accion || !ENTRADAS.has(m.accion) || ocultos.has(m.elemento)) continue;
    ocultos.add(m.elemento);
    for (const el of buscar(m.elemento)) {
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }
  }

  let vivo = true;
  const relojes: number[] = [];
  piezas.alSalir(() => {
    vivo = false;
    relojes.forEach((r) => window.clearTimeout(r));
  });
  // Lo último que se puso en marcha: lo que llega tarde espera a que termine.
  let ultimo: Promise<void> = Promise.resolve();

  /** Hace un momento y devuelve cuándo termina lo que se ve. */
  const hacer = (m: MomentoNarrado, segundos: number | null, conVoz: boolean): Promise<void> => {
    if (m.efecto) {
      const cortar = sonido.efectoAhora(m.efecto);
      // Con voz, el efecto se apaga cuando la narración pasa a otra cosa (los pasos, cuando el viejo ya llegó).
      if (conVoz && segundos !== null) relojes.push(window.setTimeout(cortar, segundos * 1000));
    }
    if (!m.elemento || !m.accion) return Promise.resolve();
    const objetivos = buscar(m.elemento);
    const duracion = conVoz && segundos !== null ? Math.max(DURACION_SIN_VOZ, segundos) : DURACION_SIN_VOZ;
    const visto = (el: HTMLElement) => {
      el.style.visibility = '';
      el.style.opacity = '';
    };
    const ocultar = (el: HTMLElement) => () => {
      el.style.visibility = 'hidden';
    };
    const animaciones = objetivos.map((el): Promise<void> => {
      switch (m.accion) {
        case 'acercarse': {
          visto(el);
          piezas.alSalir(acercarse(el, 0, duracion));
          // Después de llegar da un paso más, amenazante (ver acercarse).
          return esperar((movimientoReducido() ? 1 : duracion + 1) * 1000);
        }
        case 'entrar':
          visto(el);
          el.style.opacity = '0';
          return entrarCorriendo(el, escenario);
        case 'aparecer':
          return aparecerDeAPoco(el);
        case 'mirarArriba':
          return mirarArriba(el);
        case 'inclinarse':
          return inclinarse(el);
        case 'irse':
          return irseCaminando(el, escenario, duracion).then(ocultar(el));
        case 'saltarA': {
          const destino = m.hacia ? buscar(m.hacia)[0] : undefined;
          return destino ? saltarDentro(el, destino, m.punto).then(ocultar(el)) : Promise.resolve();
        }
        case 'desaparecer':
          return nubeDePolvo(el, escenario).then(ocultar(el));
        case 'balancear':
          if (!piezas.balancear?.(m.elemento!)) piezas.alSalir(balancearReloj(el));
          return Promise.resolve();
        case 'destello':
          return destello(escenario, 0.6);
        default:
          return Promise.resolve();
      }
    });
    if (m.accion === 'invitar') piezas.invitar?.(m.elemento);
    if (m.accion === 'detener') piezas.frenar?.(m.elemento);
    if (m.accion === 'senalar') llamarAtencion(objetivos);
    return Promise.all(animaciones).then(() => {});
  };

  return (momentos ?? []).map((m) => ({
    fragmento: m.alDecir,
    hasta: m.hasta,
    hacer: (segundos, enHora) => {
      if (enHora) {
        // Con la voz: ahora mismo, aunque lo anterior siga andando (la voz marca el ritmo).
        const ahora = hacer(m, segundos, true);
        ultimo = Promise.all([ultimo, ahora]).then(() => {});
        return;
      }
      // Sin voz o de golpe: cuando termine lo anterior, con una pausa.
      ultimo = ultimo
        .then(() => esperar(PAUSA_SIN_VOZ))
        .then(() => (vivo ? hacer(m, null, false) : undefined));
    },
  }));
}
