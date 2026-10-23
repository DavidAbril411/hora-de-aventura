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
  /** Registra algo que hay que limpiar al salir de la pantalla. */
  alSalir: (limpiar: () => void) => void;
  /** El contador de monedas, para que las monedas vuelen hasta ahí. */
  contadorMonedas: () => HTMLElement;
}

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
  private contadorMonedas: () => HTMLElement;

  constructor(
    escena: HTMLElement,
    estado: Almacen,
    sonido: Sonido,
    dibujantes: Record<Pantalla['tipo'], Dibujante>,
    contadorMonedas: () => HTMLElement,
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
    this.irA(valida ? pantalla.id : historia.inicio);
  }

  irA(id: string): void {
    // Una navegación a la vez: un doble toque no apila pantallas.
    this.yendo = this.yendo.then(() => this.cambiar(id)).catch((error: unknown) => console.error(error));
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

  private async cambiar(id: string): Promise<void> {
    const pantalla = pantallaPorId(id);
    const { dupla } = this.estado.get();
    if (pantalla.dupla && pantalla.dupla !== dupla) {
      throw new Error(`La pantalla "${id}" es de la dupla "${pantalla.dupla}", pero la elegida es "${dupla}"`);
    }

    const anterior = this.actual;
    if (anterior) {
      if (anterior.pantalla.id === id) return;
      this.actual = null;
      anterior.limpiezas.forEach((l) => l());
      this.sonido.saltear();
      await salirPantalla(anterior.el);
      anterior.el.remove();
    }

    const limpiezas: (() => void)[] = [];
    const ctx: Contexto = {
      pantalla,
      estado: this.estado,
      sonido: this.sonido,
      avanzar: () => this.avanzar(),
      irA: (destino) => this.irA(destino),
      alSalir: (l) => limpiezas.push(l),
      contadorMonedas: this.contadorMonedas,
    };
    const el = this.dibujantes[pantalla.tipo](ctx);
    el.classList.add('pantalla', `pantalla--${pantalla.tipo}`);
    el.dataset.pantalla = pantalla.id;
    document.documentElement.dataset.momento = pantalla.momento;
    this.actual = { pantalla, el, limpiezas };
    this.estado.recordarPantalla(pantalla.id);

    this.escena.append(el);
    window.scrollTo(0, 0);
    el.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });

    this.sonido.ambiente(pantalla.ambiente ?? []);
    this.sonido.precargar([pantalla.narracion, ...(pantalla.efectos ?? [])]);
    // La intro arranca su narración con "Empezar"; el resto, al entrar.
    if (this.sonido.desbloqueado) {
      if (pantalla.narracion && pantalla.tipo !== 'intro') void this.sonido.narrar(pantalla.narracion);
      pantalla.efectos?.forEach((e) => void this.sonido.efecto(e));
    }
    await entrarPantalla(el);
  }
}
