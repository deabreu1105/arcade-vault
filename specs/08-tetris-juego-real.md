# 08 — Tetris: juego real con motor propio

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-08-19

**Objetivo:** Portar el Tetris de `references/started-games/03-tetris/` a un motor real (`ArcadeEngine`) conectado a `GameCanvas`/`GAME_RUNTIMES`, y agregarlo al catálogo como un juego nuevo (`tetris`) con leaderboard real.

## Alcance

**Dentro:**

- Nueva fila en la tabla `games` (vía migración SQL): `id = "tetris"`, `title = "TETRIS"`, `cat = "PUZZLE"`, `color = "cyan"`, `cover = "cover-tetris"`, con `short`/`long` redactados para este spec.
- Nueva clase CSS `.cover-tetris` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (fondo base + `::after` con formas + `::before` con un glifo), y su alta en `GAME_COVERS` (`lib/data.ts`).
- Motor en `components/games/tetris/engine.ts`, una clase `TetrisEngine extends ArcadeEngine` que porta de `game.js`:
  - El tablero de 10×20, las 8 piezas (I, O, T, S, Z, J, L y la pieza N/"tuerca"), colisión, `rotateCW` con wall kicks (`[0, -1, 1, -2, 2]`), fusión de la pieza al tablero, limpieza de líneas y el sistema de puntuación clásico (`[0, 100, 300, 500, 800]` × nivel, +2 por celda en hard drop, +1 por fila en soft drop).
  - Caída automática por tiempo (`dropInterval`, arranca en 1000 ms y baja hasta un mínimo de 100 ms según el nivel) implementada dentro de `update(dt)`, reemplazando el acumulador manual (`dropAccum`) basado en `requestAnimationFrame` del original por el `dt` en segundos que ya provee `ArcadeEngine`.
  - Pieza fantasma (`ghostY`) dibujada con alpha reducido, igual que el original.
  - Dibujo de la vista previa de la siguiente pieza dentro del mismo canvas (celda superior derecha del área de juego), ya que no se usa el escape hatch `Component` del registry.
  - Uso de `addScore`/`setLives`/`setLevel`/`gameOver` de `ArcadeEngine` para notificar al HUD externo: `setLevel(level)` con el nivel real (sube cada 10 líneas, igual que el original), y `setLives(lines)` — ver semántica de "Vidas" abajo.
  - Fin de partida (`gameOver()`) cuando una pieza recién generada colisiona al aparecer, igual que `spawn()`/`endGame()` en el original.
  - Sin HUD dibujado en el canvas para score/líneas/nivel (los reemplaza el HUD de React existente) y sin overlay propio de pausa/game over (los reemplaza el modal existente de la pantalla de Jugador).
- Nueva entrada `tetris` en `GAME_RUNTIMES` (`components/games/registry.ts`): resolución lógica `width: 400, height: 600` (300×600 de tablero + 100 px de franja lateral para la vista previa de la siguiente pieza, dibujada dentro del mismo canvas), `capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"]`.
- Semántica de "Vidas" y "Nivel" en el HUD: "Vidas" muestra el conteo de líneas despejadas (equivalente a `lines` del original); "Nivel" muestra el nivel real, que sube cada 10 líneas y acelera `dropInterval`.

**Fuera (no en este spec):**

- Tecla `P` de pausa interna del original — la pantalla de Jugador ya tiene un botón `PAUSA`/`REANUDAR` conectado al motor vía `GameCanvas`, así que no se captura `KeyP` ni se implementa un `togglePause()` propio del motor.
- El overlay propio de "GAME OVER"/"PAUSA" y el botón de reinicio del `index.html` original — los reemplaza el modal de "FIN DEL JUEGO" y el botón "JUGAR DE NUEVO" ya existentes.
- El panel lateral DOM del original (SCORE/LINES/LEVEL/NEXT/controles) — se reemplaza por el HUD de React existente más la vista previa de "next" dentro del canvas.
- El selector de tema claro/oscuro del `index.html` original — no aplica dentro de Arcade Vault.
- Sonido/música — el original no tiene audio y no se agrega aquí.
- Controles táctiles/móviles — el juego se juega solo con teclado en escritorio, igual que la referencia original.
- Assets de imagen o audio — el original solo dibuja formas en canvas, no hay nada que copiar a `public/games/tetris/`.
- Portar o dar motor real a cualquier otro juego del catálogo aún no portado — sigue con su simulación decorativa sin cambios.
- Anti-cheat o validación de que la puntuación corresponde a una partida real (mismo alcance que specs 05/06).

## Modelo de datos

- **`games`** (tabla existente de spec 05, sin cambios de esquema): se agrega una fila nueva vía migración SQL:
  ```sql
  insert into games (id, title, short, long, cat, cover, color)
  values (
    'tetris',
    'TETRIS',
    'Encaja las piezas y despeja líneas.',
    'El clásico Tetris: 7 piezas estándar más una pieza especial (la "tuerca"), rotación con wall kicks, pieza fantasma, soft drop y hard drop, y niveles que aceleran la caída cada 10 líneas.',
    'PUZZLE',
    'cover-tetris',
    'cyan'
  );
  ```
- **Estado interno del motor** (`components/games/tetris/engine.ts`, no persistido, vive solo en memoria del cliente mientras se juega): reutiliza el `EngineCallbacks` estándar de `components/games/engine-base.ts` (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`), sin campos adicionales.
- No se agregan columnas ni tablas nuevas a `scores`; una partida de `tetris` guarda una fila igual que cualquier otro juego (`{ user_id, game_id: "tetris", score }`).

## Plan de implementación

1. Escribir y aplicar la migración `add_game_tetris` que inserta la fila `tetris` en `games` (ver Modelo de datos). Verificar en `/biblioteca` que la tarjeta nueva aparece con su cover.
2. Invocar `/frontend-design` para diseñar `.cover-tetris` en `app/globals.css` (paleta cian, siguiendo el patrón de `.cover-asteroides`) y agregar `"cover-tetris"` a `GAME_COVERS` en `lib/data.ts`.
3. Crear `components/games/tetris/engine.ts`: clase `TetrisEngine extends ArcadeEngine` que porta el tablero, las piezas, colisión, rotación con wall kicks, fusión, limpieza de líneas, puntuación, pieza fantasma y vista previa de "next", implementando `init()`, `update(dt)` y `draw()`; usa `isDown()`/`pressed()` de `ArcadeEngine` para leer teclado (movimiento repetido mientras se mantiene la tecla para izquierda/derecha/abajo, disparo único por pulsación para rotar y hard drop).
4. Agregar la entrada `tetris` en `GAME_RUNTIMES` (`components/games/registry.ts`) con `width: 400, height: 600` y `capturedKeys` según el Alcance.
5. Prueba manual aislada en `/juegos/tetris/jugar`: confirmar que las piezas caen, se mueven, rotan con wall kicks, hacen soft/hard drop, las líneas completas se limpian, el nivel sube cada 10 líneas y la vista previa de "next" se ve dentro del canvas.
6. Revisión manual completa en `npm run dev`: jugar una partida completa hasta perder (una pieza nueva colisiona al aparecer), pausar y reanudar sin que el juego avance durante la pausa, terminar con el botón `FIN`, guardar la puntuación logueado como usuario real (aparece en `/juegos/tetris` y `/salon-de-la-fama`) y como invitado (solo en `localStorage`), reiniciar con `JUGAR DE NUEVO`, y confirmar que jugar no hace scroll de la página. Ejecutar `npx tsc --noEmit` y `npm run lint`.

## Criterios de aceptación

- [x] `/biblioteca` muestra la tarjeta "TETRIS" con su cover, buscable y filtrable por categoría `PUZZLE`.
- [x] `/juegos/tetris` muestra la ficha del juego con leaderboard real (vacío al inicio).
- [x] `/juegos/tetris/jugar` carga el motor real: `←`/`→` mueven la pieza, `↑` o `X` rotan con wall kicks, `↓` hace soft drop, `Espacio` hace hard drop.
- [x] El HUD (Jugador/Puntuación/Vidas/Nivel) refleja el estado real del motor: "Vidas" muestra las líneas despejadas y "Nivel" el nivel real, que sube cada 10 líneas.
- [x] Una pieza nueva que colisiona al aparecer abre el modal de "FIN DEL JUEGO" con la puntuación real.
- [x] `PAUSA` congela la caída y los controles de inmediato; `REANUDAR` continúa exactamente donde quedó.
- [x] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con `game_id = "tetris"` y aparece en `/juegos/tetris` y `/salon-de-la-fama`.
- [x] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [x] `JUGAR DE NUEVO` reinicia el motor (tablero vacío, score 0, nivel 1) sin recargar la página.
- [x] Jugar no produce scroll de la página.
- [x] Los demás juegos del catálogo no cambian de comportamiento.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Vista previa de "next" dentro del mismo canvas, no como `Component` aparte** — el registry ya soporta un escape hatch `Component` para paneles DOM adicionales, pero para este juego alcanza con reservar una franja de 100 px a la derecha del tablero dentro del propio canvas; evita tocar el layout de la pantalla de Jugador.
- **"Vidas" del HUD muestra líneas despejadas, no una constante fija** — Tetris no tiene vidas, pero el dato de líneas es más informativo que un valor fijo y reutiliza un campo del HUD que de otro modo quedaría sin sentido.
- **Se descarta la tecla `P` de pausa interna** — redundante con el botón `PAUSA`/`REANUDAR` que la plataforma ya conecta al motor vía `GameCanvas`; capturarla además introduciría dos caminos para el mismo estado.
- **Se conserva la tecla `X` como alterna de rotación** — así lo pidió el usuario al aprobar el alcance, igual que el original.
- **Canvas 400×600 fijo, escalado por `GameCanvas`** — igual que Asteroides, prioriza conservar los tamaños de pieza (`BLOCK = 30`) del original en vez de recalcular un layout responsive.
- **Juego nuevo (`tetris`) en el catálogo, sin tocar otras filas de `games`** — mismo criterio que spec 06 con `asteroides`/`rocas`.
- **El HUD compartido (`app/juegos/[id]/jugar/page.tsx`) cambia su formato de "Vidas" de corazones fijos a número cuando el valor supera 5** — descubierto durante la implementación: el HUD original solo tenía sentido para valores pequeños (`♥ ♥ ♥`); con "Vidas" = líneas despejadas, superar 5 líneas mostraría una fila de corazones ilegible. Es un cambio genérico de formato (no un `if (game.id === "tetris")`), así que no viola la regla de "no tocar" de `reference/contract.md` sobre lógica específica de un juego en ese archivo; Asteroides no cambia de aspecto porque nunca supera 5 vidas.

## Riesgos identificados

- **Repetición de movimiento horizontal/soft-drop con tecla mantenida:** el original usa eventos `keydown` discretos del DOM (un movimiento por pulsación, sin auto-repetición configurada); el motor nuevo usa el bucle de `ArcadeEngine`, así que hay que decidir explícitamente con `pressed()` (una vez por pulsación) en vez de `isDown()` (cada frame) para que mover no se sienta "acelerado" respecto al original. Se resuelve en el paso 3 del plan y se valida en la prueba manual.
- **Franja de "next" dentro del canvas puede quedar visualmente apretada en 400×600 escalado:** si en la revisión manual se ve demasiado pequeña, queda documentado como ajuste futuro de proporciones, no bloquea este spec.
