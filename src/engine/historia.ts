import datos from '../data/historia.json';
import type { BloqueTexto, Escenario, Historia, Pantalla, Siguiente } from './tipos';

export const historia = datos as unknown as Historia;

export function pantallaPorId(id: string): Pantalla {
  const pantalla = historia.pantallas.find((p) => p.id === id);
  if (!pantalla) throw new Error(`No existe la pantalla "${id}" en historia.json`);
  return pantalla;
}

/** Texto de interfaz. Si falta la clave, se nota en pantalla y en consola. */
export function t(clave: string): string {
  const texto = historia.interfaz[clave];
  if (texto === undefined) {
    console.error(`Falta "${clave}" en interfaz de historia.json`);
    return `[${clave}]`;
  }
  return texto;
}

export function urlPublica(src: string): string {
  return import.meta.env.BASE_URL + src;
}

/** Las palabras de un texto, como las cuentan los tiempos de la narración. */
export function palabrasDe(texto: BloqueTexto[]): string[] {
  return texto.flatMap((b) => (typeof b === 'string' ? b : b.texto).split(/\s+/).filter(Boolean));
}

/**
 * Los tiempos de una narración, uno por palabra del texto. null si no hay o
 * si no corresponden a este texto (cambió después de sincronizar).
 */
export function tiemposDe(tiempos: string | undefined, texto: BloqueTexto[]): number[] | null {
  if (!tiempos) return null;
  const valores = tiempos.split(' ').map(Number);
  const validos = valores.every((v, i) => Number.isFinite(v) && (i === 0 || v >= valores[i - 1]));
  return validos && valores.length === palabrasDe(texto).length ? valores : null;
}

/**
 * Revisa que historia.json sea coherente: que cada referencia apunte a algo
 * que existe. Devuelve la lista de problemas (vacía si está todo bien).
 */
export function validarHistoria(h: Historia = historia): string[] {
  const problemas: string[] = [];
  const ids = new Set(h.pantallas.map((p) => p.id));
  const imagen = (id: string | undefined, donde: string) => {
    if (id && !h.imagenes[id]) problemas.push(`${donde}: falta la imagen "${id}"`);
  };
  const audio = (id: string | undefined, donde: string) => {
    if (id && !h.audios[id]) problemas.push(`${donde}: falta el audio "${id}"`);
  };
  const tiempos = (valor: string | undefined, texto: BloqueTexto[], narracion: string | undefined, donde: string) => {
    if (valor === undefined) return;
    if (!narracion) problemas.push(`${donde}: tiene "tiempos" pero no "narracion"`);
    else if (!tiemposDe(valor, texto)) problemas.push(`${donde}: "tiempos" no corresponde al texto (correr scripts/sincronizar-narracion.py)`);
  };
  const destinoDe = (s: Siguiente | undefined, donde: string) => {
    if (!s) return;
    const destinos = typeof s === 'string' ? [s] : Object.values(s.casos);
    for (const d of destinos) if (!ids.has(d)) problemas.push(`${donde}: "siguiente" apunta a "${d}", que no existe`);
  };
  const escenario = (e: Escenario, donde: string) => {
    imagen(e.fondo, donde);
    e.transicion?.forEach((id) => imagen(id, `${donde} › transición`));
    for (const el of e.elementos ?? []) {
      if (el.imagen) imagen(el.imagen, `${donde} › ${el.id}`);
      else if (el.interaccion?.tipo !== 'escondite') problemas.push(`${donde} › ${el.id}: falta "imagen" (solo los escondites no tienen)`);
      if (el.interaccion?.tipo === 'escondite' && !el.interaccion.monedas) problemas.push(`${donde} › ${el.id}: un escondite tiene que dar monedas`);
      imagen(el.interaccion?.aparece, `${donde} › ${el.id}`);
      audio(el.interaccion?.sonidoMoneda, `${donde} › ${el.id}`);
      if (el.llegada && !(el.llegada.retraso >= 0 && el.llegada.duracion > 0)) problemas.push(`${donde} › ${el.id}: "llegada" necesita retraso ≥ 0 y duración > 0`);
    }
  };

  // Lo atado a la narración: cada fragmento tiene que estar en el texto, palabra por palabra.
  const momentos = (p: Pantalla) => {
    if (!p.momentos?.length) return;
    const palabras = palabrasDe(p.texto);
    const esta = (fragmento: string) => {
      const buscadas = fragmento.split(/\s+/).filter(Boolean);
      if (!buscadas.length) return false;
      for (let i = 0; i + buscadas.length <= palabras.length; i++) if (buscadas.every((b, j) => palabras[i + j] === b)) return true;
      return false;
    };
    const piezas = new Set<string>(
      'escenario' in p ? (p.escenario.elementos ?? []).map((el) => el.id) : [],
    );
    if ('escenario' in p && p.escenario.fondo) piezas.add('fondo');
    if (p.tipo === 'exploracion' && p.reloj) piezas.add('reloj');
    if (p.tipo === 'viaje') piezas.add('ventana');
    if (p.tipo === 'mapa') piezas.add('mapa').add('destinos');
    p.momentos.forEach((m, i) => {
      const donde = `${p.id} › momentos[${i}]`;
      if (!esta(m.alDecir)) problemas.push(`${donde}: "${m.alDecir}" no está tal cual en el texto`);
      if (m.hasta && !esta(m.hasta)) problemas.push(`${donde}: "hasta" ("${m.hasta}") no está tal cual en el texto`);
      audio(m.efecto, donde);
      if (!m.efecto && !m.accion) problemas.push(`${donde}: no hace nada (falta "efecto" o "accion")`);
      if (m.accion && !m.elemento) problemas.push(`${donde}: "${m.accion}" necesita "elemento"`);
      if (m.elemento && !piezas.has(m.elemento)) problemas.push(`${donde}: "${m.elemento}" no está en la pantalla`);
      if (m.accion === 'saltarA' && (!m.hacia || !piezas.has(m.hacia))) problemas.push(`${donde}: "saltarA" necesita "hacia" con un elemento de la pantalla`);
      if (m.punto && !(m.punto.length === 2 && m.punto.every((n) => n >= 0 && n <= 100))) problemas.push(`${donde}: "punto" va en % (dos números de 0 a 100)`);
    });
  };

  if (!ids.has(h.inicio)) problemas.push(`inicio: "${h.inicio}" no existe`);
  if (ids.size !== h.pantallas.length) problemas.push('Hay pantallas con el mismo id');
  for (const [id, d] of Object.entries(h.duplas)) {
    d.personajes.forEach((p) => imagen(p, `dupla ${id}`));
    imagen(d.fondo, `dupla ${id}`);
    audio(d.narracion, `dupla ${id}`);
    tiempos(d.tiempos, d.presentacion, d.narracion, `dupla ${id}`);
  }
  for (const s of h.creditos.secciones) {
    s.logos?.forEach((l) => imagen(l, 'créditos'));
    if (s.enlace && !/^https:\/\//.test(s.enlace.url)) problemas.push(`créditos: el enlace "${s.enlace.url}" tiene que empezar con https://`);
  }
  for (const p of h.pantallas) {
    if (p.dupla && !h.duplas[p.dupla]) problemas.push(`${p.id}: la dupla "${p.dupla}" no existe`);
    audio(p.narracion, p.id);
    tiempos(p.tiempos, p.texto, p.narracion, p.id);
    p.ambiente?.forEach((a) => audio(a, p.id));
    p.efectos?.forEach((a) => audio(a, p.id));
    destinoDe(p.siguiente, p.id);
    momentos(p);
    switch (p.tipo) {
      case 'intro':
      case 'exploracion':
      case 'cierre':
        escenario(p.escenario, p.id);
        if (p.tipo === 'exploracion') imagen(p.reloj?.imagen, `${p.id} › reloj`);
        if (p.tipo === 'cierre' && !ids.has(p.reiniciarEn)) problemas.push(`${p.id}: "reiniciarEn" no existe`);
        break;
      case 'mapa':
        escenario(p.escenario, p.id);
        imagen(p.mapa, p.id);
        break;
      case 'viaje':
        imagen(p.ventana, p.id);
        break;
      case 'eleccion-dupla':
        p.duplas.forEach((d) => {
          if (!h.duplas[d]) problemas.push(`${p.id}: la dupla "${d}" no existe`);
        });
        break;
    }
  }
  return problemas;
}
