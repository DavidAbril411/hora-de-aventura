import datos from '../data/historia.json';
import type { Escenario, Historia, Pantalla, Siguiente } from './tipos';

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
  const destinoDe = (s: Siguiente | undefined, donde: string) => {
    if (!s) return;
    const destinos = typeof s === 'string' ? [s] : Object.values(s.casos);
    for (const d of destinos) if (!ids.has(d)) problemas.push(`${donde}: "siguiente" apunta a "${d}", que no existe`);
  };
  const escenario = (e: Escenario, donde: string) => {
    imagen(e.fondo, donde);
    e.transicion?.forEach((id) => imagen(id, `${donde} › transición`));
    for (const el of e.elementos ?? []) {
      imagen(el.imagen, `${donde} › ${el.id}`);
      imagen(el.interaccion?.aparece, `${donde} › ${el.id}`);
    }
  };

  if (!ids.has(h.inicio)) problemas.push(`inicio: "${h.inicio}" no existe`);
  if (ids.size !== h.pantallas.length) problemas.push('Hay pantallas con el mismo id');
  for (const [id, d] of Object.entries(h.duplas)) {
    d.personajes.forEach((p) => imagen(p, `dupla ${id}`));
    imagen(d.fondo, `dupla ${id}`);
    audio(d.narracion, `dupla ${id}`);
  }
  for (const p of h.pantallas) {
    if (p.dupla && !h.duplas[p.dupla]) problemas.push(`${p.id}: la dupla "${p.dupla}" no existe`);
    audio(p.narracion, p.id);
    p.ambiente?.forEach((a) => audio(a, p.id));
    p.efectos?.forEach((a) => audio(a, p.id));
    destinoDe(p.siguiente, p.id);
    switch (p.tipo) {
      case 'intro':
      case 'exploracion':
      case 'cierre':
        escenario(p.escenario, p.id);
        if (p.tipo === 'cierre' && !ids.has(p.reiniciarEn)) problemas.push(`${p.id}: "reiniciarEn" no existe`);
        break;
      case 'mapa':
        escenario(p.escenario, p.id);
        imagen(p.mapa, p.id);
        break;
      case 'viaje':
        p.paisaje.forEach((c) => imagen(c, p.id));
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
