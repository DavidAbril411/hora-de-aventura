import { historia, urlPublica } from '../engine/historia';
import type { Audio } from '../engine/tipos';

// Volúmenes relativos. Los archivos ya vienen normalizados por
// scripts/procesar-audio.sh (voz a −16 LUFS, ambiente a −26 LUFS).
const AMBIENTE_NORMAL = 1;
const AMBIENTE_CON_VOZ = 0.3; // ducking mientras habla un narrador
const RAMPA = 0.4; // segundos

export type FinNarracion = 'terminada' | 'salteada' | 'pendiente';
type Oyente = (narrando: boolean) => void;

interface Loop {
  fuente: AudioBufferSourceNode;
  ganancia: GainNode;
}

/**
 * Narraciones, ambiente en loop y efectos, con Web Audio API.
 * Se usa Web Audio (y no <audio>.volume) porque en Safari de iPad el
 * volumen de un elemento <audio> no se puede cambiar, y el ducking lo necesita.
 * El navegador no deja sonar nada hasta que el lector toca algo: por eso
 * todo arranca recién con desbloquear(), que llama el botón "Empezar".
 */
export class Sonido {
  private ctx: AudioContext | null = null;
  private maestro!: GainNode;
  private busAmbiente!: GainNode;
  private busVoz!: GainNode;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private loops = new Map<string, Loop>();
  private ambientePedido: string[] = [];
  private narracion: { fuente: AudioBufferSourceNode; fin: (f: FinNarracion) => void } | null = null;
  private oyentes = new Set<Oyente>();
  silenciado = false;

  get desbloqueado(): boolean {
    return this.ctx !== null;
  }

  async desbloquear(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.maestro = this.ctx.createGain();
      this.maestro.gain.value = this.silenciado ? 0 : 1;
      this.maestro.connect(this.ctx.destination);
      this.busAmbiente = this.ctx.createGain();
      this.busAmbiente.connect(this.maestro);
      this.busVoz = this.ctx.createGain();
      this.busVoz.connect(this.maestro);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.ambiente(this.ambientePedido);
  }

  setSilenciado(silenciado: boolean): void {
    this.silenciado = silenciado;
    if (this.ctx) this.rampa(this.maestro.gain, silenciado ? 0 : 1, 0.15);
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  get narrando(): boolean {
    return this.narracion !== null;
  }

  /** Reproduce una narración. Baja el ambiente mientras dura. */
  async narrar(id: string | undefined): Promise<FinNarracion> {
    this.saltear();
    const datos = id ? historia.audios[id] : undefined;
    if (!datos || datos.pendiente || !this.ctx) return 'pendiente';
    const buffer = await this.cargar(id!, datos);
    if (!buffer || !this.ctx) return 'pendiente';

    const fuente = this.ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.connect(this.busVoz);
    this.rampa(this.busAmbiente.gain, AMBIENTE_CON_VOZ, RAMPA);

    return new Promise<FinNarracion>((resolver) => {
      let resuelta = false;
      const fin = (f: FinNarracion) => {
        if (resuelta) return;
        resuelta = true;
        fuente.onended = null;
        if (this.narracion?.fuente === fuente) {
          this.narracion = null;
          this.rampa(this.busAmbiente.gain, AMBIENTE_NORMAL, RAMPA);
          this.avisar();
        }
        resolver(f);
      };
      fuente.onended = () => fin('terminada');
      this.narracion = { fuente, fin };
      fuente.start();
      this.avisar();
    });
  }

  saltear(): void {
    const actual = this.narracion;
    if (!actual) return;
    actual.fin('salteada');
    try {
      actual.fuente.stop();
    } catch {
      // ya estaba detenida
    }
  }

  /** Deja sonando exactamente estos loops de ambiente, con fundido. */
  ambiente(ids: string[]): void {
    this.ambientePedido = ids;
    if (!this.ctx) return;
    for (const [id, loop] of this.loops) {
      if (ids.includes(id)) continue;
      this.loops.delete(id);
      this.rampa(loop.ganancia.gain, 0, 1);
      loop.fuente.stop(this.ctx.currentTime + 1.1);
    }
    for (const id of ids) {
      if (this.loops.has(id)) continue;
      const datos = historia.audios[id];
      if (!datos || datos.pendiente) continue;
      void this.cargar(id, datos).then((buffer) => {
        if (!buffer || !this.ctx || this.loops.has(id) || !this.ambientePedido.includes(id)) return;
        const fuente = this.ctx.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = true;
        const ganancia = this.ctx.createGain();
        ganancia.gain.value = 0;
        fuente.connect(ganancia).connect(this.busAmbiente);
        fuente.start();
        this.rampa(ganancia.gain, 1, 1.5);
        this.loops.set(id, { fuente, ganancia });
      });
    }
  }

  /** Sonido corto, una sola vez. */
  async efecto(id: string): Promise<void> {
    const datos = historia.audios[id];
    if (!datos || datos.pendiente || !this.ctx) return;
    const buffer = await this.cargar(id, datos);
    if (!buffer || !this.ctx) return;
    const fuente = this.ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.connect(this.busVoz);
    fuente.start();
  }

  /** Precarga en segundo plano los audios de una pantalla. */
  precargar(ids: (string | undefined)[]): void {
    if (!this.ctx) return;
    for (const id of ids) {
      const datos = id ? historia.audios[id] : undefined;
      if (id && datos && !datos.pendiente) void this.cargar(id, datos);
    }
  }

  private cargar(id: string, datos: Audio): Promise<AudioBuffer | null> {
    let promesa = this.buffers.get(id);
    if (!promesa) {
      promesa = fetch(urlPublica(datos.src))
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status} ${datos.src}`);
          return r.arrayBuffer();
        })
        .then((bytes) => this.ctx!.decodeAudioData(bytes))
        .catch((error: unknown) => {
          console.error(`No se pudo cargar el audio "${id}":`, error);
          return null;
        });
      this.buffers.set(id, promesa);
    }
    return promesa;
  }

  private rampa(param: AudioParam, valor: number, segundos: number): void {
    const ahora = this.ctx!.currentTime;
    param.cancelScheduledValues(ahora);
    param.setValueAtTime(param.value, ahora);
    param.linearRampToValueAtTime(valor, ahora + segundos);
  }

  private avisar(): void {
    this.oyentes.forEach((o) => o(this.narrando));
  }
}
