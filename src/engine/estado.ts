import type { DuplaId } from './tipos';

export interface Estado {
  dupla: DuplaId | null;
  destino: string | null;
  monedas: number;
  /** Elementos ya tocados en cada pantalla, para no repetir monedas al retomar. */
  tocados: Record<string, string[]>;
}

type Oyente = (estado: Readonly<Estado>) => void;

const CLAVE = 'hora-de-aventura:estado';

/**
 * El estado y la pantalla actual se guardan en sessionStorage: si la tablet
 * recarga la página (o alguien tira para abajo sin querer), se sigue donde
 * estaba. Si el navegador no deja guardar, simplemente no se guarda.
 */
function leer(): { estado: Estado; pantalla: string | null; recorrido: string[] } | null {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    if (!datos || typeof datos !== 'object') return null;
    const { dupla = null, destino = null, monedas = 0, tocados = {}, pantalla = null, recorrido = [] } = datos;
    const camino = Array.isArray(recorrido) ? recorrido.filter((id): id is string => typeof id === 'string') : [];
    return { estado: { dupla, destino, monedas: Number(monedas) || 0, tocados }, pantalla, recorrido: camino };
  } catch {
    return null;
  }
}

/** Estado del lector. No hay forma de perder: solo se acumula. */
export class Almacen {
  private estado: Estado;
  private oyentes = new Set<Oyente>();
  /** La pantalla en la que estaba el lector antes de recargar, si había una. */
  readonly pantallaGuardada: string | null;
  /** Las pantallas por las que pasó hasta la guardada, para poder volver atrás después de recargar. */
  readonly recorridoGuardado: string[];
  private pantalla: string | null = null;
  private recorrido: string[] = [];

  constructor() {
    const guardado = leer();
    this.estado = guardado?.estado ?? { dupla: null, destino: null, monedas: 0, tocados: {} };
    this.pantallaGuardada = guardado?.pantalla ?? null;
    this.recorridoGuardado = guardado?.recorrido ?? [];
  }

  get(): Readonly<Estado> {
    return this.estado;
  }

  set(cambios: Partial<Estado>): void {
    this.estado = { ...this.estado, ...cambios };
    this.guardar();
    this.oyentes.forEach((o) => o(this.estado));
  }

  recordarPantalla(id: string, recorrido: string[]): void {
    this.pantalla = id;
    this.recorrido = recorrido;
    this.guardar();
  }

  private guardar(): void {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ ...this.estado, pantalla: this.pantalla, recorrido: this.recorrido }));
    } catch {
      // Sin almacenamiento disponible: se juega igual, sin retomar.
    }
  }

  marcarTocado(pantalla: string, elemento: string): void {
    const previos = this.estado.tocados[pantalla] ?? [];
    if (previos.includes(elemento)) return;
    this.set({ tocados: { ...this.estado.tocados, [pantalla]: [...previos, elemento] } });
  }

  sumarMonedas(cantidad: number): void {
    this.set({ monedas: this.estado.monedas + cantidad });
  }

  /**
   * Elegir dupla. Si cambia (volvió atrás y eligió otra), lo de la anterior
   * no sigue: monedas, destino y lo descubierto arrancan de cero.
   */
  elegirDupla(dupla: DuplaId): void {
    if (this.estado.dupla && this.estado.dupla !== dupla) this.set({ dupla, destino: null, monedas: 0, tocados: {} });
    else this.set({ dupla });
  }

  /** "Volver a jugar": se elige otra dupla desde cero. */
  reiniciar(): void {
    this.set({ dupla: null, destino: null, monedas: 0, tocados: {} });
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    oyente(this.estado);
    return () => this.oyentes.delete(oyente);
  }
}
