# PRD: El Parquero (demo)

Versión 0.1 · 2026-10-17 · Fuente: SPEC.md v0.1

## 1. Resumen

El Parquero es un juego arcade retro para dos jugadores en una sola pantalla (800×600). Cada jugador es un parquero de valet en Las Mercedes (Caracas): recibe carros, los estaciona en la calle y los entrega cuando el dueño sale. Gana quien tenga más puntos al final de la noche.

**Objetivo del demo:** probar la jugabilidad competitiva, es decir, si los duelos constantes, la rivalidad y el puntaje hacen que dos jugadores se sientan en competencia directa durante los tres minutos de partida.

## 2. Contexto

- **Evento:** Platanus Hack 26 Caracas, Arcade Challenge.
- **Envío del juego:** miércoles 21 de octubre de 2026, 23:59 (UTC−4).
- **Votación de la comunidad:** hasta el 23 de octubre, 23:59 (UTC−4).

**Restricciones técnicas**

| Requisito | Valor |
|---|---|
| Motor | Phaser 3.87 (cargado por CDN, no cuenta en el límite) |
| Código | un solo `game.js`, ≤ 50 KB minificado |
| Dependencias | sin imports, sin URLs externas, sin red |
| Portada | `cover.png` 800×600, ≤ 500 KB |
| Controles | joystick + 6 botones por jugador + START (códigos de arcade `P1_1`, `P2_1`, `START1`, etc.) |
| Verificación | `npm run check-restrictions` |

## 3. Jugadores y modos

| Modo | Alcance |
|---|---|
| **Demo: 2 jugadores versus** | Pantalla compartida, solo Las Mercedes. Es el objetivo de esta versión. |
| 1 jugador contra la máquina | Después del demo. Ver sección 6. |

## 4. Mecánicas

### 4.1 Mapa y movimiento

- Cuadrícula de 20×15 casillas de 40 px. La fila 0 es el HUD; el área de juego es de filas 1 a 14.
- Calles de 1 casilla entre manzanas de 3×3.
- Calles verticales en columnas 0, 6, 13 y 19. Calles horizontales en filas 1, 5, 9 y 14.
- Movimiento tipo Pac-Man: arriba, abajo, izquierda y derecha, solo por calles, en cualquier sentido.
- Velocidad: a pie 6 casillas/s; manejando 5 casillas/s.
- **Puesto de valet:** casilla (13, 9), en la esquina inferior derecha de la manzana central.
- **Puestos de estacionamiento:** casillas en el borde de las manzanas, pegadas a la calle. Cada uno tiene tamaño S, M o L.

### 4.2 Carros y puestos

| Carro | Tamaño | Modelo de referencia | Cabe en |
|---|---|---|---|
| Chico | S | Toyota Yaris | Puesto S, M o L |
| Mediano | M | Toyota Corolla | Puesto M o L |
| Grande | L | Toyota Fortuner | Puesto L |

### 4.3 Ciclo de un carro

1. Llegan carros al valet (cola de hasta 3). Un jugador a pie en el valet pulsa el botón 1 para tomar el primero.
2. Si los dos jugadores están en el valet y hay carro, se abre un **duelo por el carro**.
3. El jugador maneja hasta un puesto libre que quepa y entra. El carro queda estacionado y suma +100.
4. Sale el dueño: "¡Salió el dueño del Corolla!". El carro parpadea y arranca un reloj de 15 s. Cualquiera de los dos puede ir a buscarlo, aunque lo haya estacionado el otro.
5. Lo lleva al valet: +150. Si llega dentro de los 15 s, suma además una propina de +200.

### 4.4 Rivalidad

Los duelos son siempre entre los dos jugadores a la vez, nunca individuales.

| Origen | Cuándo | Resultado |
|---|---|---|
| **Choque en la calle** | Los dos jugadores coinciden en la misma casilla | Duelo. Ganador +50. Perdedor aturdido 1,5 s; si iba manejando, rayón −50. Enfriamiento de 3 s tras cada duelo. |
| **Carrera por carro** | Cualquiera entrega cualquier carro que se pide | Los dos compiten por el carro pedido. |
| **Evento Mario Party** | Cada ~40 s; el juego se pausa | Duelo con premio (ver tabla de puntaje). |
| **Duelo por el carro** | Los dos en el valet con carro | Duelo para decidir quién se lleva el carro. |

**Eventos (cada ~40 s):**

- "Camioneta VIP con escoltas": el ganador suma +300.
- "¡Pasó la grúa!": el perdedor pierde −150.
- "Un cliente regala whisky": el ganador recibe el boost de whisky.

### 4.5 Tipos de duelo (aleatorios)

| Tipo | Regla | Gana | Penalización |
|---|---|---|---|
| **Semáforo F1** | Se encienden 5 luces rojas una a una. Se apagan tras un tiempo aleatorio. | El primero en pulsar después de que se apaguen. | Pulsar antes = salida en falso, pierde. |
| **Machaca** | 3 s pulsando el botón 1 lo más rápido posible. | Quien pulse más. | Ninguna. |
| **Secuencia** | Se muestra una secuencia de 4 botones (entre los botones 1 y 4). | El primero en completarla exacta. | Un error reinicia el progreso de ese jugador. |

### 4.6 Propinas en el mapa

Aparecen en las calles cada ~12 s, como las frutas de Pac-Man.

| Propina | Efecto | Duración | Notas |
|---|---|---|---|
| Whisky | Puntos x2 | 10 s | El jugador va borracho: a veces se mueve en otra dirección. |
| Comida | Más rápido | 8 s | +50 puntos. |
| Billete | — | — | +100 puntos. Cuenta para el desempate. |

### 4.7 Oleadas: una noche de 3 minutos

La partida dura 3 minutos reales y representa de 7 pm a 3 am. Los valores de cada fase son constantes ajustables.

| Fase | Reloj de partida | Horario en juego | Llegan carros | Se pide un carro |
|---|---|---|---|---|
| LLEGADAS | 0:00 a 1:00 | 7 a 10 pm | Cada ~4 s | No |
| PICO | 1:00 a 2:00 | 10 pm a 12 am | Cada ~7 s | Cada ~6 s |
| CIERRE | 2:00 a 3:00 | 12 a 3 am | No llegan | Cada ~3 s |

La partida termina a las 3:00 y gana quien tenga más puntos.

### 4.8 Puntaje

Un solo sistema para todo el juego.

| Acción | Puntos |
|---|---|
| Estacionar un carro | +100 |
| Entregar un carro al valet | +150 |
| Propina a tiempo (entrega en ≤ 15 s) | +200 |
| Ganar un duelo | +50 |
| Choque: rayón (si iba manejando) | −50 |
| Evento: Camioneta VIP (ganador) | +300 |
| Evento: Pasó la grúa (perdedor) | −150 |
| Propina: Comida | +50 |
| Propina: Billete | +100 |
| Propina: Whisky | x2 puntos durante 10 s |

### 4.9 Controles

| Jugador | Movimiento | Botón 1 | Otros |
|---|---|---|---|
| P1 (local) | WASD | U | START1 = Enter |
| P2 (local) | Flechas | R | — |

Los códigos de arcade (`P1_1`, `P1_U`, `START1`, etc.) son los que usa la lógica. No se modifica `CABINET_KEYS`.

### 4.10 Estética

Retro obligatoria: pixel art con formas planas, fuente monoespaciada, paleta nocturna (asfalto oscuro, aceras grises, luces amarillas neón) y sonidos chiptune generados por código.

## 5. Requisitos de aceptación del demo

Cada punto debe poder verificarse en pantalla o con el marcador.

**Mapa y movimiento**
- [ ] Los dos jugadores se mueven solo por las calles (columnas 0, 6, 13, 19; filas 1, 5, 9, 14), en las cuatro direcciones.
- [ ] A pie se avanza a 6 casillas/s; manejando, a 5 casillas/s.
- [ ] Un carro S entra en un puesto S, M o L; un carro L solo entra en un puesto L.

**Ciclo de carros**
- [ ] Llegan carros al valet y la cola no pasa de 3.
- [ ] Un jugador a pie en el valet toma el primer carro con el botón 1.
- [ ] Si los dos están en el valet con un carro, se abre un duelo para ambos.
- [ ] Estacionar un carro en un puesto que quepa suma +100.
- [ ] Al salir el dueño, el carro parpadea y arranca un reloj de 15 s.
- [ ] Cualquiera de los dos puede recoger un carro, incluso uno estacionado por el otro.
- [ ] Entregar en el valet suma +150; dentro de 15 s, suma además +200.

**Rivalidad**
- [ ] Dos jugadores en la misma casilla abren un duelo para ambos.
- [ ] El ganador del choque suma +50; el perdedor queda aturdido 1,5 s.
- [ ] Si el perdedor iba manejando, pierde −50.
- [ ] Tras cada duelo hay un enfriamiento de 3 s.
- [ ] Cada ~40 s el juego se pausa y aparece un evento con duelo y premio.
- [ ] Cada ~12 s aparecen propinas en las calles.

**Duelos**
- [ ] Semáforo F1: pulsar antes de que se apaguen las luces es salida en falso y pierde.
- [ ] Machaca: el contador dura 3 s y gana quien más pulse.
- [ ] Secuencia: un error reinicia el progreso del jugador que lo comete.

**Propinas**
- [ ] Whisky duplica los puntos por 10 s y en ese tiempo el movimiento se desvía a veces.
- [ ] Comida acelera al jugador por 8 s y suma +50.
- [ ] Billete suma +100.

**Oleadas y fin de partida**
- [ ] El reloj de la noche cambia de fase a 1:00 (pico) y a 2:00 (cierre).
- [ ] En LLEGADAS no se piden carros; en PICO y CIERRE sí.
- [ ] En CIERRE no llegan carros nuevos.
- [ ] La partida termina a las 3:00 y muestra el ganador.

**Técnico**
- [ ] `game.js` minificado pesa ≤ 50 KB, sin imports, sin URLs y sin llamadas de red.
- [ ] `cover.png` mide 800×600 y pesa ≤ 500 KB.
- [ ] `npm run check-restrictions` pasa.
- [ ] La lógica usa códigos de arcade; `CABINET_KEYS` no se modifica.

## 6. Fuera de alcance del demo

- Modo 1 jugador contra la máquina.
- Más mapas (solo Las Mercedes).
- Mini juego al estacionar (el estacionamiento es directo).
- Persistencia de récords.

## 7. Preguntas abiertas

- **(a)** Cantidad final de puestos por tamaño (S, M, L) en el mapa.
- **(b)** Duración de la partida: la spec fija 3 minutos, pero no se confirma si es el valor definitivo para el demo.
- **(c)** ¿Vuelve un mini juego corto al estacionar, o se queda directo como dice la spec?
- **(d)** Cómo se ve el modo 1 jugador (IA, dificultad, controles).
- **(e)** Qué tipo de duelo (Semáforo, Machaca o Secuencia) usan los eventos de 40 s; la spec no lo indica.
- **(f)** Criterio de desempate: el contexto del equipo lo dejó pendiente (propinas acumuladas y luego puntos, sin confirmar).
