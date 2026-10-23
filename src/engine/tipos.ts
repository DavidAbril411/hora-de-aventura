// Forma de src/data/historia.json. El motor solo conoce estos tipos;
// todo el contenido (textos, rutas, posiciones) vive en el JSON.

export type DuplaId = string;
export type Momento = 'dia' | 'noche';

export type BloqueTexto = string | { texto: string; estilo: 'destacado' };

export interface Imagen {
  src: string;
  descripcion: string;
  pendiente?: boolean;
  /** Rogelio cambia de color de noche: se resuelve con un filtro. */
  cambiaDeColorDeNoche?: boolean;
}

export interface Audio {
  src: string;
  tipo: 'narracion' | 'ambiente' | 'efecto';
  descripcion: string;
  pendiente?: boolean;
}

export interface Dupla {
  nombre: string;
  presentacion: string[];
  narracion: string;
  imagen: string;
}

export type Animacion =
  | 'crecer'
  | 'brillar'
  | 'sacudir'
  | 'despertar'
  | 'miami'
  | 'mortal'
  | 'flash'
  | 'destellos';

export interface Interaccion {
  tipo: 'secreto' | 'truco';
  animacion: Animacion;
  /** Texto del secreto. null = el equipo todavía no lo indicó (PENDIENTE). */
  secreto?: string | null;
  monedas?: number;
  /** Imagen que aparece después de la animación (el sobre, los dientes). */
  aparece?: string;
}

export interface Elemento {
  id: string;
  nombre: string;
  imagen: string;
  /** Centro del elemento, en % del escenario. */
  x: number;
  y: number;
  /** Ancho en % del escenario. */
  ancho: number;
  interaccion?: Interaccion;
}

export interface Escenario {
  fondo: string;
  elementos?: Elemento[];
}

export interface Destino {
  id: string;
  nombre: string;
  x: number;
  y: number;
}

export type Siguiente = string | { segun: 'dupla' | 'destino'; casos: Record<string, string> };

interface PantallaBase {
  id: string;
  numero: number;
  momento: Momento;
  titulo: string;
  texto: BloqueTexto[];
  /** Si está, la pantalla solo existe para esa dupla. */
  dupla?: DuplaId;
  narracion?: string;
  ambiente?: string[];
  efectos?: string[];
  siguiente?: Siguiente;
}

export interface PantallaIntro extends PantallaBase {
  tipo: 'intro';
  escenario: Escenario;
}

export interface PantallaEleccion extends PantallaBase {
  tipo: 'eleccion-dupla';
  duplas: DuplaId[];
}

export interface PantallaExploracion extends PantallaBase {
  tipo: 'exploracion';
  escenario: Escenario;
  /** Cuántos elementos hay que tocar antes de habilitar "Seguir". */
  requiereInteracciones?: number;
  /** Reloj decorativo: no mide tiempo real. */
  reloj?: { desde: string; hasta: string };
}

export interface PantallaMapa extends PantallaBase {
  tipo: 'mapa';
  escenario: Escenario;
  mapa: string;
  destinos: Destino[];
}

export interface PantallaViaje extends PantallaBase {
  tipo: 'viaje';
  capas: string[];
}

export interface PantallaCierre extends PantallaBase {
  tipo: 'cierre';
  escenario: Escenario;
  reiniciarEn: string;
}

export type Pantalla =
  | PantallaIntro
  | PantallaEleccion
  | PantallaExploracion
  | PantallaMapa
  | PantallaViaje
  | PantallaCierre;

export interface SeccionCreditos {
  titulo: string;
  detalle?: string;
  nombres: string[];
  /** Qué falta, si los nombres todavía no llegaron. */
  pendiente?: string;
}

export interface Historia {
  titulo: string;
  inicio: string;
  interfaz: Record<string, string>;
  duplas: Record<DuplaId, Dupla>;
  pantallas: Pantalla[];
  creditos: { titulo: string; secciones: SeccionCreditos[] };
  imagenes: Record<string, Imagen>;
  audios: Record<string, Audio>;
}
