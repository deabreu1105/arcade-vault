# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing arcade games online and competing for the highest score.
Next.js 16 (App Router) + TypeScript + Tailwind v4 + ESLint 9 + Prettier, with Supabase (auth,
Postgres) and Resend (contact email). Four games are real and playable (Asteroides, Tetris,
Arkanoid, Snake); any other catalog row still renders the decorative simulation.

This project follows Spec Driven Design. Every feature starts as a numbered spec in `specs/`
(Spanish, states `Borrador` → `Aprobado` → `Implementado`), gets approved, and only then is
implemented. Specs 01–10 are all `Implementado`; read the two most recent before writing a new one.

## Commands

- `npm run dev` — dev server (Turbopack, per Next.js 16 default)
- `npm run build` / `npm run start` — production build / run it
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)
- `npm run format` / `npm run format:check` — Prettier over the repo (respects `.prettierignore`,
  which excludes `.agents/`, `references/`, etc.)
- `npx tsc --noEmit` — typecheck

No test runner is configured. Verification is `tsc --noEmit` + `npm run lint` + a manual pass with
the Playwright MCP tools.

## Skills and commands

- `/frontend-design` — **always** use it to create or reshape user interfaces.
- `/arcade-game <name|folder>` — adds a new real playable game end to end (spec → migration →
  cover → engine → registry → verification). Use this instead of hand-rolling a game; it encodes
  the whole platform contract. Lives in `.claude/skills/arcade-game/` with `reference/contract.md`
  (what must not change) and `reference/porting.md` (how to port a vanilla-JS game).
- `/spec` and `/spec-impl` (from https://github.com/Klerith/fernando-skills, installed via
  `npx skills@latest add Klerith/fernando-skills`, vendored in `.agents/skills/`) — plan a spec
  first, then implement against it.
- `/format` — runs Prettier over the repo plus `eslint --fix` over `app components lib hooks demos`.

A `PostToolUse` hook (`.claude/hooks/format-and-lint.sh`, wired in `.claude/settings.json`) already
formats every file you Write/Edit with Prettier and applies `eslint --fix` to JS/TS. Non-autofixable
ESLint errors come back as a hook error — fix them, don't reformat by hand.

## MCP servers

- **supabase** (`.mcp.json`, project `rcsimffriebjuypildqz`) — schema changes go through
  `mcp__supabase__apply_migration`, ad-hoc reads through `execute_sql`. There is no local Supabase
  stack; migrations apply to the remote project.
- **playwright** — manual verification of game screens. Save all screenshots in
  `.playwright-screenshots/`.

## Environment

Copy `.env.template` to `.env.local`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `SUPABASE_DB_PASSWORD`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Architecture

### Routes (`app/`)

`/` home · `/acerca-de` about + contact form (posts to `app/api/contact/route.ts`, sends via
Resend) · `/biblioteca` catalog · `/juegos/[id]` detail · `/juegos/[id]/jugar` player screen ·
`/salon-de-la-fama` leaderboards · `/login` auth · `/admin/juegos` admin CRUD over `games`
(gated by `profiles.is_admin`). (see `references/implemented-games.md`) when you need to check 
which games are impelemted and how to implement new one.

Path alias `@/*` maps to the repo root. Styling is Tailwind CSS v4 via `@tailwindcss/postcss`,
plus a large hand-written CRT/arcade stylesheet in `app/globals.css` (game covers, `.crt-screen`,
`.game-arena`).

### Supabase

- `lib/supabase/{client,server,middleware}.ts` — `@supabase/ssr` clients. Session refresh runs in
  `proxy.ts` at the repo root (Next.js 16 renamed `middleware.ts` → `proxy.ts`), which delegates to
  `updateSession`.
- `lib/supabase/queries.ts` — every read/write, generic by `gameId`. Tables: `games`, `scores`,
  `profiles` (`username`, `is_admin`).
- Auth is email + password with a `username` in user metadata; guest mode still works and saves
  scores under a guest name. `components/auth-provider.tsx` exposes the session client-side.

### Games platform (`components/games/`)

The pieces below are generic — a new game touches only the last two:

- `engine-base.ts` — `ArcadeEngine`, the abstract base every motor extends. Owns the
  `requestAnimationFrame` loop, `dt` clamping, pause/resume without a time jump, and the callbacks
  `onScoreChange` / `onLivesChange` / `onLevelChange` / `onGameOver`. Concrete engines implement
  `init()`, `update(dt)`, `draw()`.
- `game-canvas.tsx` — `GameCanvas`, the generic `<canvas>`. Instantiates the engine, captures
  keyboard (and optional pointer) input with `preventDefault`, letterboxes any aspect ratio inside
  `.crt-screen`, and exposes `pause`/`resume`/`restart`/`forceGameOver` through a ref.
- `registry.ts` — `GAME_RUNTIMES: Record<gameId, GameRuntime>` (canvas size, `capturedKeys`,
  optional `pointer`, a dynamic `loadEngine`, and a `Component` escape hatch for games needing extra
  DOM). **This is the only thing `app/juegos/[id]/jugar/page.tsx` reads to decide between the real
  engine and the decorative simulation** — the page never special-cases a game id.
- `<id>/engine.ts` — one folder per real game: `asteroides`, `tetris`, `arkanoid`, `snake`.

Adding a row to `games` makes it appear in Biblioteca, Detalle, Jugador and Salón de la Fama with
no code change. `lib/supabase/queries.ts`, `app/juegos/[id]/jugar/actions.ts`, `app/biblioteca/**`,
`app/juegos/[id]/page.tsx` and `app/salon-de-la-fama/**` are already generic — do not touch them for
a new game. A game's cover is a `.cover-<id>` class in `app/globals.css` **and** an entry in
`GAME_COVERS` (`lib/data.ts`); skipping the array makes the admin panel reject the cover.

### Reference material (`references/`, not part of the build)

`templates/` — the original JSX/HTML designs each screen was ported from. `started-games/` —
vanilla-JS games available to port (`/arcade-game` reads these). `source-assets/` — sprites.
ESLint/Prettier ignore this tree; it has known errors and must not be linted or "fixed".

### Next.js version

Before writing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` —
this project pins a Next.js version with breaking changes and conventions that differ from typical
training data (see AGENTS.md).
