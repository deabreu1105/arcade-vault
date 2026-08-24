# Auditoría de skins — Arcade Vault

Memoria del agente `skin-designer` (`.claude/agents/skin-designer.md`). Cada invocación reconcilia
este archivo con `GAME_RUNTIMES` (`components/games/registry.ts`) y con `lib/skins.ts`, y después
registra la pasada nueva.

Estados: `Completo` (motor y cover leen la paleta, verificado) · `Parcial` (falta el cover o queda
algún literal suelto) · `Pendiente` (todavía con los colores hardcodeados).

Lo escribe el agente. Editalo a mano solo para cambiar un `Estado`.

El invariante que este archivo vigila: **todo juego con entrada en `GAME_RUNTIMES` se ve bien en
`clasico`, en `neon` y en `retro`**. Los ocho juegos decorativos quedan fuera de alcance por
decisión de SPEC 11: comparten la simulación `.game-arena` y no tienen motor propio.

---

## Estado al 2026-08-24

Leído de `GAME_RUNTIMES` y de `lib/skins.ts` en esta sesión, no de memoria.

| Juego        | Motor                        | Cover              | Contraste | Estado   |
| ------------ | ---------------------------- | ------------------ | --------- | -------- |
| `asteroides` | Lee paleta                   | `cover-asteroides` | 6.87:1    | Completo |
| `tetris`     | Lee paleta (`ramp`)          | `cover-tetris`     | 6.87:1    | Completo |
| `arkanoid`   | Pre-teñido (`spriteTint`)    | `cover-arkanoid`   | 6.87:1    | Completo |
| `snake`      | Lee paleta + pre-teñido      | `cover-snake-real` | 6.87:1    | Completo |

Los cuatro juegos de `GAME_RUNTIMES` están cerrados: el invariante de SPEC 11 se cumple hoy en
todo el catálogo real.

Notas de estado:

- El "contraste" de la tabla es el rol más flojo del skin más flojo, según `npm run skins:check`:
  `neon.accent` a 6.87:1 sobre `#05010d`. Es un número de la paleta, no del juego, así que sale
  igual para los cuatro; ningún motor agregó roles nuevos.
- `arkanoid` era el caso duro: no usa `fillStyle` salvo para el fondo, dibuja con `drawImage` desde
  `/games/arkanoid/spritesheet-breakout.png`. Se resolvió con pre-teñido, no con paleta.
- `snake` también trae un spritesheet, `/games/snake/fruits.png`, solo para la comida, y usa el
  mismo pre-teñido.
- `tetris` era el único con una paleta ya factorizada: `COLORS` en
  `components/games/tetris/engine.ts`, ocho entradas indexadas de 1 a 8. Mapea directo contra
  `SkinPalette.ramp`.
- `lib/skins.ts` no cambió en esta pasada: los diez roles que definió SPEC 11 alcanzaron para los
  tres juegos. No hizo falta ningún rol nuevo.

---

## Pasadas

### 2026-08-24 — ASTEROIDES

Primera pasada del sistema. Asteroides se eligió como referencia justamente por ser el motor más
difícil de los cuatro: si el patrón sobrevive acá, sobrevive en los otros tres.

- **Qué se cambió** — `components/games/asteroides/engine.ts` (los seis literales de color) y
  `.cover-asteroides` en `app/globals.css`.
- **Cómo se mapearon los roles**
  - `bg` → el fondo del canvas (era `#000`).
  - `primary` → la nave (era `#fff`).
  - `secondary` → los asteroides (era `#fff`) y las tres rocas del cover.
  - `accent` → el power-up de disparo triple (era `#0ff`).
  - `ink` → las balas y las partículas de explosión (eran `#fff` y blanco con alfa variable).
  - `thrust` → el fuego del propulsor (era `rgba(255, 130, 0, 0.85)`).
  - `grid` → el tinte de ambiente del cover (era `#001a2a`).
- **Decisiones**
  - _Las cinco clases sueltas reciben la paleta por parámetro._ `Bullet`, `Asteroid`, `PowerUp`,
    `Ship` y `Particle` solo veían `ctx`. Se cambió su firma a `draw(ctx, palette)` en vez de
    exponer un singleton de módulo, que habría hecho imposible tener dos canvas con skins
    distintos.
  - _La partícula usa `alpha()` de `lib/skins.ts`._ Su color lleva alfa variable por frame, y un
    hexadecimal plano no da eso. La variable local pasó a llamarse `fade` porque `alpha` ahora es
    el helper importado.
  - _Se agregó `applyGlow()`, que no hace nada salvo cuando `glow > 1`._ Asteroides es vectorial y
    nunca dibujó sombra; un halo incondicional le habría estrenado un brillo a `clasico`. Con
    `retro` (`glow: 0`) tampoco se pinta, que es lo correcto: retro es plano.
  - _El tinte de ambiente del cover es `--skin-grid`, no `--skin-secondary`._ Se probó primero con
    `secondary` y el violeta de `neon` a saturación plena inundó la tarjeta y se tragó las rocas.
    `grid` es el rol tenue y es el que corresponde.
  - _Las tres rocas del cover comparten `--skin-secondary` con fallbacks distintos._ En `clasico`
    conservan sus tres grises originales (`#7a8a90`, `#9aa8ac`, `#6c7a80`) y bajo un skin toman un
    tono único. Se pierde algo de profundidad en los skins, y se gana identidad exacta en
    `clasico`.
- **Hallazgo de plataforma** — al pintar un `bg` de skin apareció el borde del canvas como un
  rectángulo más claro: el canvas de 800×600 queda pillarboxed dentro de `.crt-screen`, y con
  `clasico` eso era invisible porque ambos fondos eran `#000`. Se corrigió haciendo que
  `.crt-screen` use `var(--skin-bg, #000)`. Vale para cualquier juego futuro que pinte su fondo.
- **Verificación**
  - `npm run skins:check` — pasa. Rol más flojo de `neon`: `accent` a 6.87:1 sobre `#05010d`. Rol
    más flojo de `retro`: `secondary` a 6.96:1 sobre `#0c0803`. Ambos por encima del umbral de 4:1.
  - `npx tsc --noEmit` — limpio.
  - `npm run lint` — 37 problemas, idéntico al baseline. Cero hallazgos nuevos.
  - Playwright — `clasico` verificado por estilo computado, no a ojo: `.cover-asteroides` resuelve a
    `rgb(0, 26, 42)`, `rgb(0, 245, 255)` y `rgb(122, 138, 144)`, que son exactamente `#001a2a`,
    `var(--cyan)` y `#7a8a90` del CSS original. Tras recargar con `neon` guardado, el píxel (5,5)
    del canvas es `rgb(5, 1, 13)` = `SKINS.neon.bg` ya en el primer frame, lo que prueba que la
    paleta llega antes de `engine.start()` pese al `import()` dinámico. Sin errores de hidratación.
    Capturas: `skins-01`…`skins-06` en `.playwright-screenshots/`.
- **Pendiente** — `tetris`, `arkanoid` y `snake`, más sus tres covers.

### 2026-08-24 — TETRIS

- **Qué se cambió** — `components/games/tetris/engine.ts` (los ocho colores de pieza más cinco
  literales sueltos) y `.cover-tetris` en `app/globals.css`.
- **Cómo se mapearon los roles**
  - `ramp` → las ocho piezas, vía `pieceColor(i)`, que lee `palette.ramp?.[i - 1]`. El corrimiento
    en uno es porque `COLORS` tiene un hueco en 0 y `ramp` no.
  - `bg` → el fondo del canvas (era `#0a0a12`).
  - `ink` → el brillo especular de cada bloque (era `rgba(255,255,255,0.12)`) y el rótulo "NEXT"
    (era `rgba(255,255,255,0.4)`).
  - `grid` → las tres líneas estructurales: la grilla del tablero (`0.05`), el marco de la vista
    previa (`0.15`) y el separador del panel (`0.08`).
  - Cover: `primary`/`secondary`/`accent` → los tres tonos del mosaico; `grid` → el tinte de
    ambiente; `primary` → el ícono `▮▮` y el halo del `drop-shadow`.
- **Decisiones**
  - _Los alfas se conservan y solo cambia el matiz._ Los cuatro literales blancos llevan
    `alpha(this.palette.<rol> ?? "#fff", <el alfa de siempre>)` en vez de tomar el color del rol
    tal cual. Así se mantiene la jerarquía entre las tres líneas — grilla más tenue que separador
    más tenue que marco — que se habría aplanado si las tres tomaran `grid` con su alfa propia.
    Con `clasico`, `alpha("#fff", 0.05)` devuelve `rgba(255, 255, 255, 0.05)`, idéntico al literal.
  - _El mosaico del cover usa tres roles y no `ramp`._ En CSS no hay token de `ramp`, y no se
    inventó uno: los tres tonos toman `primary`/`secondary`/`accent` conservando el orden de
    luminancia de hoy, así que el tono más brillante sigue compartiendo color con el ícono, tal
    como hoy comparten `var(--cyan)`. El costo es que en `retro` el tono más oscuro del mosaico
    (`accent`, `#fff0c2`) queda más claro que los otros dos; los tres siguen separándose.
  - _Se agregó `applyGlow()` en `drawCell()`, activo solo con `glow > 1`._ Tetris nunca dibujó
    sombra. Se midió el costo con el tablero cargado: la mediana de frame es 33.3 ms tanto en
    `neon` como en `clasico`, o sea la cadencia del navegador y no el halo. Se descartó extender el
    halo al brillo especular, que se dibuja con `shadowBlur` ya en cero.
- **Verificación** — `clasico` medido en el canvas, no a ojo: fondo `rgb(10, 10, 18)` = `#0a0a12` y
  piezas en `rgb(77, 208, 225)`, `rgb(255, 183, 77)`, `rgb(229, 115, 115)` y `rgb(144, 202, 249)`,
  que son exactamente `#4dd0e1`, `#ffb74d`, `#e57373` y `#90caf9` de `COLORS`. Cambiar a `neon` en
  mitad de la partida dejó el puntaje en 192 y el tablero intacto. Capturas `skins-11`…`skins-13`.
- **Pendiente** — nada.

### 2026-08-24 — ARKANOID

- **Qué se cambió** — `components/games/arkanoid/engine.ts` (fondo, pre-teñido de la hoja y halo de
  pala y bola) y `.cover-arkanoid` en `app/globals.css`.
- **Cómo se mapearon los roles**
  - `bg` → el fondo del canvas (era `#000`).
  - `spriteTint` → la hoja entera, `/games/arkanoid/spritesheet-breakout.png`: bloques, pala, bola
    y explosiones. Este motor no tiene colores propios que mapear.
  - `primary` → el halo de la pala y de la bola, lo único que el jugador controla.
  - Cover: `primary` → pala, bola y halo; `accent`, `secondary` e `ink` → los otros tres tonos de
    ladrillo; `grid` → el tinte de ambiente.
- **Decisiones**
  - _La hoja se tiñe una sola vez en un canvas fuera de pantalla._ `retint()` guarda el resultado
    en `tintedSheet` y lo cachea contra `tintKey`, así que un cambio de skin cuesta una pasada y
    cero por frame. Se llama desde `img.onload` y desde `setPalette()`, porque cualquiera de los
    dos puede llegar primero; se verificaron los dos caminos, el `onload` primero recargando con
    `retro` guardado y el `setPalette` primero cambiando de skin en mitad de la partida.
  - _Con `clasico`, `spriteTint` es `undefined` y `retint()` limpia el caché._ El motor dibuja la
    hoja original, sin canvas intermedio y sin ninguna diferencia de píxel.
  - _El halo va solo en la pala y en la bola, nunca en los bloques._ Son dos `drawImage` por frame
    contra hasta cien de bloques, y una sombra por bloque fuerza una superficie intermedia cada
    uno. Con `clasico` y con `retro` no se pinta nada, así que el motor no estrena brillo.
  - _Se revisó `sepia` en `retro` y se dejó como está._ La guía del agente advierte que `sepia`
    colapsa los siete tonos de bloque, pero `SKINS.retro.spriteTint` lo aplica al 55 % y combinado
    con `saturate(0.55)`. Medido sobre el nivel 1, las seis filas siguen leyéndose como seis tonos
    distintos — rosa apagado, crema, verde salvia, violeta pizarra, durazno y azul grisáceo — así
    que no se tocó `lib/skins.ts`. Si en algún nivel se ve colapsado, ese valor es el que hay que
    revisar, y no el pre-teñido.
- **Verificación** — `clasico` medido en el canvas: fondo `rgb(0, 0, 0)` y las tres primeras filas
  en `rgb(192, 42, 62)`, `rgb(217, 189, 76)` y `rgb(79, 201, 156)`, la hoja sin teñir. Con `retro`
  recargado de `localStorage`, el píxel (5,5) es `rgb(12, 8, 3)` = `SKINS.retro.bg` ya en el primer
  frame. Capturas `skins-14`…`skins-16`.
- **Pendiente** — nada.

### 2026-08-24 — SNAKE

- **Qué se cambió** — `components/games/snake/engine.ts` (cuatro literales, el multiplicador de
  brillo y el pre-teñido de la fruta) y `.cover-snake-real` en `app/globals.css`.
- **Cómo se mapearon los roles**
  - `primary` → la cabeza (era `#baffe3`), que es lo que el jugador controla.
  - `secondary` → el cuerpo (era `#00c46f`).
  - `bg` → el fondo del canvas (era `#04140c`).
  - `grid` → la grilla (era `rgba(0, 255, 136, 0.08)`).
  - `glow` → multiplica los `shadowBlur` de 6 y 10 que el motor ya tenía.
  - `spriteTint` → la hoja de frutas, `/games/snake/fruits.png`.
  - Cover: `primary` → cabeza y halo; `secondary` → los dos tonos de cuerpo; `accent` → la fruta;
    `grid` → las líneas; `bg` → el arranque del degradado de fondo.
  - `accent` es la fruta en el cover pero no en el canvas, donde la fruta es un sprite y su color
    lo fija `spriteTint`. Es la única asimetría entre cover y motor de esta pasada.
- **Decisiones**
  - _El pre-teñido es el mismo patrón que Arkanoid, copiado a propósito._ La hoja de frutas mide
    más de 3600 px de ancho y se dibuja una vez por frame, así que el costo de teñir por
    `drawImage` sería menor que en Arkanoid; se usó igual el canvas fuera de pantalla para que los
    dos motores se lean iguales y para no dejar dos formas de hacer lo mismo.
  - _El segundo tope del degradado del cover queda fijo en `#020805`._ Solo se tokenizó el primero,
    con `--skin-bg`. Bajo un skin el degradado va del fondo del skin a un casi negro, que es lo que
    la tarjeta necesita; tokenizar los dos lo habría aplanado a un color liso.
- **Verificación** — los tres skins medidos celda por celda sobre el mismo tablero en pausa.
  Cuerpo: `rgb(0, 196, 111)` en `clasico` = `#00c46f`, `rgb(201, 139, 255)` en `neon` =
  `SKINS.neon.secondary`, `rgb(209, 137, 42)` en `retro` = `SKINS.retro.secondary`. Cabeza:
  `rgb(186, 255, 227)` = `#baffe3`, `rgb(92, 251, 255)`, `rgb(255, 194, 71)`. Fruta, la misma
  naranja en las tres: `rgb(254, 138, 0)` sin teñir, `rgb(255, 143, 0)` con `neon` y
  `rgb(238, 173, 129)` con `retro` — prueba de que el pre-teñido llega también al sprite.
  Capturas `skins-17`…`skins-19`.
- **Pendiente** — nada.

### 2026-08-24 — Cierre de la pasada

- **Verificación conjunta**
  - `npm run skins:check` — pasa, sin cambios respecto del baseline: `neon.accent` a 6.87:1 y
    `retro.secondary` a 6.96:1, `ramp` de ocho en ambos, y 6 tokens `--skin-*` por bloque
    verificados contra `SKINS`.
  - `npx tsc --noEmit` — limpio.
  - `npm run lint` — 37 problemas (18 errores, 19 warnings), idéntico al baseline. Cero hallazgos
    nuevos.
  - Playwright — los tres covers en `clasico` resuelven exactamente a sus literales previos
    (`#003844`, `#0aa8c0`, `#0a5a6e`, `#2a0018`, `#0a0a12`, `#04180f`, `#020805`, `#00b869`,
    `#baffe3`, `#ff5a36` y los cuatro tokens globales), el chrome no cambia — `--cyan` sigue
    valiendo `#00f5ff` en los tres skins —, y cambiar de skin en mitad de la partida no reinicia ni
    pierde el puntaje. Sin errores de consola ni de hidratación; el único warning es el de
    `willReadFrequently`, que lo produce la propia sonda `getImageData` de la verificación.
- **Nota para la próxima pasada** — el `.cover-snake-real` en `retro` deja la fruta (`accent`,
  `#fff0c2`) muy cerca en luminancia de la cabeza (`primary`, `#ffc247`). Se leen distintas, pero
  es el par más flojo de los tres covers; si `retro` se retoca alguna vez, ese es el punto a mirar.
