// Íconos dibujados a mano, mismo trazo (2px, puntas redondeadas) en todos.
const base = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

export const iconoSonido = `<svg ${base}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>`;

export const iconoSilencio = `<svg ${base}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/></svg>`;

export const iconoSaltear = `<svg ${base}><path d="M5 6l8 6-8 6z"/><path d="M17 6v12"/></svg>`;

export const iconoSeguir = `<svg ${base}><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></svg>`;

export const iconoVolver = `<svg ${base}><path d="M19 12H6"/><path d="m11 6-6 6 6 6"/></svg>`;

export const iconoCerrar = `<svg ${base}><path d="m6 6 12 12"/><path d="M18 6 6 18"/></svg>`;

export const iconoDescubierto = `<svg ${base}><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

export const iconoMoneda = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.5" fill="var(--moneda)" stroke="var(--moneda-borde)" stroke-width="1.6"/><circle cx="12" cy="12" r="6" fill="none" stroke="var(--moneda-borde)" stroke-width="1.2" opacity=".55"/><path d="M12 8.5v7" stroke="var(--moneda-borde)" stroke-width="1.8" stroke-linecap="round"/></svg>`;

export const iconoReloj = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" class="reloj__svg">
  <circle cx="50" cy="50" r="45" fill="var(--reloj-fondo)" stroke="var(--reloj-borde)" stroke-width="4"/>
  ${Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="10" x2="50" y2="${i % 3 === 0 ? 19 : 15}" stroke="var(--reloj-borde)" stroke-width="${i % 3 === 0 ? 4 : 2.5}" stroke-linecap="round" transform="rotate(${i * 30} 50 50)"/>`).join('')}
  <line class="reloj__horas" x1="50" y1="50" x2="50" y2="28" stroke="var(--reloj-aguja)" stroke-width="5" stroke-linecap="round"/>
  <line class="reloj__minutos" x1="50" y1="50" x2="50" y2="18" stroke="var(--reloj-aguja)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="4" fill="var(--reloj-aguja)"/>
</svg>`;
