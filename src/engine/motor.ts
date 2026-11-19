import type { Sonido } from '../audio/sonido';
import { entrarPantalla, salirPantalla } from '../ui/animaciones';
import type { Almacen } from './estado';
import { historia, pantallaPorId } from './historia';
import type { Pantalla, Siguiente } from './tipos';

export interface Contexto<P extends Pantalla = Pantalla> {
  pantalla: P;
  estado: Almacen;
  sonido: Sonido;
  /** Va a la pantalla que indica "siguiente" en historia.json. */
  avanzar: () => void;
  irA: (id: string) => void;
  /**
   * Lo que hace "Volver" mientras la pantalla está en un estado interno (la
   * presentación de una dupla, los créditos). null: vuelve a la pantalla anterior.
   */
  alVolver: (hacer: (() => void) | null) => void;
  /** Vuelve a dibujar la pantalla actual desde el principio. */
  recargar: () => void;
  /** Registra algo que hay que limpiar al salir de la pantalla. */
  alSalir: (limpiar: () => void) => void;
  /** El contador de monedas, para que las monedas vuelen hasta ahí y se cuenten al llegar. */
  contadorMonedas: () => ContadorMonedas;
}

export interface ContadorMonedas {
  el: HTMLElement;
  /** Deja de mostrar el total real: muestra lo que va llegando, hasta soltar(). */
  retener: () => void;
  /** Suma una moneda a lo que se ve, con su rebote. */
  llegaUna: () => void;
  /** Vuelve a mostrar el total real. */
  soltar: () => void;
}

type OyenteMotor = (puedeVolver: boolean) => void;

export type Dibujante = (ctx: Contexto<any>) => HTMLElement;

/**
 * Motor de escenas. Sabe ir de una pantalla a otra según historia.json y
 * delega el dibujo en un dibujante por tipo de pantalla. Una pantalla nueva
 * de un tipo que ya existe se agrega solo como datos.
 */
export class Motor {
  private actual: { pantalla: Pantalla; el: HTMLElement; limpiezas: (() => void)[] } | null = null;
  private yendo = Promise.resolve();
  private escena: HTMLElement;
  private estado: Almacen;
  private sonido: Sonido;
  private dibujantes: Record<Pantalla['tipo'], Dibujante>;
  private contadorMonedas: () => ContadorMonedas;
  /** Las pantallas por las que pasó el lector, de la primera a la actual. */
  private recorrido: string[] = [];
  private volverInterno: (() => void) | null = null;
  /** Cuál es la visita actual: una pantalla que ya se fue no puede cambiar el "Volver". */
  private visita = 0;
  private oyentes = new Set<OyenteMotor>();

  constructor(
    escena: HTMLElement,
    estado: Almacen,
    sonido: Sonido,
    dibujantes: Record<Pantalla['tipo'], Dibujante>,
    contadorMonedas: () => ContadorMonedas,
  ) {
    this.escena = escena;
    this.estado = estado;
    this.sonido = sonido;
    this.dibujantes = dibujantes;
    this.contadorMonedas = contadorMonedas;
  }

  get pantallaActual(): Pantalla | null {
    return this.actual?.pantalla ?? null;
  }

  /** Arranca en la pantalla guardada si sigue siendo válida; si no, en la intro. */
  iniciar(guardada: string | null = null): void {
    const pantalla = guardada ? historia.pantallas.find((p) => p.id === guardada) : undefined;
    const valida = pantalla && pantalla.tipo !== 'intro' && (!pantalla.dupla || pantalla.dupla === this.estado.get().dupla);
    if (valida) {
      const ids = new Set(historia.pantallas.map((p) => p.id));
      const recorrido = this.estado.recorridoGuardado.filter((id) => ids.has(id));
      this.recorrido = recorrido[recorrido.length - 1] === pantalla.id ? recorrido.slice(0, -1) : [];
    }
    this.irA(valida ? pantalla.id : historia.inicio);
  }

  get puedeVolver(): boolean {
    return this.volverInterno !== null || this.recorrido.length > 1;
  }

  /** "Volver": deshace el estado interno de la pantalla, o va a la pantalla anterior. */
  volver(): void {
    if (this.volverInterno) {
      this.volverInterno();
      return;
    }
    const anterior = this.recorrido[this.recorrido.length - 2];
    if (anterior) this.irA(anterior);
  }

  escuchar(oyente: OyenteMotor): () => void {
    this.oyentes.add(oyente);
    oyente(this.puedeVolver);
    return () => this.oyentes.delete(oyente);
  }

  private avisar(): void {
    this.oyentes.forEach((o) => o(this.puedeVolver));
  }

  irA(id: string, { recargar = false } = {}): void {
    // Una navegación a la vez: un doble toque no apila pantallas.
    this.yendo = this.yendo.then(() => this.cambiar(id, recargar)).catch((error: unknown) => console.error(error));
  }

  avanzar(): void {
    const pantalla = this.actual?.pantalla;
    if (!pantalla) return;
    const id = this.resolver(pantalla.siguiente);
    if (id) this.irA(id);
    else console.error(`La pantalla "${pantalla.id}" no tiene "siguiente" para este estado`);
  }

  private resolver(siguiente: Siguiente | undefined): string | null {
    if (!siguiente) return null;
    if (typeof siguiente === 'string') return siguiente;
    const valor = this.estado.get()[siguiente.segun];
    return valor ? (siguiente.casos[valor] ?? null) : null;
  }

  private async cambiar(id: string, recargar = false): Promise<void> {
    const pantalla = pantallaPorId(id);
    const { dupla } = this.estado.get();
    if (pantalla.dupla && pantalla.dupla !== dupla) {
      throw new Error(`La pantalla "${id}" es de la dupla "${pantalla.dupla}", pero la elegida es "${dupla}"`);
    }

    const anterior = this.actual;
    if (anterior) {
      if (anterior.pantalla.id === id && !recargar) return;
      this.actual = null;
      anterior.limpiezas.forEach((l) => l());
      this.sonido.saltear();
      this.sonido.detenerEfectos();
      await salirPantalla(anterior.el);
      anterior.el.remove();
    }

    const limpiezas: (() => void)[] = [];
    const visita = ++this.visita;
    this.volverInterno = null;
    const ctx: Contexto = {
      pantalla,
      estado: this.estado,
      sonido: this.sonido,
      avanzar: () => this.avanzar(),
      irA: (destino) => this.irA(destino),
      alSalir: (l) => limpiezas.push(l),
      alVolver: (hacer) => {
        if (visita !== this.visita) return;
        this.volverInterno = hacer;
        this.avisar();
      },
      recargar: () => this.irA(pantalla.id, { recargar: true }),
      contadorMonedas: this.contadorMonedas,
    };
    // El recorrido es como el historial: si la pantalla ya estaba (al volver
    // atrás o al volver a jugar), se corta ahí; si no, se suma al final.
    const yaEstaba = this.recorrido.indexOf(id);
    this.recorrido = yaEstaba >= 0 ? this.recorrido.slice(0, yaEstaba + 1) : [...this.recorrido, id];
    const el = this.dibujantes[pantalla.tipo](ctx);
    el.classList.add('pantalla', `pantalla--${pantalla.tipo}`);
    el.dataset.pantalla = pantalla.id;
    document.documentElement.dataset.momento = pantalla.momento;
    this.actual = { pantalla, el, limpiezas };
    this.estado.recordarPantalla(pantalla.id, this.recorrido);
    this.avisar();

    this.escena.append(el);
    window.scrollTo(0, 0);
    el.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });

    this.sonido.ambiente(pantalla.ambiente ?? []);
    this.sonido.precargar([pantalla.narracion, ...(pantalla.efectos ?? [])]);
    // La intro arranca su narración con "Empezar"; el resto, al entrar.
    if (this.sonido.desbloqueado) {
      if (pantalla.narracion && pantalla.tipo !== 'intro') void this.sonido.narrar(pantalla.narracion);
      this.sonido.efectos(pantalla.efectos ?? []);
    }
    await entrarPantalla(el);
  }
}
