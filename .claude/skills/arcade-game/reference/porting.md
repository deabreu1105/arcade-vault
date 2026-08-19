# Porting a `references/started-games/*/game.js` to an `ArcadeEngine`

This is a translation table from the standalone-HTML shape every reference game uses to the
`ArcadeEngine` shape the platform expects. It's derived from the Asteroides port (specs 05/06) plus
a read-through of `03-tetris` and `04-arkanoid`, which exercise cases Asteroides didn't.

The references are `index.html` + `game.js` (+ sometimes `style.css`, `levels.js`,
`assets/spritesheet.js`, `assets/`) running as a standalone page with its own `<canvas>`, its own
`requestAnimationFrame` loop, and its own HUD. None of that standalone machinery survives the port
— only the simulation (entities, physics, rules) does.

| In the reference `game.js`                                                                                            | Do this in the port                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `const canvas = document.getElementById(...)`, `const ctx = canvas.getContext("2d")` at module scope                  | Receive `ctx` through the `ArcadeEngine` constructor. Never touch the DOM from the engine.                                                                                                                                                                                                                                                 |
| `const W = 800, H = 600` (or similar) at module scope                                                                 | Export `WIDTH`/`HEIGHT` (or reuse the constructor's implicit resolution) and set the _same_ numbers as `width`/`height` in the game's `GAME_RUNTIMES` entry — they must match the canvas attributes.                                                                                                                                       |
| `let score, lives, level;` at module scope, mutated directly                                                          | Don't add your own score/lives/level fields — `ArcadeEngine` already has `this.score`/`this.lives`/`this.level` (protected). Call `this.addScore(n)`, `this.setLives(n)`, `this.setLevel(n)` instead of assigning directly, so the HUD callbacks fire.                                                                                     |
| `function drawHUD() { ctx.fillText("Score: " + score, ...) }` or `document.getElementById("score").textContent = ...` | Delete entirely. React's HUD (Jugador/Puntuación/Vidas/Nivel) is the only HUD; a second one drawn in canvas or in a side DOM panel is duplicate, stale information.                                                                                                                                                                        |
| `function drawOverlay("GAME OVER")` + restart bound to `Space`/a button in the page                                   | Delete. The existing "FIN DEL JUEGO" modal and its `JUGAR DE NUEVO` button already do this — call `this.gameOver()` from `update()` when the reference would have shown the overlay.                                                                                                                                                       |
| A `state === "win"` / "you cleared it" branch (arkanoid has one)                                                      | Also a game-over condition from the platform's point of view — route it through `this.gameOver()` too. There's no separate "you won" screen in the Player UI.                                                                                                                                                                              |
| Internal pause key (`P`, `Escape`) toggling a local `paused`/`isPaused` flag                                          | Delete the key binding. Pause is owned by the Player screen's `PAUSA` button, which calls `ArcadeEngine.pause()`. A second, independent pause source is a bug waiting to desync from the HUD's "PAUSA"/"REANUDAR" label.                                                                                                                   |
| `document.addEventListener("keydown", ...)` inside `game.js`                                                          | Delete. `GameCanvas` registers/removes the listeners and forwards codes via `engine.handleKeyDown(code)`/`handleKeyUp(code)` — your engine only ever reads them back through `this.isDown(code)` / `this.pressed(code)`.                                                                                                                   |
| `canvas.addEventListener("mousemove"/"mousedown", (e) => { const x = e.clientX - rect.left; ... })`                   | Delete the coordinate math. Set `pointer: true` on the `GameRuntime` entry and read already-translated logical coordinates from `onPointerMove`/`onPointerDown` (wire these through your engine's own method, e.g. `handlePointerMove(x, y)`, called from the component layer — see `GameCanvas`'s `onPointerMove`/`onPointerDown` props). |
| `new Audio("assets/foo.mp3")`, `new Image(); img.src = "assets/bar.png"`                                              | Move the files to `public/games/<id>/`, reference them by absolute path (`/games/<id>/foo.mp3`). Don't let a failed load throw inside `update()`/`draw()` — a missing asset should degrade silently, not crash the game.                                                                                                                   |
| A sibling data file with globals (`levels.js` defining `const LEVELS = [...]`, a spritesheet module)                  | Turn it into a typed module living next to the engine (`components/games/<id>/levels.ts`) with a real `export`. Import it from `engine.ts` — no globals.                                                                                                                                                                                   |
| A second `<canvas>` for a side panel (tetris's "next piece" preview)                                                  | Prefer drawing it inside the main canvas (simplest, no extra DOM). If that's genuinely awkward, use the registry's `Component` escape hatch instead of fighting `GameCanvas`'s single-canvas assumption — see `reference/contract.md`.                                                                                                     |
| `function loop(ts) { ...; requestAnimationFrame(loop); }` started at the bottom of the file                           | Delete — `ArcadeEngine`'s `tick` already does this, with `dt` clamped to 50ms and pause handling built in. Do not reimplement a loop or read `performance.now()` yourself for timing; take `dt` as `update(dt)`'s argument.                                                                                                                |
| Any UI chrome from the original page (a theme toggle, a title `<h1>`, a controls legend)                              | Drop it. It has no equivalent in the Player screen and isn't part of what's being ported — the spec's "Fuera de alcance" section should say so explicitly.                                                                                                                                                                                 |
| A non-4:3 canvas (tetris is 300×600 — a 1:2 portrait board)                                                           | Just declare the real `width`/`height` in the registry entry. `GameCanvas` letterboxes any ratio inside the 4:3 `.crt-screen` automatically; do not rescale the game's own constants to fake a 4:3 board.                                                                                                                                  |

## A minimal port skeleton

```ts
// components/games/<id>/engine.ts
import { ArcadeEngine, type EngineCallbacks } from "@/components/games/engine-base";

export const WIDTH = 800; // match the GAME_RUNTIMES entry
export const HEIGHT = 600;

export class YourEngine extends ArcadeEngine {
  // instance fields for entities — ship, board, whatever the game needs

  protected init() {
    // reset all entity state to a fresh game
    this.score = 0;
    this.setLives(3); // or whatever this game's "lives" means
    this.setLevel(1);
  }

  protected update(dt: number) {
    if (this.state === "gameover") return;
    // read input via this.isDown(code) / this.pressed(code)
    // advance entities, resolve collisions, call this.addScore(n) on scoring events
    // call this.gameOver() when the run ends
  }

  protected draw() {
    // ctx.fillRect(...) etc. — no HUD, no overlay text here
  }
}
```

Then register it (see `reference/contract.md` for the full `GameRuntime` shape):

```ts
// components/games/registry.ts
"<id>": {
  width: WIDTH,
  height: HEIGHT,
  capturedKeys: [/* the keys this game needs */],
  loadEngine: async (ctx, callbacks) => {
    const { YourEngine } = await import("@/components/games/<id>/engine");
    return new YourEngine(ctx, callbacks);
  },
},
```
