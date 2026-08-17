# 06 — Asteroides: primer juego real jugable

**Estado:** Implementado
**Depende de:** SPEC 01, SPEC 04, SPEC 05
**Fecha:** 2026-08-17

**Objetivo:** Portar el juego de Asteroids ya existente en `references/started-games/02-asteroids/` a un componente React/canvas real, agregarlo al catálogo como un juego nuevo ("asteroides") y conectarlo a la pantalla de Jugador (`app/juegos/[id]/jugar/page.tsx`) reemplazando, solo para ese juego, la simulación decorativa por partidas reales con puntuación guardada de verdad.

## Alcance

**Dentro:**

- Nueva fila en la tabla `games` (vía migración SQL): `id = "asteroides"`, `title = "ASTEROIDES"`, `cat = "SHOOTER"`, `color = "cyan"`, con `short`/`long` redactados para este spec y `cover = "cover-asteroides"`. La fila existente `rocas` no se toca ni se reutiliza.
- Nueva clase CSS `.cover-asteroides` en `app/globals.css`, inspirada visualmente en `.cover-rocas` pero con paleta cian propia para diferenciarse en `/biblioteca`.
- Motor del juego portado a TypeScript puro (sin JSX) en `components/games/asteroides/engine.ts`: mismas clases y mecánicas que `references/started-games/02-asteroids/game.js` (nave, balas, asteroides que se dividen, partículas de explosión, power-up de disparo triple, envolvimiento toroidal de bordes), adaptado para:
  - Recibir el `CanvasRenderingContext2D` y las dimensiones por parámetro en vez de variables globales de módulo.
  - Exponer soporte real de pausa (un método que congela `update()` sin detener `draw()`).
  - Exponer callbacks para el HUD externo: `onScoreChange(score)`, `onLivesChange(lives)`, `onLevelChange(level)`, `onGameOver(score)`.
  - Exponer métodos de control: `start()`, `pause()`, `resume()`, `restart()`, `destroy()` (retira listeners de teclado).
  - Eliminar el HUD dibujado en el propio canvas (SCORE/NIVEL/vidas/indicador de disparo triple) y el overlay de "GAME OVER" con reinicio por `Space` — ambos quedan reemplazados por el HUD y el modal de React ya existentes en la pantalla de Jugador.
- Componente cliente `components/games/asteroides/asteroides-canvas.tsx`: monta un `<canvas width={800} height={600}>` escalado con CSS (mantiene proporción 4:3, llena el contenedor `.crt-screen` disponible), instancia el motor al montar, conecta los callbacks a props, y expone `pause`/`resume`/`restart`/`forceGameOver` vía `useImperativeHandle` a un ref.
- Captura de teclado con `preventDefault()` sobre `ArrowLeft`, `ArrowRight`, `ArrowUp` y `Space` mientras el componente está montado, para que jugar no haga scroll de la página; los listeners se remueven al desmontar.
- `app/juegos/[id]/jugar/page.tsx`: cuando `game.id === "asteroides"`, renderiza `AsteroidesCanvas` dentro de `.crt-screen` en vez del `.game-arena` decorativo, y el HUD de React (Jugador/Puntuación/Vidas/Nivel) pasa a leer el estado real emitido por los callbacks del motor en vez del `setInterval` que suma puntos al azar. El nivel mostrado es el nivel real del motor (sube al limpiar todos los asteroides de la pantalla), no la fórmula `Math.floor(score/2500)+1`.
- Los botones existentes de la pantalla de Jugador se conectan al motor solo para `asteroides`:
  - `PAUSA`/`REANUDAR` llama a `pause()`/`resume()` del ref.
  - `FIN` llama a `forceGameOver()`, que dispara el mismo flujo de guardado de puntuación (modal) ya existente.
  - `JUGAR DE NUEVO` (en el modal, tras guardar o descartar la puntuación) llama a `restart()` del ref en vez de reiniciar solo el estado de React.
- El guardado de puntuación al terminar la partida de `asteroides` usa exactamente el mismo camino que hoy (`insertScore` para usuario real vía `saveRealScoreAction`, `saveScore` de `localStorage` para invitado) — no se toca `actions.ts` ni `lib/supabase/queries.ts`.

**Fuera (no en este spec):**

- Controles táctiles/móviles — el juego se juega solo con teclado en escritorio, igual que la referencia original.
- Sonido/música — la referencia original no tiene audio y no se agrega aquí.
- Portar o dar motor real a cualquier otro juego del catálogo (`bloque-buster`, `caida`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `rocas`, `serpentina`) — todos siguen mostrando la simulación decorativa actual sin cambios.
- Tocar o reemplazar la fila `rocas` existente en `games` — queda en el catálogo tal cual, sin usarse por ningún juego real.
- Anti-cheat o validación de que la puntuación insertada corresponde a una partida real jugada (mismo alcance que spec 05).
- Leaderboard, Salón de la Fama o vistas agregadas — no cambian; `asteroides` las usa automáticamente por ser una fila más de `games`/`scores`.
- Un indicador visual del power-up de disparo triple en el HUD externo — el power-up sigue funcionando (dispara 3 balas), pero al eliminarse el HUD dibujado en canvas no se agrega un quinto indicador al HUD de React.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`games`** (tabla existente de spec 05, sin cambios de esquema): se agrega una fila nueva vía migración SQL:
  ```sql
  insert into games (id, title, short, long, cat, cover, color)
  values (
    'asteroides',
    'ASTEROIDES',
    'Pulveriza rocas espaciales en gravedad cero.',
    'Rota tu nave triangular, propúlsate y dispara para partir asteroides en fragmentos cada vez más pequeños. Sobrevive con tus 3 vidas, sube de nivel al limpiar el campo y atrapa el power-up cian de disparo triple cuando aparezca.',
    'SHOOTER',
    'cover-asteroides',
    'cyan'
  );
  ```
- **Estado interno del motor** (`components/games/asteroides/engine.ts`, no persistido, vive solo en memoria del cliente mientras se juega):
  ```ts
  type EngineCallbacks = {
    onScoreChange: (score: number) => void;
    onLivesChange: (lives: number) => void;
    onLevelChange: (level: number) => void;
    onGameOver: (score: number) => void;
  };
  ```
- No se agregan columnas ni tablas nuevas a `scores`; una partida de `asteroides` guarda una fila igual que cualquier otro juego (`{ user_id, game_id: "asteroides", score }`).

## Plan de implementación

1. Escribir y aplicar la migración que inserta la fila `asteroides` en `games` (ver Modelo de datos). Verificar en `/biblioteca` que la tarjeta nueva aparece con el cover cian.
2. Agregar la clase `.cover-asteroides` a `app/globals.css`, inspirada en `.cover-rocas` pero con paleta cian.
3. Crear `components/games/asteroides/engine.ts` portando las clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` y las funciones de estado/update/draw de `game.js`, encapsuladas en una clase `AsteroidsEngine` que recibe `(ctx, callbacks)` en su constructor, sin HUD ni overlay de game over dibujados, con `pause()`/`resume()`/`restart()`/`destroy()`.
4. Crear `components/games/asteroides/asteroides-canvas.tsx`: componente cliente con canvas 800x600 escalado por CSS, que instancia `AsteroidsEngine` en un `useEffect`, conecta los callbacks a las props del componente, expone `pause`/`resume`/`restart`/`forceGameOver` vía `forwardRef` + `useImperativeHandle`, y registra/limpia los listeners de teclado con `preventDefault`.
5. Prueba manual aislada: montar `AsteroidesCanvas` directamente (o desde la propia pantalla de Jugador apuntando a `game.id === "asteroides"` sin conectar aún los botones) y confirmar que el juego corre, se mueve, dispara, rompe asteroides y sube de nivel dentro del `crt-screen`.
6. Actualizar `app/juegos/[id]/jugar/page.tsx`: agregar la rama condicional para `game.id === "asteroides"` que renderiza `AsteroidesCanvas`, conecta su HUD a los callbacks del motor (reemplazando el `setInterval` falso solo para esta rama) y conecta `PAUSA`/`FIN`/`JUGAR DE NUEVO` al ref del motor. Los demás juegos siguen exactamente igual que hoy.
7. Revisión manual en `npm run dev`: jugar una partida completa de Asteroides (moverse, disparar, romper asteroides grandes/medianos/pequeños, subir de nivel, perder las 3 vidas), pausar y reanudar sin que el juego avance durante la pausa, terminar con el botón `FIN` y con la muerte natural, guardar la puntuación logueado como usuario real (aparece en `/juegos/asteroides` y `/salon-de-la-fama`) y como invitado (solo en `localStorage`), reiniciar con `JUGAR DE NUEVO`, y confirmar que jugar no hace scroll de la página. Verificar que `npm run lint` pasa sin errores.

## Criterios de aceptación

- [x] `/biblioteca` muestra la tarjeta "ASTEROIDES" con cover cian, buscable y filtrable por categoría `SHOOTER` igual que el resto del catálogo.
- [x] `/juegos/asteroides` muestra la ficha del juego con su descripción y el leaderboard real (vacío al inicio, con el estado "Aún no hay puntuaciones" de spec 05).
- [x] Entrar a `/juegos/asteroides/jugar` carga el motor real: la nave rota con `←`/`→`, propulsa con `↑`, dispara con `Espacio`, y los asteroides se dividen al ser destruidos.
- [x] El HUD superior (Jugador/Puntuación/Vidas/Nivel) refleja en tiempo real el score, las vidas y el nivel reales del motor, no valores simulados.
- [x] Perder las 3 vidas o presionar `FIN` abre el modal de "FIN DEL JUEGO" existente con la puntuación real de la partida.
- [x] `PAUSA` congela el movimiento de nave/asteroides/balas de inmediato; `REANUDAR` continúa la partida exactamente donde quedó.
- [x] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con `game_id = "asteroides"` y esa puntuación aparece en `/juegos/asteroides` y `/salon-de-la-fama`.
- [x] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]` y no aparece en el leaderboard real, igual que los demás juegos.
- [x] `JUGAR DE NUEVO` reinicia el motor a nivel 1, 3 vidas y score 0, y el juego vuelve a ser jugable sin recargar la página.
- [x] Jugar (usar flechas y espacio) no produce scroll de la página.
- [x] Los demás juegos del catálogo (`bloque-buster`, `caida`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `rocas`, `serpentina`) siguen mostrando la simulación decorativa actual, sin cambios de comportamiento.
- [x] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Juego nuevo (`asteroides`) en vez de reutilizar la fila `rocas`** — aunque la descripción de `rocas` coincide con Asteroids, se prefiere no editar una entrada existente para evitar romper posibles enlaces o expectativas sobre esa fila; `rocas` queda intacta y sin usarse por ningún motor real todavía.
- **Canvas fijo 800×600 escalado con CSS, no responsive** — mantiene exactamente el balance de físicas/velocidades del juego original (pensado para esa resolución lógica); reescribir las constantes a un canvas responsive es riesgo innecesario para este spec. Como contrapartida, el escalado por CSS puede verse ligeramente borroso en pantallas de alta densidad (ver Riesgos).
- **HUD dibujado en canvas eliminado, se usa solo el HUD de React existente** — evita duplicar información (score/vidas/nivel) en dos lugares distintos de la pantalla; mantiene consistencia visual con el resto de los juegos del Vault.
- **Se agrega soporte real de pausa al motor** — el juego original no lo necesitaba (corría standalone), pero la plataforma ya expone un botón de pausa funcional en los demás juegos; se prioriza que Asteroides se comporte igual, congelando `update()` sin detener el `draw()` del último frame.
- **Nivel del HUD pasa a ser el real del motor solo para este juego** — la fórmula `Math.floor(score/2500)+1` usada por los juegos simulados no tiene sentido una vez que existe un nivel real que sube al limpiar el campo de asteroides.
- **`preventDefault()` en flechas y espacio mientras se juega** — sin esto, jugar en una página real (a diferencia del `index.html` standalone original) haría scroll del documento con cada tecla, rompiendo la jugabilidad.
- **Motor separado en `engine.ts` (lógica pura) y `asteroides-canvas.tsx` (componente React)** — permite portar las clases del juego casi sin cambios estructurales y mantener el componente React enfocado solo en el ciclo de vida (montar/desmontar/ref), facilitando revisar el motor de forma aislada del código de Next.js.
- **Sin indicador visual del power-up de disparo triple en el HUD externo** — agregar un quinto stat al HUD de React no formaba parte de lo acordado; el power-up sigue siendo funcional, solo pierde su contador visual en pantalla.
- **Se elimina el overlay interno de "GAME OVER" y el reinicio por `Space`** — quedarían duplicados con el modal de "FIN DEL JUEGO" que ya existe en la pantalla de Jugador; el reinicio pasa a controlarse exclusivamente desde el botón "JUGAR DE NUEVO" del modal.

## Riesgos identificados

- **Escalado CSS de un canvas de resolución fija puede verse borroso en pantallas de alta densidad de píxeles** — no se resuelve en este spec (requeriría manejar `devicePixelRatio` y redibujar a mayor resolución interna); si se nota en la revisión manual, queda documentado como mejora futura.
- **Listeners de teclado a nivel `window`:** si `destroy()` no se llama correctamente al desmontar el componente (por ejemplo, al salir con "SALIR" antes de que termine la partida), podrían quedar residuos escuchando teclas fuera de la pantalla de Jugador; se verifica manualmente saliendo del juego a mitad de partida y confirmando que las flechas ya no afectan nada fuera de `/juegos/asteroides/jugar`.
- **Divergencia entre el nivel real del motor y la fórmula usada por los demás juegos:** alguien que compare el HUD de Asteroides con el de otro juego notará que "Nivel" significa algo distinto en cada uno; se acepta porque Asteroides es el primer juego con motor real y esa diferencia es inherente a tener datos reales en vez de simulados.
