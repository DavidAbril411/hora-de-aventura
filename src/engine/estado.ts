import type { DuplaId } from './tipos';

export interface Estado {
  dupla: DuplaId | null;
  destino: string | null;
  monedas: number;
}

type Oyente = (estado: Readonly<Estado>) => void;

/** Estado del lector. No hay forma de perder: solo se acumula. */
export class Almacen {
  private estado: Estado = { dupla: null, destino: null, monedas: 0 };
  private oyentes = new Set<Oyente>();

  get(): Readonly<Estado> {
    return this.estado;
  }

  set(cambios: Partial<Estado>): void {
    this.estado = { ...this.estado, ...cambios };
    this.oyentes.forEach((o) => o(this.estado));
  }

  sumarMonedas(cantidad: number): void {
    this.set({ monedas: this.estado.monedas + cantidad });
  }

  /** "Volver a jugar": se elige otra dupla desde cero. */
  reiniciar(): void {
    this.set({ dupla: null, destino: null, monedas: 0 });
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }
}
