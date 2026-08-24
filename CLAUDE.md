# CLAUDE.md

Este archivo le da a Claude Code (claude.ai/code) instrucciones para trabajar en este repositorio.

@AGENTS.md

## Proyecto

Arcade Vault — una plataforma para jugar juegos arcade en línea y competir por el puntaje más alto.
Next.js 16 (App Router) + TypeScript + Tailwind v4 + ESLint 9 + Prettier, con Supabase (auth,
Postgres) y Resend (email de contacto). Cuatro juegos son reales y jugables (Asteroides, Tetris,
Arkanoid, Snake); cualquier otra fila del catálogo sigue mostrando la simulación decorativa.

Este proyecto sigue Spec Driven Design. Cada funcionalidad empieza como un spec numerado en
`specs/` (en español, con estados `Borrador` → `Aprobado` → `Implementado`), se aprueba, y solo
entonces se implementa. Los specs 01–10 están todos `Implementado`; lee los dos más recientes antes
de escribir uno nuevo.

## Comandos

- `npm run dev` — servidor de desarrollo (Turbopack, el predeterminado de Next.js 16)
- `npm run build` / `npm run start` — build de producción / ejecutarlo
- `npm run lint` — ESLint (config plana en `eslint.config.mjs`, extiende `eslint-config-next`)
- `npm run format` / `npm run format:check` — Prettier sobre el repo (respeta `.prettierignore`,
  que excluye `.agents/`, `references/`, etc.)
- `npx tsc --noEmit` — chequeo de tipos
- `npm run skins:check` — verifica las paletas de `lib/skins.ts`: contraste de cada rol contra
  el fondo de su skin, largo del `ramp`, y que los bloques `[data-skin]` de `app/globals.css` no
  hayan derivado. Corre con `node --experimental-strip-types`, sin dependencias nuevas.

No hay test runner configurado. La verificación es `tsc --noEmit` + `npm run lint` + una pasada
manual con las herramientas MCP de Playwright.

## Agentes, skills y comandos

- `game-planner` (`.claude/agents/game-planner.md`) — subagente que decide **cuál** juego debería
  construirse a continuación, y por qué. Invócalo explícitamente ("usa el game-planner"). Lee el
  catálogo, puntúa candidatos contra el contrato de la plataforma, mantiene su historial en
  `references/game-proposals.md` para nunca volver a proponer lo que ya fue descartado, y se
  detiene en una recomendación — no escribe spec ni código. Su salida es la entrada de
  `/arcade-game`.
- `game-jam` (`.claude/agents/game-jam.md`) — subagente que convierte **un tema** en un juego
  especificado. Invócalo explícitamente con un tema ("usa el game-jam con el tema «el fondo del
  mar»"). Elige una mecánica que encaje con el tema sin reskinear un motor existente, verifica el
  catálogo para que el `id`/`color`/`cover` que elige estén realmente libres, y escribe
  `specs/game-jam/<game-id>/` con un `README.md` más al menos dos specs en `Borrador` —
  `01-<id>-catalogo-y-cover.md` (fila en `games`, cover CSS, `GAME_COVERS`) y `02-<id>-motor.md`
  (motor, `GAME_RUNTIMES`, verificación). La división sigue la costura propia de la plataforma: el
  spec 01 deja el juego visible con la simulación decorativa, el spec 02 lo activa como real. No
  aplica ninguna migración ni escribe código, así que revisa los specs antes de correr
  `/arcade-game`.
- `skin-designer` (`.claude/agents/skin-designer.md`) — subagente que mantiene el invariante de
  que **todo juego real tenga los tres skins** (`clasico`, `neon`, `retro`) legibles sobre el CRT
  oscuro. Invócalo explícitamente ("usa el skin-designer"). Audita cada motor de `GAME_RUNTIMES`
  buscando literales de color sueltos, diseña e implementa las paletas que falten, verifica con
  `npm run skins:check` más Playwright, y mantiene su historial en `references/skin-audit.md`. No
  agrega juegos ni aplica migraciones; extiende el sistema que fundó `specs/11-sistema-de-skins.md`.
- `/frontend-design` — **siempre** úsalo para crear o rediseñar interfaces de usuario.
- `/arcade-game <nombre|carpeta>` — agrega un nuevo juego real jugable de punta a punta (spec →
  migración → cover → motor → registro → verificación). Úsalo en vez de armar un juego a mano;
  encapsula todo el contrato de la plataforma. Vive en `.claude/skills/arcade-game/` con
  `reference/contract.md` (lo que no debe cambiar), `reference/porting.md` (cómo portar un juego en
  JS vanilla) y `template.md` (la forma del spec que usa este tipo de funcionalidad, derivada de
  `specs/06-asteroides-juego-real.md`).
- `/spec` y `/spec-impl` — planifica un spec primero, y luego implementa contra él.
- `/format` (un slash command, `.claude/commands/format.md`) — corre Prettier sobre el repo más
  `eslint --fix` sobre `app components lib hooks demos`.

Solo `arcade-game` está escrito para este repo. `spec`, `spec-impl`, `frontend-design` y `caveman`
son skills de terceros instalados con `npx skills@latest add <repo>` (`Klerith/fernando-skills`,
`anthropics/skills`, `juliusbrussee/caveman`), vendorizados bajo `.agents/skills/` y enlazados
simbólicamente en `.claude/skills/`; `skills-lock.json` los fija. Actualízalos a través del CLI,
nunca editando las copias vendorizadas.

Un hook `PostToolUse` (`.claude/hooks/format-and-lint.sh`, conectado en `.claude/settings.json`) ya
formatea cada archivo que escribas/edites con Prettier y aplica `eslint --fix` a JS/TS. Los errores
de ESLint que no se pueden autocorregir vuelven como un error del hook — corrígelos, no reformatees
a mano.

## Servidores MCP

- **supabase** — el servidor HTTP hospedado declarado en `.mcp.json` (proyecto
  `rcsimffriebjuypildqz`). Los cambios de esquema van por `mcp__supabase__apply_migration`, las
  lecturas ad-hoc por `execute_sql`. No hay stack local de Supabase ni carpeta
  `supabase/migrations/`; las migraciones se aplican directo al proyecto remoto, así que trata cada
  una como producción.
- **playwright** — configurado fuera del repo (a nivel de usuario, no en `.mcp.json`), usado para
  la verificación manual de las pantallas de juego. Guarda todas las capturas en
  `.playwright-screenshots/` (ignorado por git).

## Entorno

Copia `.env.template` a `.env.local`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
`SUPABASE_DB_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Arquitectura

### Rutas (`app/`)

`/` inicio · `/acerca-de` acerca de + formulario de contacto (envía a
`app/api/contact/route.ts`, que manda por Resend) · `/biblioteca` catálogo · `/juegos/[id]`
detalle · `/juegos/[id]/jugar` pantalla de juego · `/salon-de-la-fama` tablas de puntajes ·
`/login` autenticación · `/admin/juegos` CRUD de administración sobre `games` (protegido por
`profiles.is_admin`). Lee `references/implemented-games.md` cuando necesites saber qué juegos
existen hoy y cómo se agrega uno nuevo.

El alias de ruta `@/*` mapea a la raíz del repo. El estilo es Tailwind CSS v4 vía
`@tailwindcss/postcss`, más una hoja de estilos CRT/arcade grande y escrita a mano en
`app/globals.css` (covers de juegos, `.crt-screen`, `.game-arena`).

### Supabase

- `lib/supabase/{client,server,middleware}.ts` — clientes de `@supabase/ssr`. El refresco de
  sesión corre en `proxy.ts` en la raíz del repo (Next.js 16 renombró `middleware.ts` →
  `proxy.ts`), que delega en `updateSession`.
- `lib/supabase/queries.ts` — cada lectura/escritura, genérica por `gameId`. Tablas: `games`,
  `scores`, `profiles` (`username`, `is_admin`).
- La autenticación es email + contraseña con un `username` en los metadatos del usuario; el modo
  invitado sigue funcionando y guarda puntajes bajo un nombre de invitado.
  `components/auth-provider.tsx` expone la sesión del lado del cliente.

### Plataforma de juegos (`components/games/`)

Las piezas de abajo son genéricas — un juego nuevo solo toca las dos últimas:

- `engine-base.ts` — `ArcadeEngine`, la clase base abstracta que extiende cada motor. Es dueña del
  loop de `requestAnimationFrame`, el clamping de `dt`, pausa/reanudación sin salto de tiempo, y
  los callbacks `onScoreChange` / `onLivesChange` / `onLevelChange` / `onGameOver`. Los motores
  concretos implementan `init()`, `update(dt)`, `draw()`.
- `game-canvas.tsx` — `GameCanvas`, el `<canvas>` genérico. Instancia el motor, captura entrada de
  teclado (y de puntero, opcional) con `preventDefault`, hace letterbox de cualquier relación de
  aspecto dentro de `.crt-screen`, y expone `pause`/`resume`/`restart`/`forceGameOver` a través de
  una ref.
- `registry.ts` — `GAME_RUNTIMES: Record<gameId, GameRuntime>` (tamaño del canvas,
  `capturedKeys`, `pointer` opcional, un `loadEngine` dinámico, y una vía de escape `Component`
  para juegos que necesitan DOM extra). **Esto es lo único que lee
  `app/juegos/[id]/jugar/page.tsx` para decidir entre el motor real y la simulación decorativa** —
  la página nunca hace un caso especial para un id de juego.
- `skins` — `lib/skins.ts` define `SKINS` (`clasico` por defecto, `neon`, `retro`) y el tipo
  `SkinPalette`, cuyos campos son **todos opcionales**: cada motor lee
  `this.palette.<rol> ?? "<su literal de siempre>"`, así que `clasico` queda idéntico al código
  original por construcción. `ArcadeEngine` expone `setPalette()` sin cambiar su firma de
  constructor, y `GameCanvas` la reaplica en caliente sin reiniciar la partida.
  `components/skin-provider.tsx` persiste la elección en `localStorage` y la refleja en
  `data-skin` sobre `<html>`; los covers la consumen con `var(--skin-<rol>, <literal>)`. Los
  tokens globales `--cyan`/`--magenta`/`--yellow`/`--green` **no** se tocan: el skin llega al
  canvas y al cover, no al chrome del sitio.
- `<id>/engine.ts` — una carpeta por cada juego real: `asteroides`, `tetris`, `arkanoid`,
  `snake`.

Agregar una fila a `games` hace que aparezca en Biblioteca, Detalle, Jugador y Salón de la Fama sin
ningún cambio de código. `lib/supabase/queries.ts`, `app/juegos/[id]/jugar/actions.ts`,
`app/biblioteca/**`, `app/juegos/[id]/page.tsx` y `app/salon-de-la-fama/**` ya son genéricos — no
los toques para un juego nuevo. El cover de un juego es una clase `.cover-<id>` en
`app/globals.css` **y** una entrada en `GAME_COVERS` (`lib/data.ts`); si te saltas el array, el
panel de administración rechaza el cover.

### Material de referencia (`references/`, no forma parte del build)

`templates/` — los diseños originales en JSX/HTML de los que se portó cada pantalla.
`started-games/` — juegos en JS vanilla disponibles para portar (`/arcade-game` los lee); los tres
ya están portados. `source-assets/` — sprites. `implemented-games.md` — el catálogo actual, juego
por juego. `game-proposals.md` — la memoria de `game-planner` de lo que se ha propuesto,
recomendado y descartado. ESLint/Prettier ignoran este árbol; tiene errores conocidos y no debe
lintearse ni "arreglarse".

### Versión de Next.js

Antes de escribir cualquier código de Next.js, lee la guía correspondiente bajo
`node_modules/next/dist/docs/` — este proyecto fija una versión de Next.js con cambios que rompen
compatibilidad y convenciones que difieren de los datos de entrenamiento típicos (ver AGENTS.md).
