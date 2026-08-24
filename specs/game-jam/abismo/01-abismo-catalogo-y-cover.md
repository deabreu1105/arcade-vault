# 01 — ABISMO: fila en el catálogo y cover CRT del descenso

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-08-24
**Origen:** game-jam — tema «el fondo del mar»

**Objetivo:** Dar de alta el juego `abismo` en el catálogo con su fila en `games` y su cover CSS,
de modo que aparezca en Biblioteca, Detalle, Jugador y Salón de la Fama sin escribir una línea de
motor todavía.

## Alcance

**Dentro:**

- Fila nueva en `games` (vía migración SQL `add_game_abismo`): `id = "abismo"`,
  `title = "ABISMO"`, `cat = "ARCADE"`, `color = "yellow"`, `cover = "cover-abismo"`, con los
  textos `short` y `long` que se fijan en "Modelo de datos".
- Clase CSS nueva `.cover-abismo` en `app/globals.css`, diseñada con `/frontend-design` sobre la
  paleta `yellow` en fondo azul profundo, con las tres capas que usan todos los covers existentes.
- Alta del string `"cover-abismo"` en `GAME_COVERS` (`lib/data.ts`), sin la cual el panel de
  administración de `/admin/juegos` rechaza el cover al editar la fila.
- El color `yellow` se elige porque ningún juego real lo usa todavía: los cuatro motores actuales
  son cyan (`asteroides`, `tetris`), magenta (`arkanoid`) y green (`snake`). Las filas decorativas
  `gloton` y `rocas` lo ocupan, pero una fila decorativa no bloquea un color.
- Ninguna fila decorativa del catálogo se toca ni se reutiliza, siguiendo el precedente de las specs
  06, 09 y 10. No hay ninguna fila marina previa, así que `abismo` no compite con nada.

**Fuera (no en este spec):**

- El motor `components/games/abismo/engine.ts` y la entrada en `GAME_RUNTIMES` — son del spec
  `02-abismo-motor.md`. Hasta que ese spec se implemente, `/juegos/abismo/jugar` muestra la
  simulación decorativa `.game-arena`, y eso es el comportamiento esperado.
- Assets de imagen o audio: el cover es CSS puro y el juego se dibuja a canvas puro, así que
  `public/games/abismo/` no se crea.
- Tocar cualquier otro juego del catálogo: los ocho decorativos y los cuatro reales siguen igual.
- Cambios de esquema en `games` o en `scores`.
- Tests automatizados: el proyecto no tiene test runner.

## Modelo de datos

- **`games`** (tabla existente, sin cambios de esquema): se agrega una fila nueva vía migración SQL
  `add_game_abismo`.

  ```sql
  insert into games (id, title, short, long, cat, cover, color)
  values (
    'abismo',
    'ABISMO',
    'Hundí el batiscafo en la fosa y aguantá lo más profundo que puedas.',
    'Descendé por una fosa marina que se angosta a cada zona, esquivando las paredes de roca, las medusas a la deriva y los erizos clavados en la pared. Tu puntuación es la profundidad en metros más 50 puntos por cada perla que recogés en el camino. Cada choque revienta uno de tus tres tanques de oxígeno, y con el último tanque termina la inmersión.',
    'ARCADE',
    'cover-abismo',
    'yellow'
  );
  ```

- No se agregan columnas ni tablas. Una partida de `abismo` guardará una fila de `scores` igual que
  cualquier otro juego (`{ user_id, game_id: "abismo", score }`), pero eso recién ocurre con el
  spec 02.
- El `id` cumple `/^[a-z0-9]+(-[a-z0-9]+)*$/`, la regla que valida `app/admin/juegos/actions.ts`, y
  no colisiona con ninguna de las 12 filas actuales de `games`.
- El cover `cover-abismo` no colisiona con ninguno de los 12 strings actuales de `GAME_COVERS`, así
  que no hace falta el sufijo que `snake` necesitó (`cover-snake-real`, porque `cover-snake` ya era
  de la decorativa `serpentina`).

## Plan de implementación

1. Escribir y aplicar la migración `add_game_abismo` con el `insert` literal de arriba. Al terminar,
   `/biblioteca` ya lista una tarjeta "ABISMO" — todavía sin arte, porque la clase CSS no existe.
2. Agregar `"cover-abismo"` a `GAME_COVERS` en `lib/data.ts`, manteniendo el orden alfabético del
   array. Esto solo habilita el string en el panel de administración; no dibuja nada.
3. Invocar `/frontend-design` para escribir `.cover-abismo` en `app/globals.css`, con estas tres
   capas y nada más, siguiendo la forma de `.cover-snake-real` y `.cover-invaders`:
   - **Fondo (`background` de `.cover-abismo`)**: un `linear-gradient(180deg, ...)` de azul de
     superficie a negro casi puro, que representa el agua oscureciéndose con la profundidad, más un
     `repeating-linear-gradient` horizontal muy tenue que insinúa las capas de presión.
   - **`::after`**: el arte principal, un solo `background` con varias capas separadas por comas.
     Rectángulos `linear-gradient` anclados a izquierda y derecha, de anchos decrecientes hacia
     abajo, que dibujan las dos paredes de la fosa cerrándose en V; y dos o tres
     `radial-gradient` chicos entre las paredes que son burbujas subiendo. Va con su `inset` (algo
     así como `inset: 8% 0 0 0`, para que la fosa arranque bajo el borde superior) y un
     `filter: drop-shadow(...)` en un cian apagado que le da el glow de neón a la roca.
   - **`::before`**: un solo glifo Unicode `"●"` en `var(--yellow)` con
     `text-shadow: 0 0 10px var(--yellow)`, posicionado en porcentajes cerca del centro del pasillo
     y a un tercio de la altura, que es el batiscafo bajando con su foco encendido.
     No escribir el CSS terminado en este spec: la paleta y los porcentajes exactos los decide
     `/frontend-design` al implementar.
4. Revisar `/biblioteca` y `/juegos/abismo` con los MCP de Playwright y guardar capturas en
   `.playwright-screenshots/`.

## Criterios de aceptación

- [ ] `/biblioteca` muestra la tarjeta "ABISMO" con su cover propio, encontrable por búsqueda de
      texto y filtrable por la categoría `ARCADE`.
- [ ] El cover se distingue a simple vista de los otros once: fosa azul oscura con un punto amarillo
      descendiendo, sin parecerse a `cover-glot` ni a `cover-rocas`, que también son amarillos.
- [ ] `/juegos/abismo` muestra la ficha con el texto `long` y el leaderboard real, vacío al inicio.
- [ ] `/juegos/abismo/jugar` abre la pantalla de Jugador y muestra la simulación decorativa
      `.game-arena`, porque todavía no existe entrada en `GAME_RUNTIMES` — es el estado esperado al
      cerrar este spec.
- [ ] `/admin/juegos` deja editar la fila `abismo` y acepta `cover-abismo` en el selector de cover.
- [ ] `/salon-de-la-fama` lista "ABISMO" entre los juegos, con su tabla vacía.
- [ ] Los otros once juegos del catálogo no cambian de aspecto ni de comportamiento.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Fila nueva `abismo` en vez de reciclar una decorativa** — ninguna de las ocho decorativas es
  marina, así que ni siquiera hay una candidata; se mantiene igual el precedente de las specs 06,
  09 y 10 de no editar filas existentes.
- **Color `yellow`** — es el único de los cuatro de `GAME_COLORS` que ningún juego real usa, y
  además es el color correcto para la ficción: el foco del batiscafo y las perlas son lo único que
  brilla en un fondo azul negro. Se descartó `cyan`, que sería la elección obvia para agua, porque
  ya lo usan `asteroides` y `tetris` y porque un cover cian sobre agua cian no tendría contraste.
- **Categoría `ARCADE`** — el juego es de reflejos y supervivencia, sin resolución de puzzle ni
  disparo. Se evaluó forzarlo a `PUZZLE` o `SHOOTER` para diversificar categorías y se descartó:
  mentir la categoría rompe el filtro de `/biblioteca`, que es lo único que la usa.
- **Cover sin sufijo (`cover-abismo`, no `cover-abismo-real`)** — el sufijo de `snake` existió solo
  porque `cover-snake` ya estaba tomado; acá no hay colisión.
- **Sin assets en `public/games/abismo/`** — el material de partida está agotado
  (`references/started-games/` ya tiene sus tres juegos portados y `snake-assets/` lo consumió la
  spec 10), y traer sprites nuevos agregaría un costo de licencia que no se puede verificar. Todo
  el juego, cover incluido, se dibuja con gradientes y con canvas.
- **Spec partido en dos** — esta primera mitad termina con el sistema funcionando y commiteable: la
  fila en `games` hace aparecer el juego en las cuatro pantallas sin tocar código de juego, y el
  interruptor que lo vuelve real es la entrada en `GAME_RUNTIMES` del spec 02.
