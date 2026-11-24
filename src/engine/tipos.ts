// Forma de src/data/historia.json. El motor solo conoce estos tipos;
// todo el contenido (textos, rutas, posiciones) vive en el JSON.

export type DuplaId = string;
export type Momento = 'dia' | 'noche';

export type BloqueTexto = string | { texto: string; estilo: 'destacado' };

export interface Imagen {
  src: string;
  /** Otra versión para pantallas angostas (un logo apilado en vez del horizontal). */
  srcAngosta?: string;
  descripcion: string;
  pendiente?: boolean;
  /** El dibujo entero tiene que verse, sin recortar (escenas con fondo transparente). */
  entero?: boolean;
  /** Rogelio cambia de color de noche: se resuelve con un filtro. */
  cambiaDeColorDeNoche?: boolean;
}

export interface Audio {
  src: string;
  tipo: 'narracion' | 'ambiente' | 'efecto';
  descripcion: string;
  pendiente?: boolean;
  /**
   * Narración que no arranca sola: se escucha con «Escuchar» (la voz del
   * narrador). Así, al entrar, se oyen los sonidos que eligieron los chicos.
   * Las voces de los chicos arrancan solas.
   */
  aPedido?: boolean;
}

export interface Dupla {
  nombre: string;
  presentacion: string[];
  narracion: string;
  /** Ver PantallaBase.tiempos. */
  tiempos?: string;
  /** Los dos personajes, que se muestran uno al lado del otro. */
  personajes: string[];
  /** Fondo detrás de la pareja (el escenario de día de la dupla). */
  fondo?: string;
  /** Texto del botón para elegirla, si no sirve el general ("Recorrer con ellas"). */
  botonElegir?: string;
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
  /**
   * secreto: muestra una ficha. truco: la dupla hace algo y gana monedas.
   * escondite: un brillo en la escena que esconde monedas; no tiene dibujo.
   */
  tipo: 'secreto' | 'truco' | 'escondite';
  animacion: Animacion;
  /** Título de la tarjeta del secreto, si no es el nombre del elemento. */
  titulo?: string;
  /** Texto del secreto. null = el equipo todavía no lo indicó (PENDIENTE). */
  secreto?: string | null;
  monedas?: number;
  /** Imagen que aparece después de la animación (el sobre, los dientes). */
  aparece?: string;
  /** Sonido corto de cada moneda al llegar al contador. */
  sonidoMoneda?: string;
}

/**
 * Cómo entra un elemento a la escena. "acercarse": llega desde lejos,
 * chico, y crece hasta su tamaño. Los segundos se cuentan desde que se
 * entra a la pantalla, para que coincida con los efectos (los pasos, la risa).
 */
export interface Llegada {
  animacion: 'acercarse';
  retraso: number;
  duracion: number;
}

export interface Elemento {
  id: string;
  nombre: string;
  /** El dibujo. Los escondites no tienen: se ven como un brillo. */
  imagen?: string;
  /** Centro del elemento, en % del área de juego (la escena sin la franja de subtítulos). */
  x: number;
  y: number;
  /** Ancho, en % del promedio entre el ancho y el alto del área de juego. */
  ancho: number;
  interaccion?: Interaccion;
  llegada?: Llegada;
}

export interface Escenario {
  fondo: string;
  /**
   * Imágenes que tapan el fondo al entrar y se van fundiendo en orden hasta
   * dejarlo ver (el paso del día a la noche, con los atardeceres).
   */
  transicion?: string[];
  elementos?: Elemento[];
}

export interface Destino {
  id: string;
  nombre: string;
  x: number;
  y: number;
}

export type Siguiente = string | { segun: 'dupla' | 'destino'; casos: Record<string, string> };

/** Lo que pasa en la escena cuando la narración dice algo. */
export type AccionMomento =
  /** Llega desde lejos, creciendo (el viejo de la bolsa). Está oculto hasta entonces. */
  | 'acercarse'
  /** Entra corriendo desde el costado. Está oculto hasta entonces. */
  | 'entrar'
  /** Aparece con un fundido (el colectivo a lo lejos, el mapa). Está oculto hasta entonces. */
  | 'aparecer'
  /** Levanta la cabeza un momento. */
  | 'mirarArriba'
  /** Se inclina un momento hacia un costado (el viejo abre la bolsa). */
  | 'inclinarse'
  /** Se va caminando hacia el costado y desaparece. */
  | 'irse'
  /** Salta hasta otro elemento (`hacia`) y se mete adentro. */
  | 'saltarA'
  /** Se esfuma en una nube de polvo. */
  | 'desaparecer'
  /** Empieza a invitar a que lo toquen. */
  | 'invitar'
  /** Un llamado de atención breve. */
  | 'senalar'
  /** Empieza a balancearse (el reloj) o a mecerse (la ventana del colectivo). */
  | 'balancear'
  /** Un fogonazo de luz sobre la escena (el flash de la cámara). */
  | 'destello'
  /** Deja de moverse (la ventana del colectivo). */
  | 'detener';

export interface MomentoNarrado {
  /** Fragmento del texto, tal cual. Pasa cuando la voz lo dice; sin voz, cuando el subtítulo llega ahí. */
  alDecir: string;
  /** Fragmento hasta el que dura la acción: termina cuando la voz llega ahí. */
  hasta?: string;
  /** Efecto de sonido que suena en ese momento. */
  efecto?: string;
  /** Qué se mueve: un elemento de la escena, o "fondo", "reloj", "ventana", "mapa" o "destinos". */
  elemento?: string;
  accion?: AccionMomento;
  /** Para saltarA: el elemento adonde va. */
  hacia?: string;
  /**
   * Para saltarA: el punto de `hacia` donde cae, en % de su dibujo (x, y).
   * Sin esto, un poco abajo del centro. La bolsa del viejo está abajo a la derecha.
   */
  punto?: [number, number];
}

interface PantallaBase {
  id: string;
  numero: number;
  momento: Momento;
  titulo: string;
  texto: BloqueTexto[];
  /** Si está, la pantalla solo existe para esa dupla. */
  dupla?: DuplaId;
  narracion?: string;
  /**
   * El segundo de la narración en que empieza cada palabra del texto, en
   * orden y separados por espacios. Los escribe scripts/sincronizar-narracion.py;
   * si el texto cambia hay que volver a correrlo.
   */
  tiempos?: string;
  ambiente?: string[];
  /** Efectos que suenan uno detrás de otro al entrar a la pantalla. */
  efectos?: string[];
  /** Lo que pasa en la escena atado a lo que dice la narración. */
  momentos?: MomentoNarrado[];
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
  /**
   * Cuántas monedas hay que juntar para habilitar "Seguir" (en vez de
   * requiereInteracciones). Es un mínimo: se puede seguir buscando más.
   */
  monedasParaSeguir?: number;
  /** Reloj decorativo (no mide tiempo real): el dibujo de los chicos, o uno con agujas que avanzan. */
  reloj?: { desde: string; hasta: string; imagen?: string };
}

export interface PantallaMapa extends PantallaBase {
  tipo: 'mapa';
  escenario: Escenario;
  mapa: string;
  destinos: Destino[];
}

export interface PantallaViaje extends PantallaBase {
  tipo: 'viaje';
  /** El dibujo de la ventana del colectivo, que se mece con el andar. */
  ventana: string;
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
  titulo?: string;
  detalle?: string;
  nombres?: string[];
  /** Un enlace debajo de los nombres (la página de quien desarrolló). */
  enlace?: { texto: string; url: string };
  /** Logos institucionales, en una placa clara: no se recolorean. */
  logos?: string[];
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
