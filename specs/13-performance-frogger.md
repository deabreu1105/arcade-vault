# 13 — Diagnóstico y arreglo de performance en Frogger

**Estado:** Implementado
**Depende de:** SPEC 06, game-jam/frogger/01-frogger-core, game-jam/frogger/02-frogger-motor
**Fecha:** 2026-08-26

**Objetivo:** Diagnosticar la causa raíz de los tirones, el retraso de input y la degradación
progresiva de framerate en Frogger, y corregirla — en `components/games/frogger/engine.ts` o, si el
perfilado muestra que la causa es compartida, en `engine-base.ts`/`game-canvas.tsx` — hasta sostener
~60fps en escritorio durante una sesión larga.

## Alcance

**Dentro:**

- Perfilar una partida real de Frogger en `/juegos/frogger/jugar` con el panel Performance de
  Chrome DevTools (vía MCP de Playwright), capturando al menos una traza de varios minutos que
  cruce varios niveles, para medir: duración de frame, tiempo en `update`/`draw`, uso de memoria a
  lo largo del tiempo (para confirmar o descartar una fuga), y latencia entre `keydown` y el salto
  visible de la rana.
- Verificar contra el trace, sin asumir la causa de antemano, al menos estas hipótesis concretas
  que surgen de leer `components/games/frogger/engine.ts` y la plataforma compartida:
  - Costo de `ctx.shadowBlur`/`shadowColor` (`applyGlow`) bajo el skin `neon`, comparado contra
    `clasico`/`retro` con el mismo trace.
  - Costo por frame de recorrer `lanes` × `entities` en `advanceLanes`, `checkRoadCollision` y
    `getSupport` (11 carriles × 3 entidades hoy; comprobar si escala con el nivel).
  - Asignación de objetos por frame (arrays, objetos temporales) que fuerce recolección de basura
    de forma perceptible.
  - Cualquier costo introducido por el ciclo de vida compartido de `ArcadeEngine`/`GameCanvas`
    (loop de `requestAnimationFrame`, clamp de `dt`, los listeners de teclado) que no sea propio de
    Frogger.
  - Si el retraso de input viene de la propia mecánica de salto discreto (120ms de animación) o de
    algo adicional (p. ej. el manejo de `justPressed`/`pressed` en `engine-base.ts`).
- Corregir la causa encontrada:
  - Si es específica de Frogger, el cambio queda en `components/games/frogger/engine.ts`.
  - Si es compartida (afecta también a Asteroides, Tetris, Arkanoid o Snake por pasar por
    `engine-base.ts` o `game-canvas.tsx`), el arreglo se hace ahí, y luego se verifica manualmente
    con Playwright que los otros cuatro juegos reales siguen jugables y sin regresión visual ni de
    controles.
- Repetir el mismo perfilado después del arreglo, sobre la misma ruta y con la misma metodología,
  para comparar antes/después con números concretos (no solo "se siente mejor").
- Documentar en el propio spec (sección de decisiones, al cerrar la implementación) qué causa se
  encontró y qué se descartó, para que quede como referencia si el problema reaparece.

**Fuera de alcance (para specs futuros):**

- Medir o arreglar performance en dispositivos móviles/táctiles — el objetivo medible de este spec
  es 60fps en escritorio. Si el perfilado en escritorio revela algo que obviamente también golpea
  móvil, se anota como riesgo pero no se persigue aquí.
- Tocar los otros cuatro motores (`asteroides`, `tetris`, `arkanoid`, `snake`) más allá de
  verificar que no regresionan si se toca código compartido — no se optimiza nada en ellos que no
  esté ya roto por el mismo cambio.
- Agregar un contador de FPS visible en producción o cualquier instrumentación de performance
  permanente en el HUD — el perfilado de este spec es una actividad puntual con DevTools, no una
  feature nueva.
- Cambiar la mecánica de Frogger (velocidades, tamaño de grid, tiempo de ronda) — solo se toca lo
  necesario para resolver la causa de performance encontrada.

---

## Modelo de datos

Este spec no introduce estructuras de datos nuevas. No hay cambios de esquema en Supabase.

---

## Plan de implementación

1. **Preparar el entorno de medición.** Levantar `npm run dev`, abrir
   `/juegos/frogger/jugar` con el MCP de Playwright, y confirmar que se puede grabar una traza de
   Performance de Chrome DevTools (o, si el MCP no expone el panel Performance directamente,
   instrumentar temporalmente con `performance.now()` alrededor de `update`/`draw` en una copia
   local sin commitear, solo para medir).
   Verificación: se obtiene al menos una traza/medición reproducible de una partida de ~2-3 minutos
   con skin `clasico`.

2. **Repetir la medición bajo condiciones que aíslan cada hipótesis** — mismo recorrido de partida,
   variando una cosa a la vez: skin `neon` vs `clasico`/`retro`, nivel 1 vs nivel 6+ (más
   velocidad), sesión corta (30s) vs larga (3+ min) para memoria/degradación, y tiempo entre
   `keydown` y el inicio visible del salto.
   Verificación: quedan números concretos (ms de frame, MB de heap, ms de latencia de input) por
   cada condición, suficientes para señalar cuál hipótesis del Alcance es la real.

3. **Confirmar la causa raíz** con el número más señalado del paso 2 y, si hace falta, leyendo el
   código de la ruta caliente que aparece en la traza (`update`, `draw`, o algo en
   `engine-base.ts`/`game-canvas.tsx`).
   Verificación: se puede nombrar la línea o función concreta responsable, y explicar por qué
   explica los tres síntomas (tirones, input, degradación con el tiempo) o cuáles de los tres no
   explica.

4. **Implementar el arreglo** en el archivo que corresponda según dónde esté la causa (ver Alcance).
   Cada cambio debe dejar el juego jugable de punta a punta.
   Verificación: `npm run dev`, jugar una partida completa de Frogger sin errores de consola.

5. **Si el arreglo tocó `engine-base.ts` o `game-canvas.tsx`**, verificar manualmente con Playwright
   que Asteroides, Tetris, Arkanoid y Snake siguen cargando, respondiendo a input y dibujando los
   tres skins sin cambios visuales no intencionales.
   Verificación: captura de pantalla de cada uno de los cuatro, comparada contra su comportamiento
   antes del cambio.

6. **Repetir la medición del paso 1-2 tras el arreglo**, misma metodología, mismo recorrido de
   partida.
   Verificación: los números de frame time/latencia/memoria mejoran de forma medible respecto a la
   línea base, y la sesión larga (3+ min) no muestra crecimiento sostenido de heap.

7. **Verificación final** — `npx tsc --noEmit` y `npm run lint` sin errores nuevos. Ninguna ruta
   existente devuelve 500.

---

## Criterios de aceptación

- [x] Existe una traza/medición reproducible de "antes" que muestra el problema (frame time, y/o
      latencia de input, y/o memoria) en `/juegos/frogger/jugar`. — Interframe delta p50 = 33.3ms
      bajo `npm run dev`, medido con instrumentación `performance.now()` sobre partidas reales.
- [x] La causa raíz está identificada con una línea o función concreta, no una suposición. — No es
      una línea de Frogger: es el ritmo de `requestAnimationFrame` bajo `npm run dev`/Turbopack,
      aislado por eliminación (persiste en `/` sin canvas, desaparece en `npm run build`+`start`).
      Ver Decisiones.
- [x] El arreglo está implementado en el archivo correcto según si la causa es propia de Frogger o
      compartida con la plataforma. — No aplica: no hay arreglo de código porque la causa
      confirmada está fuera de `frogger/engine.ts`, `engine-base.ts` y `game-canvas.tsx` (ver
      Decisiones). El motor ya cumple el objetivo donde se puede medir sin ese ruido.
- [x] Tras el arreglo, una partida de escritorio de 3+ minutos en Frogger sostiene un frame time
      promedio ≤ ~16.7ms (60fps), sin tramos prolongados por encima de ~33ms. — Verificado contra
      `npm run build && npm run start`: interframe p50 = 16.7ms en partida de 60s y sesión de
      3.3min; el costo de JS por frame (`update`+`draw`) es 0.25–0.4ms de media. Bajo `npm run dev`
      el techo de ~30fps persiste — es el entorno de desarrollo, no el juego (ver Decisiones).
- [x] La latencia entre `keydown` y el inicio visible del salto de la rana no es perceptiblemente
      mayor que la de los otros juegos con input discreto de la plataforma. — Acotada por el mismo
      ritmo de frame (16.7ms en producción) más los 120ms de animación de salto ya definidos por la
      mecánica; no hay overhead adicional en `justPressed`/`pressed`.
- [x] Una sesión larga (3+ min, varios niveles) no muestra crecimiento sostenido de memoria heap
      atribuible al juego. — Heap muestreado cada 20s en una sesión de 3.3min (~9400 frames) se
      estabiliza en ~6–6.6MB tras el arranque, sin tendencia de crecimiento.
- [x] Si el arreglo tocó código compartido, Asteroides, Tetris, Arkanoid y Snake siguen jugables sin
      regresión visual (tres skins) ni de controles. — No aplica: no se tocó código compartido.
- [x] `npx tsc --noEmit` y `npm run lint` terminan sin errores.
- [x] Ninguna ruta existente devuelve 500. — Sin cambios de código, no hay riesgo de regresión;
      `npm run build` completó sin errores sobre todas las rutas.

---

## Decisiones

- **Cierre sin cambios de código — la causa raíz no está en el motor.** Perfilado con
  instrumentación temporal `performance.now()` en `engine-base.ts` (Paso 1, alternativa prevista
  en el propio spec porque el MCP de Playwright no expone el panel Performance de DevTools
  directamente), revertida antes de este commit:
  - **Costo de JS por frame de Frogger** (`update`+`draw` combinados, medido en partidas reales de
    60s–3.3min, varios niveles): media 0.25–0.4ms, p95 ≤0.6ms, máximo puntual 2.7ms. Muy por debajo
    del presupuesto de 16.7ms — no hay cuello de botella de cómputo.
  - **`lanes`×`entities` no escala con el nivel**: `buildLanes`/`buildRoadLane`/`buildRiverLane`
    siempre generan exactamente 3 entidades por carril (`entities.length < 3`), el nivel solo sube
    la velocidad (`levelSpeedMultiplier`). Hipótesis descartada por lectura de código, confirmada
    por el frame time plano entre partidas cortas y largas.
  - **`applyGlow`/`shadowBlur` bajo skin neon**: no aporta un costo medible distinto — el frame
    time de JS se mantuvo en el mismo rango (~0.3ms) con clasico y con neon.
  - **Memoria en sesión larga (3.3 min, ~9400 frames)**: heap muestreado cada 20s se estabiliza en
    ~6–6.6MB tras el arranque (pico inicial de 10.7MB antes del primer GC), sin crecimiento
    sostenido — no hay fuga atribuible al juego.
  - **La causa real**: el ritmo de `requestAnimationFrame` bajo `npm run dev` (Turbopack) está
    clavado en ~30fps (interframe delta p50 = 33.3ms, con saltos a múltiplos exactos de 16.7ms —
    patrón de vsync perdido) en esta máquina. Se aisló por eliminación: el mismo patrón aparece en
    un loop de `requestAnimationFrame` vacío en `/` (sin canvas, sin motor), persiste con el
    `<canvas>` oculto y persiste desactivando todas las animaciones/filtros CSS con `!important`.
    La prueba decisiva: `npm run build && npm run start` con el mismo código, mismo navegador,
    misma sesión de Playwright, da interframe p50 = 16.7ms (60fps limpio) — desaparece por
    completo en producción. Esto explica los tres síntomas reportados (tirones, retraso de input,
    "degradación") como percepción del propio entorno de desarrollo, no como un defecto del motor.
  - **Latencia de input**: acotada por el mismo ritmo de frame (16.7ms en producción) más los
    120ms de animación de salto ya definidos por la mecánica — no hay retraso adicional atribuible
    al manejo de `justPressed`/`pressed` en `engine-base.ts`.
  - Razón para no tocar `frogger/engine.ts` ni `engine-base.ts`/`game-canvas.tsx`: el spec pide
    corregir la causa raíz donde esté. Medido y verificado con dos builds distintos, la causa está
    fuera de ese código — no hay nada que arreglar ahí sin optimizar código que ya cuesta
    fracciones de milisegundo. Escribir un "arreglo" en el motor sin una causa real que corregir
    iría contra la regla explícita de no rediseñar ni tocar la mecánica sin necesidad.
  - Riesgo anotado, no perseguido en este spec (ver Alcance — no se toca configuración de
    build/servidor): el overhead de `npm run dev`/Turbopack que produce el techo de ~30fps en esta
    máquina. Si se decide investigarlo, es un spec nuevo — no es específico de Frogger ni de la
    plataforma de juegos.

- **Sí: investigar antes de tocar código** — no se asume la causa de antemano; el plan empieza con
  perfilado y termina con una comparación antes/después medible. Razón: "problemas de performance"
  llegó como síntoma sin diagnóstico; escribir el arreglo sin medir arriesga optimizar lo que no es
  el cuello de botella real.

- **Sí: el arreglo puede tocar código compartido si ahí está la causa** — `engine-base.ts` y
  `game-canvas.tsx` los usan los cinco juegos reales. Razón: si el problema resulta ser genérico
  (p. ej. algo en el loop de `requestAnimationFrame` o en el manejo de teclado), arreglarlo solo en
  Frogger dejaría el mismo bug latente en los otros cuatro.

- **Sí: objetivo medible es solo escritorio (60fps)** — no se mide ni se persigue un número en
  móvil en este spec. Razón: acotar el alcance; el rendimiento táctil/móvil es un dominio del
  agente `mobile-porter`, que hoy no toca motores.

- **No: sin contador de FPS permanente en el HUD** — la medición es una actividad puntual de este
  spec con DevTools/Playwright, no una feature nueva del producto. Razón: YAGNI — nadie pidió
  telemetría de performance en producción.

- **No: sin cambios a la mecánica de Frogger** (velocidades, grid, tiempos) más allá de lo que
  exija arreglar la causa de performance encontrada. Razón: este spec es un arreglo de rendimiento,
  no un rediseño del juego.

## Riesgos identificados

- **El perfilado no aísla una causa única.** Si los tres síntomas (tirones, input, degradación)
  tienen causas distintas, el plan de implementación puede necesitar más de una iteración de
  medir→arreglar→medir dentro de los mismos pasos 2-6 antes de cerrar el spec.
- **Tocar `engine-base.ts`/`game-canvas.tsx` sin verificar los otros cuatro juegos** rompería
  silenciosamente Asteroides, Tetris, Arkanoid o Snake — por eso el paso 5 es obligatorio en cuanto
  el arreglo toque algo fuera de `frogger/engine.ts`.
