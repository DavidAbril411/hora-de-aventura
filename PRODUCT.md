# Product

<!-- impeccable:product-schema 1 -->

Todo lo que sigue sale de las instrucciones del proyecto que escribió David y de `especificacion.md`. No hubo una entrevista aparte: si algo cambia, se corrige acá.

## Platform

web

## Stack

Vite + TypeScript, sin framework de UI. Animaciones con Motion (MIT). PWA con service worker que precachea todo. Deploy en Vercel (a confirmar con David antes del primer deploy público). Decidido por David; no se cambia sin preguntar.

## Qué es

"Hora de aventura": una ficción digital interactiva hecha a partir de un cuento escrito, ilustrado y narrado por chicos y chicas de 11 a 13 años de la Escuela San Martín de Villa María (Córdoba, Argentina). Es un proyecto de investigación y extensión de la Universidad Nacional de Villa María (UNVM), cofinanciado por la Municipalidad de Villa María. Referente del equipo: Lucila. Desarrollo: David Abril.

## Quién lo usa

- Chicos de 11 a 13 años, sobre todo en una tablet horizontal en el aula, con el wifi inestable de una escuela. También en celular vertical.
- Los mismos autores, que se ven a sí mismos en la obra: sus dibujos y sus voces.
- El equipo docente y de la UNVM, que la muestra y la comparte con un enlace.

## Qué hace el lector

Elige una dupla de personajes, recorre la isla flotante de día y de noche, toca la pantalla para descubrir secretos, junta monedas, elige un destino en un mapa y llega al final. No hay forma de perder; siempre se puede avanzar. "Volver a jugar" permite probar otra dupla.

## Lo que no se negocia

- La obra es de los chicos. Sus dibujos y sus voces son los protagonistas; la interfaz los enmarca y nunca compite con ellos.
- No se reescribe la historia. Los textos salen tal cual del PDF original; las erratas se proponen, no se aplican.
- El material se mejora (luz, color, ruido, volumen), nunca se rediseña: nada de IA generativa, ni cambiar estilo, tono o velocidad de las voces.
- Si falta material, se usa un placeholder marcado `PENDIENTE` y se anota en `PENDIENTES.md`. No se inventa contenido.

## Fuera de alcance

Minijuegos con mecánica (los trucos, el flash y la varita son tocar → animación → moneda), reloj con tiempo límite (solo decorativo), chat con IA.

## Accesibilidad y lectura

Texto grande y legible, botones táctiles de al menos 56 px, una acción clara por pantalla, botón de silencio siempre visible, narración que se puede saltear, `prefers-reduced-motion` respetado. Idioma: español rioplatense (voseo).

## Dirección visual

Pendiente: sale de Claude Design (`/design`) a partir de las ilustraciones reales. Hasta entonces, el motor usa tokens neutros y provisorios en `src/styles/tokens.css`. Evitar la estética genérica de IA (degradés violetas, glassmorphism, Inter/Roboto/Arial).
