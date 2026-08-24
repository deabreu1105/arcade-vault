# 11 — Sistema de skins: tres temas por juego, validados sobre el CRT

**Estado:** Implementado
**Depende de:** SPEC 06, SPEC 08, SPEC 09, SPEC 10
**Fecha:** 2026-08-24

**Objetivo:** Dar a cada juego real tres skins intercambiables en caliente — `clasico` (el look
actual, por defecto), `neon` y `retro` — sin regresión visual en `clasico` y con el contraste de
cada paleta verificado por script contra el fondo oscuro del CRT.

## Alcance

**Dentro:**

- `lib/skins.ts`: los tipos `SkinId` y `SkinPalette`, el mapa `SKINS`, y el helper `alpha()`.
- `components/skin-provider.tsx`: contexto de cliente que persiste el skin en `localStorage` y
  refleja la elección en `data-skin` sobre `<html>`.
- El gancho de paleta en `ArcadeEngine` (`components/games/engine-base.ts`): una propiedad
  `palette` protegida más `setPalette()`. La firma del constructor **no cambia**.
- El cableado en `components/games/game-canvas.tsx`, que aplica la paleta al motor tanto al
  cargarlo como cada vez que el skin cambia, sin remontar el motor ni reiniciar la partida.
- El selector de skin en la pantalla de juego.
- Asteroides migrado de punta a punta como referencia: `components/games/asteroides/engine.ts` y
  la clase `.cover-asteroides`.
- Los tokens `--skin-*` en `app/globals.css` y los bloques `[data-skin="neon"]` /
  `[data-skin="retro"]` que los redefinen.
- `scripts/check-skins.mjs` y el script `npm run skins:check`.

**Fuera (no en este spec):**

- Los motores de `tetris`, `arkanoid` y `snake`, y sus covers. Los cubre el agente `skin-designer`
  en una pasada posterior, usando Asteroides como plantilla.
- Los ocho juegos decorativos y la simulación `.game-arena`. Quedan en `clasico`.
- El chrome del sitio — navbar, botones, home, Salón de la Fama. Los tokens globales `--cyan`,
  `--magenta`, `--yellow` y `--green` no se tocan.
- Un modo claro. El sitio sigue siendo dark-only; "modo oscuro" aquí significa que cada paleta se
  valida contra el fondo oscuro sobre el que realmente se dibuja.
- Persistir la preferencia en Supabase. Vive solo en `localStorage`.

## Modelo de datos

Sin cambios de esquema. Ni `games`, ni `scores`, ni `profiles` se tocan, y no hay migración.

El skin es estado de cliente, no del catálogo:

- Clave de `localStorage`: `av_skin`, con valor `"clasico" | "neon" | "retro"`.
- Un valor desconocido o ausente cae a `clasico`.
- El atributo `data-skin` sobre `<html>` es el espejo en el DOM, y lo que los selectores CSS leen.

`SkinPalette` tiene **todos sus campos opcionales**. Esa es la decisión que hace imposible romper
`clasico`: cada motor lee `this.palette.<rol> ?? "<su literal de hoy>"`, y `SKINS.clasico` no
define ningún color, así que el resultado es idéntico byte a byte al código actual.

Roles, derivados de leer los cuatro motores en vez de inventarlos:

| Rol          | Qué pinta                                     | Ejemplo actual                           |
| ------------ | --------------------------------------------- | ---------------------------------------- |
| `bg`         | El fondo del canvas                           | `#000`, `#0a0a12`, `#04140c` según juego |
| `primary`    | Lo que controla el jugador                    | La nave (`asteroides/engine.ts:241`)     |
| `secondary`  | El obstáculo o campo principal                | Los asteroides (`:110`)                  |
| `accent`     | Objetivos y recolectables                     | El power-up (`:153`, `:158`)             |
| `ink`        | Detalles brillantes: balas, partículas, texto | Las balas (`:48`)                        |
| `grid`       | Líneas estructurales tenues                   | La grilla de Snake y de Tetris           |
| `thrust`     | El fuego del propulsor                        | `rgba(255,130,0,0.85)` (`:258`)          |
| `ramp`       | Ocho colores indexados                        | Las piezas de Tetris                     |
| `glow`       | Multiplicador de `shadowBlur`                 | `1` en `clasico`                         |
| `spriteTint` | Filtro CSS para teñir un spritesheet          | Arkanoid y la fruta de Snake             |

Dos precisiones que evitan errores concretos:

- `ramp` tiene **ocho** entradas. `components/games/tetris/engine.ts:20-30` indexa de 1 a 8 e
  incluye `#9e9e9e`, la tuerca. Con siete, `COLORS[8]` sería `undefined` y la pieza N se dibujaría
  con el color de la anterior.
- `glow` es un **multiplicador** de los `shadowBlur` que ya existen, no un valor absoluto.
  `components/games/snake/engine.ts:205,207` usa `6` y `10`; con `glow: 0` el brillo se apaga y con
  `glow: 1` queda exactamente como hoy.

`lib/skins.ts` se limita a sintaxis TypeScript borrable — uniones y `as const`, nunca `enum` ni
`namespace` — para que `node --experimental-strip-types` pueda importarlo desde el verificador sin
agregar dependencias. Node del entorno: v22.14.0.

## Plan de implementación

Cada paso deja el sistema funcionando y es commiteable por separado.

1. **`lib/skins.ts`.** Define `SkinId`, `SkinPalette` (todos los campos opcionales), `DEFAULT_SKIN`,
   `SKINS` con las tres entradas, y `alpha(color, a)`. `SKINS.clasico` solo fija `glow: 1`.
   Verificación: `npx tsc --noEmit` pasa y nada visual cambia, porque todavía nadie lo importa.

2. **El gancho en `ArcadeEngine`.** `components/games/engine-base.ts` gana
   `protected palette: SkinPalette = SKINS[DEFAULT_SKIN]` y `setPalette(p: SkinPalette)`. Es
   aditivo: el constructor sigue siendo `(ctx, callbacks)` y las subclases siguen implementando
   solo `init()`, `update(dt)` y `draw()`, tal como fija
   `.claude/skills/arcade-game/reference/contract.md`.

3. **`components/skin-provider.tsx` y `app/layout.tsx`.** El provider inicializa su estado con un
   _lazy initializer_ que lee `localStorage` durante el primer render — el mismo patrón que
   `components/auth-provider.tsx:31` ya usa con `readGuestUser`. Expone `useSkin()`. `layout.tsx`
   monta el provider, agrega `suppressHydrationWarning` al `<html>` y coloca en `<head>` un script
   inline que fija `data-skin` antes del primer paint, para que los covers no parpadeen.
   Antes de escribir este paso hay que leer la guía correspondiente en `node_modules/next/dist/docs/`:
   este proyecto fija Next.js 16 y AGENTS.md exige consultarla.

4. **El cableado en `components/games/game-canvas.tsx`.** Dos medidas, ambas necesarias, porque
   `loadEngine` es un `import()` dinámico y el motor resuelve después del primer render:
   - Un `skinRef` que siempre refleja el skin vigente, y una llamada a `engine.setPalette(...)`
     dentro del `.then()`, **antes** de `engine.start()`, para que el primer frame ya salga bien.
   - Un `useEffect` **separado**, con dependencia `[skin]`, que reaplica la paleta al vuelo. No se
     toca el `useEffect([])` que monta el motor; agregarle `skin` lo remontaría y reiniciaría la
     partida.

5. **Asteroides, el motor.** Es deliberadamente el más difícil de los cuatro, no el más fácil: sus
   cinco clases sueltas — `Bullet` (`:23`), `Asteroid` (`:59`), `PowerUp` (`:122`), `Ship` (`:168`)
   y `Particle` (`:266`) — reciben `ctx` pero no ven la paleta, así que cada `draw()` pasa a ser
   `draw(ctx, palette)`. Si el patrón sobrevive a Asteroides, sobrevive a los otros tres. Los seis
   literales que migran son `#000` (`:448`), `#fff` (`:48`, `:110`, `:241`), `#0ff` (`:153`,
   `:158`), `rgba(255,130,0,0.85)` (`:258`) y el blanco con alfa variable de las partículas
   (`:295`), este último vía `alpha()`.

6. **El selector de skin.** Un control en `hud-actions` de `app/juegos/[id]/jugar/page.tsx`. Es la
   única línea que esa pantalla necesita: ya hace `{...runtime}` sobre el canvas, y el canvas toma
   el skin del contexto por su cuenta, así que no aparece ningún caso especial por `game.id`.
   El diseño visual se hace con `/frontend-design`, como exige CLAUDE.md para toda UI nueva.

7. **Los tokens `--skin-*` y `.cover-asteroides`.** Se agregan los tokens al `:root` con los
   valores de hoy, y los bloques `[data-skin="neon"]` y `[data-skin="retro"]` que los redefinen.
   Solo los consumen los covers de juegos reales, así que el chrome del sitio no se entera.
   `.cover-asteroides` (`app/globals.css:802-826`, cinco `var()` y cinco hex) queda como plantilla
   de cover tokenizado.

8. **`scripts/check-skins.mjs` y `npm run skins:check`.** Corre con
   `node --experimental-strip-types`, importa `lib/skins.ts` de verdad y verifica tres cosas: que
   cada rol contraste al menos 4:1 contra el `bg` de su skin, que los bloques `[data-skin=...]` de
   `app/globals.css` no hayan derivado de `SKINS`, y que `ramp` tenga ocho entradas. `clasico`
   queda exento del umbral de contraste: es el statu quo, no una paleta nueva.

9. **Verificación.** `npx tsc --noEmit`, `npm run lint` y `npm run skins:check`, más una pasada con
   las herramientas MCP de Playwright sobre `/biblioteca` y `/juegos/asteroides/jugar` en los tres
   skins, guardando las capturas en `.playwright-screenshots/`.

## Criterios de aceptación

- [x] `lib/skins.ts` exporta `SkinId`, `SkinPalette`, `SKINS`, `DEFAULT_SKIN` y `alpha()`, y todos
      los campos de `SkinPalette` son opcionales.
- [x] `node --experimental-strip-types` puede importar `lib/skins.ts` sin transpilación previa.
- [x] `ArcadeEngine` expone `setPalette()` y el constructor sigue siendo `(ctx, callbacks)`.
- [x] La pantalla de juego ofrece los tres skins y arranca en `clasico`.
- [x] La elección sobrevive a una recarga y se aplica antes del primer paint, sin parpadeo del
      cover. Verificado además en el canvas: tras recargar con `neon` guardado, el píxel (5,5) es
      `rgb(5, 1, 13)` = `SKINS.neon.bg` ya en el primer frame, pese al `import()` dinámico del
      motor. Sin errores de hidratación en consola.
- [x] Cambiar de skin **durante** una partida repinta el canvas al frame siguiente sin reiniciarla,
      sin perder el puntaje y sin alterar la pausa.
- [x] Con `clasico`, `/juegos/asteroides/jugar` y la tarjeta de Asteroides en `/biblioteca` se ven
      idénticos a como se veían antes de este spec. Verificado por estilo computado y no a ojo:
      `.cover-asteroides` resuelve a `rgb(0, 26, 42)`, `rgb(0, 245, 255)` y `rgb(122, 138, 144)`,
      que son exactamente `#001a2a`, `var(--cyan)` y `#7a8a90` del CSS original.
- [x] Con `neon` y con `retro`, tanto el canvas de Asteroides como `.cover-asteroides` cambian de
      paleta de forma coherente entre sí.
- [x] Los ocho juegos decorativos y los otros tres reales conservan su propio dibujo sin cambios en
      cualquiera de los tres skins. Con `clasico` son idénticos byte a byte. Con `neon` y `retro`
      cambia únicamente el fondo de `.crt-screen` alrededor de su canvas, porque la pantalla sigue
      a `--skin-bg`; medido en Tetris, el borde queda entre `rgb(5, 1, 13)` y `rgb(10, 10, 18)`, una
      diferencia menor que la que ya existía contra el `#000` anterior, e imperceptible en pantalla.
      Se cierra cuando `skin-designer` migre cada motor.
- [x] El chrome del sitio — navbar, botones, home, Salón de la Fama — no cambia con el skin.
- [x] `npm run skins:check` pasa: contraste mínimo 4:1 en `neon` y `retro`, `ramp` de ocho, y
      ninguna deriva entre `app/globals.css` y `SKINS`.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos respecto del baseline (los 18
      errores de `references/` son preexistentes y no se tocan).

## Decisiones tomadas y descartadas

- **Todos los campos de `SkinPalette` son opcionales, con el literal actual como fallback** — en
  vez de una paleta completa y obligatoria. Hace que `clasico` sea pixel-idéntico por
  construcción y no por revisión visual. También evita un bug real: hoy hay cuatro fondos distintos
  (`#000` en Asteroides y Arkanoid, `#0a0a12` en Tetris, `#04140c` en Snake), y un `bg` único y
  obligatorio habría cambiado tres juegos en silencio.
- **La paleta entra por un setter, no por el constructor** — el contrato de la plataforma fija la
  firma `(ctx, callbacks)` y `GameCanvas` junto con el registro la asumen. Un tercer parámetro
  habría obligado a cambiar `GameRuntime.loadEngine` y las cuatro entradas de `GAME_RUNTIMES`.
- **Tokens `--skin-*` dedicados, en vez de sobreescribir `--cyan` y compañía** — hay 75 usos de
  `var(--cyan)` en el sitio; redefinirlo bajo `[data-skin]` habría repintado navbar, botones y
  home, que están fuera de la superficie que este spec cubre.
- **Los spritesheets se tiñen una sola vez en un canvas fuera de pantalla**, no con `ctx.filter`
  antes de cada `drawImage`. Arkanoid hace del orden de cincuenta a cien `drawImage` por frame y
  cada uno con filtro activo fuerza una superficie intermedia. El pre-teñido cuesta una pasada por
  cambio de skin y cero por frame. Aplica al spec del agente, no a este, pero la decisión se toma
  acá porque `spriteTint` se define acá. Nota para quien lo implemente: `hue-rotate` y `saturate`
  conservan distinguibles los siete tonos de bloque de Arkanoid; `sepia` los colapsa y el juego
  deja de leerse.
- **Asteroides como juego de referencia, no Snake.** Snake tiene cuatro literales y una sola clase;
  no probaría nada. Asteroides reparte el dibujo en cinco clases que no ven la paleta, que es
  justo el problema estructural que el patrón tiene que resolver.
- **El umbral de contraste es 4:1, no el 3:1 de WCAG 1.4.11.** `.crt-screen`
  (`app/globals.css:1126-1149`) superpone scanlines con `mix-blend-mode: multiply` y un viñeteo del
  65 %, así que el contraste que llega al ojo es menor que el que se calcula sobre el color plano.
- **Sin rol `danger`.** Ningún motor tiene un rojo de peligro; el rojo de Tetris vive dentro de
  `ramp`. En cambio el fuego del propulsor de Asteroides sí existía sin nombre, y es `thrust`.
- **`suppressHydrationWarning` va en `<html>` y también en `<body>`.** En `<html>` porque el script
  inline reescribe `data-skin` antes de que React hidrate, que es el mecanismo mismo. En `<body>`
  por una razón distinta: las extensiones del navegador le inyectan atributos propios — Grammarly
  agrega `data-gr-ext-installed` y `data-new-gr-c-s-check-loaded` — y React lo reporta como
  desajuste de hidratación aunque el código no tenga nada que ver. La bandera no cascadea de un
  elemento al otro, así que hacen falta las dos. Ninguno de los dos elementos renderiza atributos
  dinámicos propios, así que no hay un desajuste real que estas banderas puedan estar tapando.

- **Solo los cuatro juegos reales.** Los ocho decorativos comparten `.game-arena` y no tienen
  motor; darles skin habría significado tematizar una simulación que no es de nadie en particular.

## Riesgos identificados

| Riesgo                                                                                       | Mitigación                                                                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| El motor carga por `import()` dinámico y arranca antes de que el skin se resuelva            | El provider lee `localStorage` en un _lazy initializer_, y `GameCanvas` aplica la paleta dentro del `.then()` antes de `engine.start()` |
| Agregar `skin` a las dependencias del efecto que monta el motor lo remontaría en cada cambio | La reaplicación vive en un `useEffect` separado; el efecto de montaje conserva su arreglo vacío                                         |
| `data-skin` sobre `<html>` produce un desajuste de hidratación                               | `suppressHydrationWarning` en `<html>` más el script inline en `<head>`                                                                 |
| Tokenizar un cover cambia `clasico` de forma sutil y nadie lo nota                           | Captura de referencia antes de tocar nada, y comparación al final; los tokens del `:root` arrancan con los valores exactos de hoy       |
| `SKINS` en TypeScript y los bloques `[data-skin]` en CSS derivan con el tiempo               | `npm run skins:check` compara ambas fuentes y falla si no coinciden                                                                     |
