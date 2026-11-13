import { historia, urlPublica } from '../engine/historia';
import type { Audio } from '../engine/tipos';

/*
 * La mezcla. Los archivos ya vienen normalizados por scripts/procesar-audio.sh
 * (voz a −16 LUFS; ambiente y efectos a −26 LUFS). Acá se decide quién va
 * adelante: primero la voz, después el efecto del momento y, de fondo, el
 * ambiente. Lo que no es lo principal baja para no taparlo.
 */
const MAESTRO = 0.9; // margen para que la suma no sature
const AMBIENTE = 0.7;
const AMBIENTE_CON_EFECTO = 0.4;
const AMBIENTE_CON_VOZ = 0.2; // unos 24 LU por debajo de la voz
const EFECTO = 0.9;
const EFECTO_CON_VOZ = 0.3;
// Con varios loops de ambiente, el primero es la base y los demás acompañan.
const PESO_ACOMPANIA = 0.5;
const RAMPA = 0.4; // segundos
const PAUSA_ENTRE_EFECTOS = 400; // milisegundos

export type FinNarracion = 'terminada' | 'salteada' | 'pendiente';
type Oyente = (narrando: boolean) => void;

interface Sonando {
  fuente: AudioBufferSourceNode;
  ganancia: GainNode;
}

interface Narracion extends Sonando {
  inicio: number;
  duracion: number;
  fin: (f: FinNarracion) => void;
}

/**
 * Narraciones, ambiente en loop y efectos, con Web Audio API.
 * Se usa Web Audio (y no <audio>.volume) porque en Safari de iPad el
 * volumen de un elemento <audio> no se puede cambiar, y la mezcla lo necesita.
 * El navegador no deja sonar nada hasta que el lector toca algo: por eso
 * todo arranca recién con desbloquear(), que llama el botón "Empezar".
 */
export class Sonido {
  private ctx: AudioContext | null = null;
  private maestro!: GainNode;
  private busAmbiente!: GainNode;
  private busEfectos!: GainNode;
  private busVoz!: GainNode;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private loops = new Map<string, Sonando>();
  private ambientePedido: string[] = [];
  private narracion: Narracion | null = null;
  private efectoActual: Sonando | null = null;
  private turnoEfectos = 0;
  private oyentes = new Set<Oyente>();
  silenciado = false;

  get desbloqueado(): boolean {
    return this.ctx !== null;
  }

  async desbloquear(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.maestro = this.ctx.createGain();
      this.maestro.gain.value = this.silenciado ? 0 : MAESTRO;
      this.maestro.connect(this.ctx.destination);
      this.busAmbiente = this.bus(AMBIENTE);
      this.busEfectos = this.bus(EFECTO);
      this.busVoz = this.bus(1);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.ambiente(this.ambientePedido);
  }

  setSilenciado(silenciado: boolean): void {
    this.silenciado = silenciado;
    if (this.ctx) this.rampa(this.maestro.gain, silenciado ? 0 : MAESTRO, 0.15);
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  get narrando(): boolean {
    return this.narracion !== null;
  }

  /** Cuánto de la narración ya sonó, de 0 a 1. null si no hay narración. */
  get avanceNarracion(): number | null {
    if (!this.narracion || !this.ctx) return null;
    const { inicio, duracion } = this.narracion;
    return Math.min(1, Math.max(0, (this.ctx.currentTime - inicio) / duracion));
  }

  /** Segundos de narración que ya se escucharon. null si no hay narración. */
  get tiempoNarracion(): number | null {
    if (!this.narracion || !this.ctx) return null;
    // Lo que el contexto ya mandó a sonar tarda un poco en salir por el parlante.
    const demora = this.ctx.outputLatency || this.ctx.baseLatency || 0;
    return Math.max(0, this.ctx.currentTime - this.narracion.inicio - demora);
  }

  /** Reproduce una narración. Mientras dura, todo lo demás queda de fondo. */
  async narrar(id: string | undefined): Promise<FinNarracion> {
    this.saltear();
    const datos = id ? historia.audios[id] : undefined;
    if (!datos || datos.pendiente || !this.ctx) return 'pendiente';
    const buffer = await this.cargar(id!, datos);
    if (!buffer || !this.ctx) return 'pendiente';
    // Si mientras cargaba arrancó otra narración, queda una sola.
    this.saltear();

    const sonando = this.sonar(buffer, this.busVoz);
    return new Promise<FinNarracion>((resolver) => {
      let resuelta = false;
      const fin = (f: FinNarracion) => {
        if (resuelta) return;
        resuelta = true;
        sonando.fuente.onended = null;
        if (this.narracion?.fuente === sonando.fuente) {
          this.narracion = null;
          this.mezclar();
          this.avisar();
        }
        resolver(f);
      };
      sonando.fuente.onended = () => fin('terminada');
      this.narracion = { ...sonando, inicio: this.ctx!.currentTime, duracion: buffer.duration, fin };
      this.mezclar();
      this.avisar();
    });
  }

  saltear(): void {
    const actual = this.narracion;
    if (!actual) return;
    actual.fin('salteada');
    this.apagar(actual, 0.12);
  }

  /** Deja sonando exactamente estos loops de ambiente, con fundido. */
  ambiente(ids: string[]): void {
    this.ambientePedido = ids;
    if (!this.ctx) return;
    for (const [id, loop] of this.loops) {
      if (ids.includes(id)) continue;
      this.loops.delete(id);
      this.apagar(loop, 1);
    }
    for (const id of ids) {
      const sonando = this.loops.get(id);
      if (sonando) {
        this.rampa(sonando.ganancia.gain, this.pesoAmbiente(id), 1);
        continue;
      }
      const datos = historia.audios[id];
      if (!datos || datos.pendiente) continue;
      void this.cargar(id, datos).then((buffer) => {
        if (!buffer || !this.ctx || this.loops.has(id) || !this.ambientePedido.includes(id)) return;
        const loop = this.sonar(buffer, this.busAmbiente, { loop: true, volumen: 0 });
        this.rampa(loop.ganancia.gain, this.pesoAmbiente(id), 1.5);
        this.loops.set(id, loop);
      });
    }
  }

  /**
   * Los efectos de una pantalla: suenan de a uno, en el orden pedido, y
   * reemplazan a los que hubiera sonando de la pantalla anterior.
   */
  efectos(ids: string[]): void {
    this.detenerEfectos();
    if (!this.ctx || !ids.length) return;
    const turno = this.turnoEfectos;
    void (async () => {
      for (const id of ids) {
        if (turno !== this.turnoEfectos) return;
        await this.efecto(id, turno);
        await new Promise((listo) => window.setTimeout(listo, PAUSA_ENTRE_EFECTOS));
      }
    })();
  }

  detenerEfectos(): void {
    this.turnoEfectos += 1;
    const actual = this.efectoActual;
    if (!actual) return;
    this.efectoActual = null;
    actual.fuente.onended = null;
    this.apagar(actual, 0.3);
    this.mezclar();
  }

  /** Precarga en segundo plano los audios de una pantalla. */
  precargar(ids: (string | undefined)[]): void {
    if (!this.ctx) return;
    for (const id of ids) {
      const datos = id ? historia.audios[id] : undefined;
      if (id && datos && !datos.pendiente) void this.cargar(id, datos);
    }
  }

  /** Un efecto, entero. La promesa se cumple cuando termina (o si no pudo sonar). */
  private async efecto(id: string, turno: number): Promise<void> {
    const datos = historia.audios[id];
    if (!datos || datos.pendiente || !this.ctx) return;
    const buffer = await this.cargar(id, datos);
    if (!buffer || !this.ctx || turno !== this.turnoEfectos) return;
    const sonando = this.sonar(buffer, this.busEfectos);
    this.efectoActual = sonando;
    this.mezclar();
    await new Promise<void>((listo) => {
      sonando.fuente.onended = () => {
        if (this.efectoActual === sonando) {
          this.efectoActual = null;
          this.mezclar();
        }
        listo();
      };
    });
  }

  /** Pone cada bus en su lugar según lo que esté sonando: voz, efecto o solo ambiente. */
  private mezclar(): void {
    if (!this.ctx) return;
    const voz = this.narracion !== null;
    const efecto = this.efectoActual !== null;
    this.rampa(this.busAmbiente.gain, voz ? AMBIENTE_CON_VOZ : efecto ? AMBIENTE_CON_EFECTO : AMBIENTE, RAMPA);
    this.rampa(this.busEfectos.gain, voz ? EFECTO_CON_VOZ : EFECTO, RAMPA);
  }

  /** Volumen de un loop para que varios juntos sumen lo mismo que uno solo. */
  private pesoAmbiente(id: string): number {
    const pesos = this.ambientePedido.map((_, i) => (i === 0 ? 1 : PESO_ACOMPANIA));
    const total = Math.sqrt(pesos.reduce((suma, p) => suma + p * p, 0)) || 1;
    return (pesos[this.ambientePedido.indexOf(id)] ?? 0) / total;
  }

  private bus(volumen: number): GainNode {
    const nodo = this.ctx!.createGain();
    nodo.gain.value = volumen;
    nodo.connect(this.maestro);
    return nodo;
  }

  private sonar(buffer: AudioBuffer, destino: GainNode, { loop = false, volumen = 1 } = {}): Sonando {
    const fuente = this.ctx!.createBufferSource();
    fuente.buffer = buffer;
    fuente.loop = loop;
    const ganancia = this.ctx!.createGain();
    ganancia.gain.value = volumen;
    fuente.connect(ganancia).connect(destino);
    fuente.start();
    return { fuente, ganancia };
  }

  /** Corta un sonido con un fundido corto, para que no haga "clic". */
  private apagar({ fuente, ganancia }: Sonando, segundos: number): void {
    if (!this.ctx) return;
    this.rampa(ganancia.gain, 0, segundos);
    try {
      fuente.stop(this.ctx.currentTime + segundos + 0.05);
    } catch {
      // ya estaba detenida
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
