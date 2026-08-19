---
name: arcade-game
description: Creates a real playable game in Arcade Vault — ports or writes the engine, registers it in `games` with its leaderboard, and wires it into the Player screen. Writes the spec first and asks for approval before touching code.
disable-model-invocation: true
argument-hint: "<game name, or a folder under references/started-games/>"
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Skill, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(npm run lint:*), Bash(npx eslint:*), Bash(npx tsc:*), mcp__supabase__apply_migration, mcp__supabase__execute_sql, mcp__supabase__list_tables
---

# /arcade-game — add a real playable game with its own leaderboard

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist yet"`

Unstarted reference games available to port:
!`ls references/started-games/ 2>/dev/null || echo "No references/started-games/ folder"`

Games already registered in the runtime (real motor, not the decorative simulation):
!`grep -oE '^\s*[a-z0-9-]+:\s*\{' components/games/registry.ts 2>/dev/null || echo "components/games/registry.ts not found — read it manually before continuing"`

---

## What this skill does

Arcade Vault (see `CLAUDE.md`) already has one real, playable game (Asteroides), built by
specs `05-supabase-games-scores.md` and `06-asteroides-juego-real.md`, plus a follow-up refactor
that generalized the one-off Asteroides plumbing into a small platform:

- `components/games/engine-base.ts` — `ArcadeEngine`, the abstract base every real motor extends.
  It owns the `requestAnimationFrame` loop, `dt` clamping, pause/resume without a time jump, and
  the callback plumbing (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`).
- `components/games/game-canvas.tsx` — `GameCanvas`, the generic `<canvas>` component. It
  instantiates the engine, captures keyboard (and optionally mouse) input with `preventDefault`,
  and exposes `pause`/`resume`/`restart`/`forceGameOver` via a ref for the Player screen's existing
  buttons. It letterboxes any aspect ratio inside `.crt-screen`.
- `components/games/registry.ts` — `GAME_RUNTIMES`, a `Record<gameId, GameRuntime>`. A game with an
  entry here plays for real in `app/juegos/[id]/jugar/page.tsx`; a game without one still shows the
  decorative `.game-arena` simulation. **This is the only place `jugar/page.tsx` reads to decide
  which one to render** — the page itself never special-cases a game id.
- `lib/supabase/queries.ts`, `app/juegos/[id]/jugar/actions.ts` — already generic by `gameId`.
  Adding a game to `games` makes it appear, fully working, in Biblioteca, Detalle, Jugador and
  Salón de la Fama. **None of these files should ever need to change for a new game.**

This skill's job is to repeat that shape for a new game without re-deriving it: ask what the game
is, write a spec that matches specs 05/06's format, get it approved, then implement it end to end
(migration → cover → engine → registry entry → verification).

Load `.claude/skills/spec/SKILL.md` and `.claude/skills/spec/template.md` only in Phase 3, right
before writing the spec file — this skill's own `template.md` is a variant of that base template,
and following the base one keeps this spec consistent with every other spec in `specs/`.

Load `reference/contract.md` and `reference/porting.md` (in this skill's directory) only in
Phase 4, when you're about to write code — not before. They're detailed reference material, not
something to read up front.

Before writing any Next.js code, follow `AGENTS.md`: read the relevant guide under
`node_modules/next/dist/docs/` first, this project's Next.js version has breaking changes.

Your replies must be in the same language the user wrote `$ARGUMENTS` in (or, if empty, the
language of their first message to this skill). The spec file itself follows this repo's
convention: Spanish, matching `specs/05-*.md` and `specs/06-*.md`.

---

## Phase 1 — Identify the source

The received argument is: `$ARGUMENTS`

- If it names (or clearly matches, case-insensitively, ignoring a leading number) a folder under
  `references/started-games/` (see the listing above), this is a **port**: read that folder's
  `index.html`, `game.js`, `README.md`, and any sibling modules or `assets/` fully. Build a short
  technical brief from what you read: canvas size, controls, where the HUD lives (canvas / DOM),
  how a game ends, extra modules (`levels.js`, a spritesheet), audio, and any pause key the
  original has. You'll need this brief for Phase 2's questions and Phase 4's port.
- Otherwise, this is a **from-scratch game**: there's no reference to read, and Phase 2's questions
  must additionally cover the core mechanic, since there's no `game.js` to derive it from.
- If `$ARGUMENTS` is empty, ask the user which game (from `references/started-games/` or a new
  idea) before continuing.

## Phase 2 — Questions

Use `AskUserQuestion`, proposing sensible defaults drawn from the brief when this is a port.
Cover, at minimum:

1. **Identity**: `id` (must satisfy `/^[a-z0-9]+(-[a-z0-9]+)*$/` — the same rule
   `app/admin/juegos/actions.ts` enforces for the admin panel), `title` (uppercase, matching
   `"ASTEROIDES"`'s style), `short` and `long` descriptions.
2. **Catalog fields**: `cat` — one of `GAME_CATEGORIES` (`lib/data.ts`: `ARCADE`, `PUZZLE`,
   `SHOOTER`, `VERSUS`) — and `color` — one of `GAME_COLORS` (`cyan`, `magenta`, `yellow`,
   `green`).
3. **HUD semantics**: the Player screen always shows Jugador/Puntuación/Vidas/Nivel. What do
   "Vidas" and "Nivel" mean for this game? If the game has no concept of lives (e.g. a puzzle game
   with a single run), decide what `onLivesChange` should emit (a constant, or remaining
   attempts/pieces — whatever reads sensibly on the HUD).
4. **Controls**: which key codes to capture with `preventDefault` (so playing never scrolls the
   page), and whether the game needs mouse/pointer input.
5. **Assets**: any images or audio to bring over. If yes, they go in `public/games/<id>/`.
6. **Extra panels** (only relevant for a port with a second on-screen panel, e.g. a "next piece"
   preview): draw them inside the main canvas, or use the registry's `Component` escape hatch —
   see `reference/contract.md`.

## Phase 3 — Write the spec

Before drafting anything, **read `.claude/skills/spec/SKILL.md` and
`.claude/skills/spec/template.md` in full** — that's the skill and template this project's whole
spec-driven workflow is built on, and every spec in `specs/` (including 05 and 06) follows it. Then
read this skill's own `template.md` (`.claude/skills/arcade-game/template.md`), which is a variant
of the base template specialized for "add a real game." Use both together: the base
template is the authority on structure, tone, and the global rules (one idea per sentence, concrete
names, no long code, no TODOs); this skill's template shows how those sections look once filled in
for a game spec specifically.

Also skim at least `specs/06-asteroides-juego-real.md` (already read in the session context's
listing) to match this repo's concrete conventions — wording, heading style, and level of detail —
the same way `/spec` asks you to read the two most recent specs before writing a new one.

Write `specs/NN-<id>-juego-real.md` (next number after the highest one in the `specs/` listing
above) **in Spanish**, following the exact section structure of `specs/06-asteroides-juego-real.md`:
header block (`Estado`/`Depende de`/`Fecha`/`Objetivo`), `## Alcance` with **Dentro** / **Fuera**,
`## Modelo de datos` (include the literal `insert into games (...) values (...)` statement),
`## Plan de implementación` as numbered, independently-committable steps, `## Criterios de
aceptación` as a boolean checklist, `## Decisiones tomadas y descartadas`, and `## Riesgos
identificados`.

The spec starts as `Borrador`. Show it to the user and ask them to approve it (change the state to
`Aprobado`) before continuing — do not implement anything in Phase 4 until they do. This mirrors
`/spec` → `/spec-impl` without re-running those skills verbatim.

## Phase 4 — Implement

Once the spec is `Aprobado`, read `reference/contract.md` and `reference/porting.md`, then execute
the spec's own implementation plan. In broad strokes, each of these is its own committable step:

1. **Migration**: `mcp__supabase__apply_migration` (name it `add_game_<id>`) with the literal
   `insert into games` from the spec. Verify with `mcp__supabase__execute_sql` or by checking
   `/biblioteca` that the row exists.
2. **Cover**: invoke `/frontend-design` (required by `CLAUDE.md` for any new UI) to design a
   `.cover-<id>` class in `app/globals.css`, following the `.cover-asteroides` pattern (base
   background + `::after` for shapes + `::before` for a glyph). Then add `"cover-<id>"` to the
   `GAME_COVERS` array in `lib/data.ts` — **skip this and the admin panel will reject the cover as
   invalid**, since `createGameAction`/`updateGameAction` validate against that array.
3. **Assets** (if any): copy to `public/games/<id>/`, referenced by absolute path.
4. **Engine**: `components/games/<id>/engine.ts`, a class extending `ArcadeEngine`. Use
   `reference/porting.md` if this is a port.
5. **Registry entry**: add `<id>` to `GAME_RUNTIMES` in `components/games/registry.ts`.
6. **Verify**: `npx tsc --noEmit`, `npm run lint` (or `npx eslint app components lib`), then a
   manual pass with the Playwright MCP tools — load `/juegos/<id>/jugar`, exercise every control,
   pause/resume, force game over, save a score both as a real user and as guest, restart. Save
   screenshots under `.playwright-screenshots/` per `CLAUDE.md`.
7. **Close out**: check off the spec's acceptance criteria and set its state to `Implementado`.

**Do not touch** `lib/supabase/queries.ts`, `app/juegos/[id]/jugar/actions.ts`,
`app/biblioteca/**`, `app/juegos/[id]/page.tsx`, or `app/salon-de-la-fama/**` — see
`reference/contract.md` for why they're already generic.

If something in the spec turns out to be ambiguous once you're implementing, stop and ask — don't
improvise past what was approved, same rule `/spec-impl` follows.
