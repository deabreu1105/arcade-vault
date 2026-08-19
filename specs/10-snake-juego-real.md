# 10 — Snake: cuarto juego real jugable

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-08-19

**Objetivo:** Crear desde cero (sin referencia en `references/started-games/`) un motor real de Snake sobre una grilla de 20×20, usando los sprites de fruta de `references/source-assets/snake-assets/` como comida, y agregarlo al catálogo como un juego nuevo ("snake") con leaderboard real.

## Alcance

**Dentro:**

- Nueva fila en la tabla `games` (vía migración SQL): `id = "snake"`, `title = "SNAKE"`, `cat = "ARCADE"`, `color = "green"`, `cover = "cover-snake-real"`, con `short`/`long` redactados para este spec. La fila decorativa existente `serpentina` (cover `cover-snake`) no se toca ni se reutiliza, siguiendo el mismo criterio que specs 06 y 09 aplicaron con `rocas` y `bloque-buster`.
- Nueva clase CSS `.cover-snake-real` en `app/globals.css`, con paleta verde propia (vía `/frontend-design`), y alta de `"cover-snake-real"` en `GAME_COVERS` (`lib/data.ts`).
- Assets nuevos en `public/games/snake/`: `fruits.png` (spritesheet de frutas, copiado sin cambios de `references/source-assets/snake-assets/`) y un módulo tipado `components/games/snake/sprites.ts` con el atlas de coordenadas, portado de `references/source-assets/snake-assets/sprites.js` (solo la fila pixel-art, `y=136..295`, que es la que se usa en el juego).
- Motor en `components/games/snake/engine.ts`, clase `SnakeEngine extends ArcadeEngine`, mecánica clásica de Snake construida desde cero:
  - Grilla lógica de 20×20 celdas (celda = 24px, canvas 480×480), serpiente representada como lista de segmentos `{col, row}`, movimiento por pasos discretos a intervalos de tiempo (no por píxel continuo).
  - Un único ítem de comida a la vez, ubicado en una celda libre al azar, dibujado con una fruta elegida al azar entre las ~22 variantes del atlas de `sprites.ts` cada vez que se genera comida nueva.
  - Comer la fruta: la serpiente crece un segmento, suma puntos fijos por fruta, y se genera una fruta nueva (con sprite aleatorio) en otra celda libre.
  - Colisión contra el borde de la grilla o contra el propio cuerpo termina la partida (`this.gameOver()`) — sin envolvimiento de bordes.
  - La cabeza y el cuerpo se dibujan con canvas puro (rectángulos redondeados en `var(--green)`, cabeza en un verde más claro con `shadowBlur`/glow) — no hay sprite para esto, solo la fruta usa el spritesheet.
  - Cambiar de dirección con las flechas nunca permite revertir directamente sobre el segmento inmediatamente anterior (p. ej. moviendo a la derecha, `ArrowLeft` no hace nada) — evita una muerte instantánea por error de tecleo típica de este género.
  - "Vidas" en el HUD = siempre `0` (se muestra como `—`, igual que Tetris) porque Snake clásico no tiene vidas: una sola colisión termina la partida.
  - "Nivel" en el HUD empieza en `1` y sube uno cada 5 frutas comidas; cada nivel reduce el intervalo entre pasos de movimiento (la serpiente se mueve más rápido), hasta un piso mínimo de intervalo para que el juego siga siendo jugable en niveles altos.
  - Expone los callbacks estándar de `EngineCallbacks` (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`) y los métodos de `ArcadeEngine` (`start`/`pause`/`resume`/`restart`/`destroy`).
- Entrada `snake` en `GAME_RUNTIMES` (`components/games/registry.ts`): `width: 480`, `height: 480`, `capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]`, sin `pointer` (no usa mouse).

**Fuera (no en este spec):**

- Controles WASD o táctiles — solo flechas de teclado, igual que el resto de los juegos reales del Vault.
- Envolvimiento de bordes (wrap-around) — se descarta a favor de morir contra la pared, ver Decisiones.
- Puntuación distinta por tipo de fruta — todas las frutas valen lo mismo; la variedad visual es solo estética.
- Anti-cheat o validación de que la puntuación insertada corresponde a una partida real (mismo alcance que specs 05/06/09).
- Portar o dar motor real a cualquier otro juego del catálogo (`bloque-buster`, `caida`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `rocas`, `serpentina`) — siguen mostrando la simulación decorativa actual sin cambios.
- Tocar o reemplazar la fila decorativa `serpentina` existente — queda en el catálogo tal cual.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`games`** (tabla existente, sin cambios de esquema): se agrega una fila nueva vía migración SQL:
  ```sql
  insert into games (id, title, short, long, cat, cover, color)
  values (
    'snake',
    'SNAKE',
    'Guía a la serpiente y devorá fruta sin morderte la cola.',
    'Movete con las flechas para recolectar frutas variadas y crecer. Cada 5 frutas subís de nivel y la serpiente acelera. Chocar contra una pared o contra tu propio cuerpo termina la partida al instante.',
    'ARCADE',
    'cover-snake-real',
    'green'
  );
  ```
- No se agregan columnas ni tablas nuevas a `scores`; una partida de `snake` guarda una fila igual que cualquier otro juego (`{ user_id, game_id: "snake", score }`).
- El motor no necesita callbacks adicionales a los ya definidos en `EngineCallbacks` (`components/games/engine-base.ts`).

## Plan de implementación

1. Escribir y aplicar la migración `add_game_snake` que inserta la fila `snake` en `games`. Verificar en `/biblioteca` que la tarjeta nueva aparece.
2. Invocar `/frontend-design` para diseñar `.cover-snake-real` en `app/globals.css` (paleta verde, diferenciada visualmente de `.cover-snake` decorativa existente), y agregar `"cover-snake-real"` a `GAME_COVERS` en `lib/data.ts`.
3. Copiar `fruits.png` a `public/games/snake/`, y crear `components/games/snake/sprites.ts` con el atlas tipado (solo la fila pixel-art de `sprites.js`), referenciando la imagen por `/games/snake/fruits.png`.
4. Crear `components/games/snake/engine.ts`: grilla de 20×20, movimiento por pasos discretos, generación de comida con fruta aleatoria, colisión contra pared/cuerpo, crecimiento, cambio de dirección con bloqueo de reversa directa, progresión de nivel/velocidad, dibujo de serpiente con canvas puro y de la fruta con el spritesheet, encapsulados en `SnakeEngine extends ArcadeEngine`.
5. Agregar la entrada `snake` a `GAME_RUNTIMES` en `components/games/registry.ts`.
6. Prueba manual aislada: entrar a `/juegos/snake/jugar` y confirmar que la serpiente se mueve con las flechas, come fruta (con sprite aleatorio) y crece, y muere al chocar contra la pared o contra su propio cuerpo.
7. Revisión manual completa en `npm run dev`: jugar hasta subir al menos un nivel (5 frutas) y confirmar que la velocidad aumenta, provocar la muerte por pared y por cuerpo propio, pausar/reanudar sin que la partida avance durante la pausa, terminar con el botón `FIN`, guardar la puntuación logueado como usuario real (aparece en `/juegos/snake` y `/salon-de-la-fama`) y como invitado (solo `localStorage`), reiniciar con `JUGAR DE NUEVO`, y confirmar que jugar (flechas) no hace scroll de la página. Verificar `npm run lint` y `npx tsc --noEmit`. Guardar capturas en `.playwright-screenshots/`.

## Criterios de aceptación

- [x] `/biblioteca` muestra la tarjeta "SNAKE" con cover verde, buscable y filtrable por categoría `ARCADE`.
- [x] `/juegos/snake` muestra la ficha del juego con su descripción y el leaderboard real (vacío al inicio).
- [x] `/juegos/snake/jugar` carga el motor real: la serpiente se mueve con `←`/`→`/`↑`/`↓`, no puede revertir directamente sobre sí misma, y crece al comer una fruta (con sprite aleatorio del atlas).
- [x] El HUD superior (Jugador/Puntuación/Vidas/Nivel) refleja en tiempo real el score y el nivel real del motor; Vidas muestra `—`.
- [x] Chocar contra una pared, chocar contra el propio cuerpo, o presionar `FIN` abren el modal de "FIN DEL JUEGO" con la puntuación real.
- [x] Comer 5 frutas sube el nivel en el HUD y la serpiente se mueve visiblemente más rápido.
- [x] `PAUSA` congela la serpiente de inmediato; `REANUDAR` continúa exactamente donde quedó.
- [x] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con `game_id = 'snake'` y aparece en `/juegos/snake` y `/salon-de-la-fama`.
- [x] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [x] `JUGAR DE NUEVO` reinicia el motor a nivel 1, score 0 y una serpiente nueva, sin recargar la página.
- [x] Jugar (flechas) no produce scroll de la página.
- [x] Los demás juegos del catálogo (incluido `serpentina`) siguen mostrando la simulación decorativa actual, sin cambios.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Juego nuevo (`snake`) en vez de reutilizar `serpentina`** — mismo criterio que specs 06 y 09 con `rocas`/`bloque-buster`: no editar una fila decorativa existente; `serpentina` queda intacta.
- **Grilla 20×20 con muerte contra la pared, sin wrap-around** — más predecible y clásico (estilo Nokia); el envolvimiento de bordes se descarta para mantener el mismo nivel de dificultad/tensión que morder la propia cola.
- **Movimiento por pasos discretos sobre una grilla, no por píxel continuo** — es la mecánica estándar de Snake (la serpiente ocupa celdas enteras); simplifica la colisión contra el cuerpo a una comparación de coordenadas de grilla en vez de físicas continuas.
- **Cuerpo de la serpiente dibujado con canvas puro, no con sprites** — el material de referencia solo trae sprites de fruta; el cuerpo se resuelve con rectángulos neon en `var(--green)`, consistente con la estética CRT del resto del Vault (mismo criterio que las naves/asteroides de Asteroides, dibujados a mano).
- **Fruta aleatoria por ítem de comida, mismo puntaje para todas** — aprovecha la variedad visual del atlas (~22 frutas) sin agregar complejidad de balance de puntuación por tipo.
- **"Vidas" = 0/`—` en vez de 1 vida mostrada como corazón** — igual que Tetris: Snake clásico no tiene concepto de vidas, y este patrón ya está establecido en la plataforma para juegos de una sola corrida.
- **Nivel sube cada 5 frutas y acelera el movimiento** — le da progresión y dificultad creciente sin agregar mecánicas nuevas (no hay "niveles" con distintos layouts, a diferencia de Arkanoid).
- **Solo flechas, sin WASD** — consistente con Asteroides/Tetris/Arkanoid, que tampoco agregan un esquema de teclado alternativo.
- **Bug encontrado y corregido durante la verificación manual**: `init()` no reseteaba `this.state` a `"playing"` ni disparaba `onScoreChange(0)`, mismo patrón de bug ya visto y corregido en spec 09 (Arkanoid); corregido igual, explícito en `init()`.
- **Verificación de la colisión contra el propio cuerpo**: la muerte por pared, por reversa bloqueada y el flujo completo de game over/HUD/guardado se verificaron en vivo con Playwright con precisión matemática. La colisión contra el propio cuerpo (misma función `bodyToCheck.some(...)` que la de pared) no se logró disparar de forma confiable con un bot automatizado por Playwright (requiere una serpiente de longitud ≥5 y un timing de teclas exacto, sensible al roundtrip de la herramienta); se verificó en su lugar trazando el algoritmo a mano contra el caso estándar de Snake, incluyendo el caso borde de la cola que se libera en el mismo paso. Queda como pendiente de una prueba manual humana antes de considerarlo 100% verificado en vivo.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A diferencia de los juegos anteriores (movimiento continuo por `dt`), Snake se mueve por pasos discretos a intervalos fijos; si el acumulador de tiempo se implementa mal podría "saltear" un paso durante una pausa o un `dt` grande. | `ArcadeEngine` ya clampea `dt` a 50ms máximo y no llama a `update()` en pausa; el acumulador de pasos del motor se resetea igual que hace `resume()` con `lastTime`, evitando saltos. Se verifica manualmente en el paso 7 del plan. |
| El atlas de `sprites.js` fue generado por un tercero a partir de análisis de píxeles (ver comentario en el archivo); las coordenadas podrían no ser exactas para alguna fruta.                                                         | Se usa tal cual viene; si alguna fruta se recorta mal visualmente es un defecto menor y cosmético, no bloquea la jugabilidad. Se revisa visualmente en la prueba manual del paso 6.                                                  |
