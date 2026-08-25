# 12 — Controles táctiles para jugar en dispositivos móviles

**Estado:** Implementado
**Depende de:** SPEC 06, SPEC 08, SPEC 09, SPEC 10
**Fecha:** 2026-08-24

**Objetivo:** Hacer jugables los cuatro juegos reales del Vault en una pantalla táctil, agregando
un overlay de controles genérico declarado por juego en `GAME_RUNTIMES` — un conjunto de botones
táctiles idénticos entre sí (misma forma, tamaño y estilo), cada uno posicionado individualmente
sobre el canvas — para Asteroides, Tetris y Snake, y arrastre táctil nativo de la pala para
Arkanoid, sin tocar los motores.

## Alcance

**Dentro:**

- Un nuevo campo opcional `touchControls` en `GameRuntime` (`components/games/registry.ts`): un
  arreglo de botones táctiles, cada uno con el `code` de tecla que sintetiza (el mismo que ya
  captura `capturedKeys`), una etiqueta/ícono y una posición individual fija sobre el canvas. Se
  agrega esta entrada a `asteroides`, `tetris` y `snake`. `arkanoid` no la usa.
- Un componente nuevo `components/games/touch-controls.tsx` (`TouchControls`), genérico: recibe el
  arreglo de `touchControls` de un runtime y renderiza cada botón en su posición individual sobre
  el canvas, todos con exactamente el mismo estilo visual — no hay agrupación por función ni
  variantes de forma entre un botón de movimiento y uno de acción. Cada botón dispara
  `engine.handleKeyDown(code)` / `handleKeyUp(code)` — los mismos métodos que ya expone
  `ArcadeEngine` para el teclado — así que ningún motor cambia.
- El cableado en `components/games/game-canvas.tsx`: monta `TouchControls` cuando el runtime trae
  `touchControls`, y agrega manejo de eventos táctiles (`touchstart`/`touchmove`) al canvas cuando
  `pointer: true`, en paralelo a los de mouse ya existentes, reusando `handlePointerMove`/
  `handlePointerDown` del motor.
- Estilos nuevos en `app/globals.css` para el overlay de `TouchControls`: los botones solo se
  muestran bajo `@media (pointer: coarse)`, así que en desktop con mouse el DOM existe pero no se
  ve ni intercepta clics. `touch-action: none` sobre el canvas y sobre cada botón táctil, para que
  arrastrar o tocar durante la partida no haga scroll ni zoom de la página.
- Diseño visual del overlay vía `/frontend-design`, como exige CLAUDE.md para toda UI nueva: un
  único estilo de botón (forma, tamaño, color, estado `:active`) que se reutiliza para **todos**
  los controles de los tres juegos, más la posición individual de cada botón sobre cada canvas,
  coherente con la estética CRT del resto del Vault y legible sobre los tres skins.
- Mapeo de botones por juego (recomendado a partir de sus `capturedKeys` actuales; las posiciones
  concretas de cada botón sobre el canvas las define `/frontend-design`, todas con el mismo
  estilo):
  - **Asteroides** (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space`): cuatro botones — girar-izquierda,
    girar-derecha, impulso y "DISPARAR" (`Space`).
  - **Tetris** (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`/`Space`/`KeyX`): cinco botones —
    mover-izquierda, mover-derecha, caída suave (`ArrowDown`), "GIRAR" (`ArrowUp`) y "CAÍDA RÁPIDA"
    (`Space`). `KeyX` no necesita botón propio: ya es un alias de rotar que el motor escucha
    además de `ArrowUp`.
  - **Snake** (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`): cuatro botones, uno por dirección.
  - **Arkanoid**: sin `touchControls`. Arrastrar el dedo sobre el canvas mueve la pala, igual que
    el mouse hoy; no hay botón de lanzamiento porque la bola ya se relanza sola
    (`components/games/arkanoid/engine.ts:143-146`).

**Fuera (no en este spec):**

- Cualquier cambio a los motores (`engine.ts` de cada juego). El overlay solo sintetiza los mismos
  eventos de teclado que el motor ya maneja; `handlePointerMove`/`handlePointerDown` de Arkanoid
  tampoco cambian de firma.
- Rediseño responsive del HUD, los botones PAUSA/FIN/SALIR o el selector de skin
  (`app/juegos/[id]/jugar/page.tsx`). Son HTML normal, no canvas, y ya se adaptan razonablemente;
  quedan fuera para no mezclar dos problemas en un spec.
- Los ocho juegos decorativos (`.game-arena`). No tienen motor ni son jugables de verdad, así que
  "jugar en móvil" no les aplica — mismo criterio que specs 06/08/09/10/11.
- Forzar o sugerir orientación horizontal ("girá tu dispositivo"). Los controles se muestran
  siempre que el dispositivo sea táctil, en cualquier orientación.
- Detección en JavaScript de capacidades táctiles (`ontouchstart in window`, `navigator.maxTouchPoints`,
  etc.). La visibilidad del overlay es puramente CSS (`@media (pointer: coarse)`), para no
  introducir un mismatch de hidratación entre servidor y cliente.
- Soporte multi-touch simultáneo más allá de un dedo por gesto (p. ej. mantener dos botones a la
  vez en Tetris/Asteroides). Cada botón maneja su propio `touchstart`/`touchend`
  independientemente; no se testea combinaciones simultáneas exhaustivamente.
- PWA, instalación en pantalla de inicio, o cualquier cambio de manifest/service worker.

## Modelo de datos

Sin cambios de esquema ni persistencia nueva. `touchControls` es un arreglo de configuración
estático en TypeScript (`components/games/registry.ts`), del mismo tipo que `capturedKeys` ya es
hoy — no se guarda nada en `localStorage` ni en Supabase.

Tipo nuevo en `components/games/registry.ts`:

```ts
export type TouchButton = {
  /** El mismo event.code que el motor ya escucha vía capturedKeys. */
  code: string;
  /** Texto corto o ícono a mostrar dentro del botón. */
  label: string;
  /** Posición fija sobre el canvas, como porcentaje del ancho/alto lógico. */
  position: { top: string; left: string };
};
```

Cada botón declara su propia posición individual — no hay agrupación por zona ni por función. Los
botones de movimiento y el de acción comparten exactamente el mismo componente/estilo visual; lo
único que varía entre ellos es `code`, `label` y `position`.

`GameRuntime` gana `touchControls?: TouchButton[]`.

## Plan de implementación

Cada paso deja el sistema funcionando y es commiteable por separado.

1. **Tipo y datos en el registry.** Agregar `TouchButton` y el campo opcional `touchControls` a
   `GameRuntime` en `components/games/registry.ts`, y poblar las entradas de `asteroides`, `tetris`
   y `snake` según el mapeo de botones de arriba. `arkanoid` no se toca. Verificación:
   `npx tsc --noEmit` pasa; nada visual cambia todavía porque nadie lee el campo nuevo.
2. **`/frontend-design` para el overlay.** Antes de escribir `TouchControls`, invocar
   `/frontend-design` para definir **un único** estilo de botón (forma, tamaño, color, estado
   `:active`) que se reutiliza para todos los controles de los tres juegos, más la posición
   individual (`position`) de cada botón sobre cada canvas — sin diferenciar visualmente un botón
   de movimiento de uno de acción.
3. **`components/games/touch-controls.tsx`.** Componente `TouchControls({ buttons, onDown, onUp })`
   genérico: renderiza una lista plana de botones, cada uno anclado a su propia `position`, todos
   con la misma clase/estilo CSS. En `touchstart`/`touchend` (con `preventDefault`) llama a
   `onDown(code)`/`onUp(code)`. No conoce nada de motores ni de juegos concretos — solo códigos de
   tecla, posiciones y callbacks.
4. **Cableado en `components/games/game-canvas.tsx`.**
   - Si el runtime trae `touchControls`, montar `TouchControls` pasando
     `engine.handleKeyDown`/`engine.handleKeyUp` como `onDown`/`onUp` — los mismos métodos que ya
     usan los listeners de teclado.
   - Si `pointer: true`, agregar `touchstart`/`touchmove` al canvas (con `{ passive: false }` y
     `preventDefault`) que traducen `e.touches[0]` a coordenadas lógicas con el mismo `toLogical`
     que ya usan `mousemove`/`mousedown`, y llaman a `handlePointerMove`/`handlePointerDown`.
   - `touch-action: none` en el estilo inline del `<canvas>` para que arrastrar no dispare el
     scroll de la página.
5. **Estilos en `app/globals.css`.** El overlay de `TouchControls` se posiciona absoluto dentro de
   `.crt-screen` (mismo patrón que el overlay de pausa en
   `app/juegos/[id]/jugar/page.tsx:157-176`), y todo el bloque queda oculto por defecto y visible
   solo bajo `@media (pointer: coarse)`.
6. **Verificación manual con Playwright.** Emular un dispositivo táctil (`isMobile`/`hasTouch`) y
   confirmar en cada uno de los cuatro juegos:
   - Asteroides: los botones giran/impulsan la nave y el botón "DISPARAR" dispara.
   - Tetris: los botones mueven/hacen caída suave, rotan y hacen caída rápida.
   - Snake: los cuatro botones de dirección cambian el rumbo sin permitir revertir directamente
     sobre el cuerpo (la validación ya vive en el motor, no en el overlay).
   - Arkanoid: arrastrar el dedo sobre el canvas mueve la pala de punta a punta sin saltos.
   - En los cuatro: tocar los controles no hace scroll ni zoom de la página, y con emulación de
     mouse/desktop el overlay no aparece ni intercepta clics.
   - Confirmar que el teclado sigue funcionando sin cambios en los cuatro juegos (regresión).
     Guardar capturas en `.playwright-screenshots/`.
7. **`npx tsc --noEmit` y `npm run lint`** deben pasar sin errores nuevos respecto del baseline.

## Criterios de aceptación

- [x] `GameRuntime` expone `touchControls?: TouchButton[]`, y `asteroides`, `tetris` y `snake` lo
      declaran; `arkanoid` no.
- [x] En emulación de dispositivo táctil, `/juegos/asteroides/jugar` muestra cuatro botones
      (girar izquierda/derecha, impulso, "DISPARAR"); tocarlos mueve y dispara la nave.
- [x] En emulación táctil, `/juegos/tetris/jugar` muestra cinco botones (mover izquierda/derecha,
      caída suave, "GIRAR", "CAÍDA RÁPIDA"); tocarlos mueve, rota y hace caer la pieza.
- [x] En emulación táctil, `/juegos/snake/jugar` muestra cuatro botones de dirección que cambian
      el rumbo de la serpiente, respetando el bloqueo de reversa directa ya existente en el motor.
- [x] En cada uno de los tres juegos con `touchControls`, todos sus botones táctiles comparten
      exactamente el mismo estilo visual (misma forma, tamaño y tratamiento) — verificable por
      estilo computado, no solo a simple vista.
- [x] En emulación táctil, `/juegos/arkanoid/jugar` no muestra ningún overlay de botones; arrastrar
      el dedo sobre el canvas mueve la pala en tiempo real, igual que el mouse hoy.
- [x] En emulación de mouse/desktop (`pointer: fine`), ninguno de los cuatro juegos muestra el
      overlay de controles táctiles, y el DOM oculto no intercepta clics sobre el canvas.
- [x] Tocar cualquier control durante la partida no dispara scroll ni zoom de la página en ninguno
      de los cuatro juegos.
- [x] El teclado sigue controlando los cuatro juegos exactamente igual que antes de este spec
      (sin regresión).
- [x] Los ocho juegos decorativos y el resto de la plataforma (HUD, PAUSA/FIN/SALIR, selector de
      skin, home, Salón de la Fama) no cambian.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos respecto del baseline.

## Decisiones tomadas y descartadas

- **`touchControls` declarativo en `GAME_RUNTIMES`, no un componente a medida por juego** — sigue
  el mismo patrón que `capturedKeys` y evita reintroducir un caso especial por `game.id`, que
  CLAUDE.md prohíbe explícitamente para esta parte de la plataforma.
- **Los botones táctiles sintetizan `handleKeyDown`/`handleKeyUp`, no un método nuevo en
  `ArcadeEngine`** — significa que ningún motor concreto cambia una sola línea; el overlay es
  indistinguible del teclado desde el punto de vista del motor.
- **Visibilidad por CSS (`@media (pointer: coarse)`), no por detección en JavaScript** — evita el
  mismatch de hidratación de Next.js (el servidor no sabe si el cliente es táctil) sin necesidad de
  `suppressHydrationWarning` ni de un segundo render tras montar.
- **Un único estilo visual de botón para todo control, sin agrupación por función** — decidido por
  el usuario a partir de un mockup de referencia (botones ovalados idénticos, dispersos en
  posiciones individuales sobre el canvas). Simplifica `TouchControls` a un solo componente de
  botón reutilizado, con `position` propia por entrada, en vez de dos variantes visuales
  (movimiento vs. acción) agrupadas por zona.
- **Arkanoid usa arrastre táctil nativo, no botones** — ya tiene `pointer: true` y
  `handlePointerMove`; agregar botones sería menos natural para un juego de pala y reimplementaría
  peor lo que el arrastre ya resuelve.
- **Sin botón de lanzamiento en Arkanoid** — la bola se relanza sola tras perderla
  (`arkanoid/engine.ts:143-146`); no hay tecla de lanzamiento que replicar.
- **`KeyX` de Tetris no tiene botón propio** — es un alias que el motor ya trata igual que
  `ArrowUp` (`tetris/engine.ts:284`); un botón "GIRAR" cubre ambos casos sin duplicar UI.
- **Sin soporte explícito de multi-touch simultáneo** — cubrir mantener dos botones a la vez
  agregaría manejo de `Touch.identifier` por botón; se deja fuera de alcance porque ningún juego
  del Vault requiere dos entradas simultáneas para jugarse (a diferencia de, por ejemplo, un
  esquema de disparo + movimiento combinados en un solo gesto).
- **HUD y botones de partida (PAUSA/FIN/SALIR/skin) fuera de alcance** — son HTML estándar, no
  canvas, y no se reportó ningún problema concreto de uso en móvil; mezclar su rediseño con los
  controles de juego habría duplicado el trabajo de `/frontend-design` sin necesidad.

## Riesgos identificados

| Riesgo                                                                                                                                                                      | Mitigación                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un navegador móvil dispara eventos de mouse sintéticos además de los táctiles, duplicando `handlePointerDown` en Arkanoid                                                   | Se prueba explícitamente en el paso 6 con emulación táctil real de Playwright; si aparece duplicación, `preventDefault` en `touchstart` la evita            |
| El overlay táctil queda oculto por CSS pero sigue en el DOM y podría interceptar clics de mouse por z-index                                                                 | Verificado en el paso 6 con emulación de mouse: el overlay no debe capturar clics cuando está oculto (`display: none`, no solo `opacity: 0`)                |
| Al posicionarse individualmente (sin un layout tipo cruz ya resuelto), los botones táctiles pueden quedar muy pequeños, muy juntos, o mal ubicados sobre pantallas angostas | Las posiciones y el tamaño mínimo del área táctil se definen explícitamente en el paso 2 vía `/frontend-design`, no se improvisan durante la implementación |
| `touch-action: none` mal aplicado bloquea el scroll de toda la pantalla de Jugador, no solo del canvas                                                                      | Se aplica solo al `<canvas>` y a los botones de `TouchControls`, nunca a un contenedor padre como `.crt-screen` o `.av-player`                              |
