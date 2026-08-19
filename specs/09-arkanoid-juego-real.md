# 09 — Arkanoid: tercer juego real jugable

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, SPEC 08
**Fecha:** 2026-08-19

**Objetivo:** Portar el juego de Arkanoid ya existente en `references/started-games/04-arkanoid/` a un motor real (`ArcadeEngine`/`GameCanvas`), agregarlo al catálogo como un juego nuevo ("arkanoid") con leaderboard real, y conectarlo a la pantalla de Jugador vía el registro de motores (`GAME_RUNTIMES`).

## Alcance

**Dentro:**

- Nueva fila en la tabla `games` (vía migración SQL): `id = "arkanoid"`, `title = "ARKANOID"`, `cat = "ARCADE"`, `color = "magenta"`, `cover = "cover-arkanoid"`, con `short`/`long` redactados para este spec. La fila decorativa existente `bloque-buster` (cover `cover-bricks`, en `app/page.tsx`) no se toca ni se reutiliza, siguiendo el mismo criterio que spec 06 aplicó con `rocas`.
- Nueva clase CSS `.cover-arkanoid` en `app/globals.css`, con paleta magenta propia (vía `/frontend-design`), y alta de `"cover-arkanoid"` en `GAME_COVERS` (`lib/data.ts`).
- Assets nuevos en `public/games/arkanoid/`: `spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`, copiados de la referencia sin cambios.
- Motor en `components/games/arkanoid/engine.ts`, clase `ArkanoidEngine extends ArcadeEngine`, portando de `game.js`/`levels.js`/`assets/spritesheet.js`:
  - Paddle, pelota, colisiones AABB contra bloques, rebotes en paredes y paddle, los 5 niveles de `LEVELS` (patrones de bloques y multiplicador de velocidad), la animación de explosión de 4 frames al romper un bloque, y los sonidos de rebote y rotura.
  - Reproducción de sonido: los `Audio` de rebote/rotura se instancian dentro del motor (no como variables globales de módulo) y se disparan igual que en el original (`cloneNode().play()` para permitir solapamiento).
  - Movimiento del paddle por teclado (`ArrowLeft`/`ArrowRight`) y por puntero (posición X del mouse sobre el canvas), ambos actualizando la misma posición `paddle.x`.
  - Se elimina: el HUD dibujado en el propio canvas (score/nivel/vidas), el overlay de "GAME OVER"/"¡Completaste el juego!", el overlay de pausa con selector de nivel 1–5 y su manejo de clicks — todo queda cubierto por el HUD, el modal y el botón PAUSA/REANUDAR ya existentes de la plataforma.
  - Perder las 3 vidas dispara `onGameOver(score)`. Completar el nivel 5 (destruir todos sus bloques) también dispara `onGameOver(score)` como condición de victoria, en vez de continuar a un nivel 6 inexistente.
  - Expone los callbacks estándar de `EngineCallbacks` (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`) y los métodos de `ArcadeEngine` (`start`/`pause`/`resume`/`restart`/`destroy`).
- Entrada `arkanoid` en `GAME_RUNTIMES` (`components/games/registry.ts`): `width: 800`, `height: 600`, `capturedKeys: ["ArrowLeft", "ArrowRight"]`, `pointer: true` (para que `GameCanvas` habilite el mapeo de posición del mouse al canvas y se lo pase al motor).
- "Vidas" en el HUD = vidas restantes (empieza en 3, baja al perder la pelota). "Nivel" en el HUD = nivel actual del motor (1 a 5, sube al limpiar todos los bloques de la pantalla).

**Fuera (no en este spec):**

- Controles táctiles/móviles (touch/drag) — el paddle se controla con teclado y mouse de escritorio, igual que el original.
- El selector de nivel clicable del overlay de pausa original — se elimina, ver arriba; el jugador avanza de nivel 1 a 5 jugando, sin poder saltar.
- Anti-cheat o validación de que la puntuación insertada corresponde a una partida real (mismo alcance que specs 05/06).
- Portar o dar motor real a cualquier otro juego del catálogo (`bloque-buster`, `caida`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `rocas`, `serpentina`) — siguen mostrando la simulación decorativa actual sin cambios.
- Tocar o reemplazar la fila decorativa `bloque-buster` existente — queda en el catálogo de `app/page.tsx` tal cual.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`games`** (tabla existente, sin cambios de esquema): se agrega una fila nueva vía migración SQL:
  ```sql
  insert into games (id, title, short, long, cat, cover, color)
  values (
    'arkanoid',
    'ARKANOID',
    'Destruye la pared de bloques a puro rebote.',
    'Mueve el paddle con las flechas o el mouse para no dejar caer la pelota. Rompe los bloques de cada nivel para sumar puntos y avanzar: 5 niveles con patrones distintos y una pelota cada vez más rápida. Perdés una vida cada vez que la pelota cae, y ganás la partida al limpiar el nivel 5.',
    'ARCADE',
    'cover-arkanoid',
    'magenta'
  );
  ```
- No se agregan columnas ni tablas nuevas a `scores`; una partida de `arkanoid` guarda una fila igual que cualquier otro juego (`{ user_id, game_id: "arkanoid", score }`).
- El motor no necesita callbacks adicionales a los ya definidos en `EngineCallbacks` (`components/games/engine-base.ts`).

## Plan de implementación

1. Escribir y aplicar la migración `add_game_arkanoid` que inserta la fila `arkanoid` en `games`. Verificar en `/biblioteca` que la tarjeta nueva aparece.
2. Invocar `/frontend-design` para diseñar `.cover-arkanoid` en `app/globals.css` (paleta magenta, siguiendo el patrón base + `::after` + `::before` de `.cover-asteroides`/`.cover-tetris`), y agregar `"cover-arkanoid"` a `GAME_COVERS` en `lib/data.ts`.
3. Copiar `spritesheet-breakout.png`, `ball-bounce.mp3` y `break-sound.mp3` de `references/started-games/04-arkanoid/assets/` a `public/games/arkanoid/`.
4. Crear `components/games/arkanoid/engine.ts`: portar la carga del spritesheet, `LEVELS` (embebido o en un módulo hermano `levels.ts`), el estado de paddle/pelota/bloques/explosiones, `update(dt)` y `draw()`, encapsulados en `ArkanoidEngine extends ArcadeEngine`, con soporte de puntero para el paddle y sin el HUD/overlays dibujados en canvas.
5. Agregar la entrada `arkanoid` a `GAME_RUNTIMES` en `components/games/registry.ts` con `pointer: true`.
6. Prueba manual aislada: entrar a `/juegos/arkanoid/jugar` y confirmar que el paddle se mueve con flechas y mouse, la pelota rebota, los bloques se rompen con su animación de explosión y sonido, y se sube de nivel al limpiar la pantalla.
7. Revisión manual completa en `npm run dev`: jugar hasta perder las 3 vidas y hasta completar el nivel 5 (victoria), pausar/reanudar sin que la partida avance durante la pausa, terminar con el botón `FIN`, guardar la puntuación logueado como usuario real (aparece en `/juegos/arkanoid` y `/salon-de-la-fama`) y como invitado (solo `localStorage`), reiniciar con `JUGAR DE NUEVO`, y confirmar que jugar (flechas y mouse) no hace scroll de la página. Verificar `npm run lint` y `npx tsc --noEmit`. Guardar capturas en `.playwright-screenshots/`.

## Criterios de aceptación

- [x] `/biblioteca` muestra la tarjeta "ARKANOID" con cover magenta, buscable y filtrable por categoría `ARCADE`.
- [x] `/juegos/arkanoid` muestra la ficha del juego con su descripción y el leaderboard real (vacío al inicio).
- [x] `/juegos/arkanoid/jugar` carga el motor real: el paddle se mueve con `←`/`→` y con el mouse, la pelota rebota en paredes y paddle, y los bloques se destruyen con animación de explosión y sonido al ser golpeados.
- [x] El HUD superior (Jugador/Puntuación/Vidas/Nivel) refleja en tiempo real el score, las vidas restantes y el nivel real del motor (1 a 5).
- [x] Perder las 3 vidas, completar el nivel 5, o presionar `FIN` abren el modal de "FIN DEL JUEGO" con la puntuación real.
- [x] `PAUSA` congela paddle/pelota/bloques de inmediato; `REANUDAR` continúa exactamente donde quedó, sin overlay de selector de nivel.
- [x] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con `game_id = 'arkanoid'` y aparece en `/juegos/arkanoid` y `/salon-de-la-fama`.
- [x] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [x] `JUGAR DE NUEVO` reinicia el motor a nivel 1, 3 vidas y score 0, sin recargar la página.
- [x] Jugar (flechas y mouse) no produce scroll de la página.
- [x] Los demás juegos del catálogo (incluido `bloque-buster`) siguen mostrando la simulación decorativa actual, sin cambios.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Juego nuevo (`arkanoid`) en vez de reutilizar `bloque-buster`** — mismo criterio que spec 06 con `rocas`: no editar una fila decorativa existente para no romper expectativas sobre ella; `bloque-buster` queda intacta.
- **Se elimina el selector de nivel del overlay de pausa original** — la plataforma ya tiene su propio botón PAUSA/REANUDAR; mantener un segundo mecanismo de pausa con controles propios (clicks sobre botones dibujados en canvas) duplicaría funcionalidad y contradice cómo se resolvió el HUD en spec 06.
- **Se mantienen sprites, sonidos y animación de explosión del original** — a diferencia de Asteroides y Tetris, este puerto sí incluye audio porque el original lo tiene y aporta feedback claro de rotura de bloque; los assets se copian tal cual a `public/games/arkanoid/`.
- **Control híbrido teclado + mouse** — el original ya soporta ambos; se preserva mouse via el flag `pointer` del registry en vez de forzar solo teclado, para no perder fidelidad con la referencia.
- **Completar el nivel 5 dispara game over (victoria) en vez de un estado "ganado" separado** — la plataforma solo tiene un flujo de fin de partida (modal de guardado de puntuación); no se agrega un tercer estado de UI solo para este juego.
- **Se completó la plomería de `pointer` en la plataforma, no solo en este juego** — al implementar, `GameCanvas` exponía `onPointerMove`/`onPointerDown` como props sin que `jugar/page.tsx` los conectara a ningún motor (arkanoid es el primer juego real con `pointer: true`). Se agregaron `handlePointerMove`/`handlePointerDown` (no-op por defecto) a `ArcadeEngine` y se cambió `GameCanvas` para llamarlos directo sobre el motor, igual que ya hace con `handleKeyDown`/`handleKeyUp`, en vez de reenviar por props sin uso. Se actualizó `reference/contract.md` y `reference/porting.md` para reflejarlo. No se tocó `app/juegos/[id]/jugar/page.tsx`.
- **Bug encontrado y corregido durante la verificación manual**: `init()` no reseteaba `this.state` a `"playing"` ni disparaba `onScoreChange(0)`, por lo que tras un game over el motor quedaba trabado y el HUD no reflejaba el reinicio. Corregido siguiendo el mismo patrón ya usado en `tetris`/`asteroides` (`this.state = "playing"` + `this.callbacks.onScoreChange(this.score)` explícitos en `init()`).

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                             | Mitigación                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El control por mouse (`pointer: true`) es el primer uso de ese flag del registry en un juego real; puede requerir ajustes en `GameCanvas` para el mapeo de coordenadas si difiere del supuesto original (canvas 800×600 sin escalar por CSS más que letterboxing). | Validar en el paso 6 del plan antes de conectar el resto; si `GameCanvas` no cubre el caso, es un ajuste acotado a ese componente, no al motor.                                       |
| Los `Audio` clonados (`cloneNode().play()`) pueden fallar o bloquearse por políticas de autoplay del navegador si no hay interacción previa del usuario.                                                                                                           | La pantalla de Jugador ya requiere un click para entrar a jugar, lo que cuenta como interacción; si algún navegador igual bloquea el audio, el juego sigue siendo jugable sin sonido. |
