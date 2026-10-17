@AGENTS.md

# Contexto del equipo — Platanus Hack 26: Caracas (Arcade Challenge)

## Equipo
- **Pedro Nikken** — líder (@pedrodnikken-bot). Único que pasa cosas a `main` y el único que pulsa **Submit**.
- **Gabriel Velasquez** (@gabrielvelasquez-lgtm)
- **Enrique Diaz** (@ediazms2024-alt)

Claude actúa como ingeniero de sistemas del equipo: maneja git, ramas, PRs, reglas de GitHub y la base técnica del juego.

## Ramas y flujo de trabajo
- Repo: `pedrodnikken-bot/platanus-hack-26-venezuela-arcade` (fork de `platanus-hack/platanus-hack-26-venezuela-arcade`).
- **Todo el trabajo va a `desarrollo`.** Antes de empezar: `git pull`. Al terminar: commit pequeño y `git push`.
- **`main` está protegida** (ruleset de GitHub + `.github/CODEOWNERS`): nadie hace push directo; solo entra por Pull Request `desarrollo → main` con aprobación de Pedro. No borrar ni reescribir historial de `main`.
- Los archivos del juego van **en la raíz**: `game.js`, `metadata.json`, `cover.png`. Nunca en una subcarpeta.
- Todo el juego vive en `game.js`: para evitar conflictos, cada uno trabaja una parte distinta y avisa antes de tocar algo grande.

## Cómo se envía el juego (no hacerlo sin que Pedro lo pida)
- Hacer push **no** envía nada. Solo envía el botón **Submit** de `npm run dev`: hace commit de `game.js`/`metadata.json`/`cover.png`, push a la rama actual, crea un tag `vN` y avisa a hack.platan.us.
- Pedro lo pulsa al final, desde `main`. Un agente nunca pulsa Submit ni crea tags `v*` por su cuenta.

## Fechas (hora de Caracas, UTC−4)
- **Envío del juego: miércoles 21 de octubre de 2026, 23:59.**
- Votación de la comunidad: hasta el 23 de octubre, 23:59.
- Hackathon presencial: 23–25 de octubre de 2026.

## Concepto del juego: "El Parquero" (en brainstorm, aún sin PRD)

**Premisa.** En Caracas casi no hay dónde estacionar, así que los locales tienen valet parking: el parquero recibe el carro y lo estaciona en la calle donde consiga puesto. Tú eres el parquero de varios locales y compites contra otro parquero por estacionar y entregar más carros.

**Obligatorio:** estética retro.

**Modos.** 1 jugador (contra la máquina) o 2 jugadores (versus). Lo más importante es la competitividad entre jugadores; el primer objetivo es un demo jugable para probar esa jugabilidad.

**Ciclo de juego.**
1. Llega un carro al puesto de valet parking (donde se recibe y se entrega).
2. Si los dos parqueros están en el puesto cuando llega, se disputan el carro con un **mini juego rápido de duelo** (el primero en tocar el botón, salida tipo semáforo de F1, etc.). El que pierde se queda sin el carro.
3. Manejas el carro por el mapa y buscas un puesto **del tamaño correcto**.
4. Al estacionar hay un **mini juego de botones**.
5. Cuando el cliente sale, hay que ir a buscar el carro (otro mini juego al abrirlo/sacarlo) y entregarlo en el puesto de valet.

**Mini juegos de botones** (al estacionar, al sacar el carro y en los duelos):
- Machacar un botón rápido muchas veces.
- Secuencia exacta de botones tipo entrenamiento de reflejos de F1 (ej. 1-2-3-4).
- Reacción: el primero en pulsar cuando se da la señal.

**Carros (3 tamaños, referencia Toyota):** chico = Yaris, mediano = Corolla, grande = Fortuner. Los puestos en la calle también tienen tamaños; el carro debe caber.

**Propinas / boosts** (estilo venezolano, propinas locas):
- **Whisky** (el vaso con el que sale el cliente del local): x2 de puntos, pero sube la dificultad al estacionar.
- **Propina** (dinero).
- **Comida.**
- Efectos de propina y comida por definir.

**Mapas.** Cada mapa tiene un puesto de valet parking y puestos para estacionar por toda la calle. Primer mapa: **Las Mercedes** (Caracas).

**Boceto del primer mapa** (foto en papel, vista cenital): cuadrícula de 3×3 manzanas con calles entre ellas. El puesto de valet parking está en la esquina inferior derecha de la manzana central. Las zonas rayadas son los puestos de estacionamiento a lo largo de las aceras: borde derecho de la manzana superior izquierda, borde izquierdo de la superior derecha, borde superior de la media izquierda y de la media derecha, borde superior de la inferior izquierda y borde izquierdo de la inferior central y de la inferior derecha. El boceto es vertical; la pantalla del arcade es horizontal (800×600), hay que adaptarlo.

## Controles en el arcade (recordatorio)
- Por jugador: joystick + 6 botones (`P1_1`…`P1_6`, `P2_1`…`P2_6`) + `START1`/`START2`.
- En local: P1 = WASD + U/I/O/J/K/L; P2 = flechas + R/T/Y/F/G/H.
- Usar siempre los códigos de arcade en la lógica; no tocar `CABINET_KEYS` (solo se puede añadir teclas).
