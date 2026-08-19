# The platform contract for a real game

Read this before writing an engine. It describes the surface a new game must implement, the
surface it gets for free, and — just as important — the files that should never change to add a
game.

## `ArcadeEngine` (`components/games/engine-base.ts`)

```ts
export type EngineCallbacks = {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (score: number) => void;
};

export abstract class ArcadeEngine {
  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks);

  // Implement these three in your subclass:
  protected abstract init(): void; // reset to a fresh game. Called by start() and restart().
  protected abstract update(dt: number): void; // advance dt seconds. Not called while paused.
  protected abstract draw(): void; // paint the current state. Still called while paused
  // (last frame stays on screen).

  // Already implemented — do not override:
  start(): void;
  pause(): void;
  resume(): void; // resets the internal clock so dt doesn't spike on resume
  restart(): void;
  forceGameOver(): void; // no-op if already game over
  destroy(): void; // stops the rAF loop
  handleKeyDown(code: string): void;
  handleKeyUp(code: string): void;

  // Helpers for your subclass to use instead of touching state directly:
  protected isDown(code: string): boolean;
  protected pressed(code: string): boolean; // true once per keydown, not held-repeat
  protected addScore(points: number): void;
  protected setLives(lives: number): void;
  protected setLevel(level: number): void;
  protected gameOver(): void; // same as forceGameOver, called from inside update()
}
```

Your subclass owns everything else: entities, collision, scoring rules, drawing. Look at
`components/games/asteroides/engine.ts` for a complete example — it's `AsteroidsEngine extends
ArcadeEngine`, and everything in it past the `ArcadeEngine` class itself is game-specific.

**Constructor signature is fixed**: `(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks)`.
`GameCanvas` and the registry both assume it.

## `GameCanvas` (`components/games/game-canvas.tsx`)

The component the Player screen renders. You almost never touch this file — you configure it via a
`GameRuntime` entry (below). It exposes, via ref:

```ts
type GameCanvasHandle = {
  pause: () => void; // wired to the "PAUSA" button
  resume: () => void; // wired to "REANUDAR"
  restart: () => void; // wired to "JUGAR DE NUEVO" in the game-over modal
  forceGameOver: () => void; // wired to the "FIN" button
};
```

It keeps the canvas at its logical `width`/`height` resolution and scales it by CSS
(`max-width/max-height: 100%`, intrinsic aspect ratio) so it's letterboxed inside `.crt-screen`
(which is a fixed 4:3 box) instead of stretched. A 4:3 game fills the box exactly, like Asteroides
does; anything else gets bars.

If `pointer: true` is set, mouse coordinates are translated from client space to your canvas's
logical space and forwarded directly to your engine's `handlePointerMove(x, y)` /
`handlePointerDown(x, y)` — the same way keyboard input reaches `handleKeyDown`/`handleKeyUp`. You
never do that coordinate math yourself; just override the two methods (both are no-ops on
`ArcadeEngine` by default) in your engine subclass.

## `GAME_RUNTIMES` (`components/games/registry.ts`)

```ts
export type GameRuntime = {
  width: number;
  height: number;
  capturedKeys: string[]; // event.code values, preventDefault'd while playing
  pointer?: boolean;
  loadEngine: (
    ctx: CanvasRenderingContext2D,
    callbacks: EngineCallbacks,
  ) => ArcadeEngine | Promise<ArcadeEngine>;
  Component?: ComponentType<GameCanvasProps & { ref?: Ref<GameCanvasHandle> }>;
};
```

Adding a game to the platform is, in the common case, exactly one entry here:

```ts
"<id>": {
  width: 800,
  height: 600,
  capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "Space"],
  loadEngine: async (ctx, callbacks) => {
    const { YourEngine } = await import("@/components/games/<id>/engine");
    return new YourEngine(ctx, callbacks);
  },
},
```

The dynamic `import()` inside `loadEngine` is deliberate — it keeps every game's engine code out of
the initial bundle for games nobody is currently playing.

`Component` is an escape hatch: if the game genuinely needs more DOM than one canvas (a separate
"next piece" preview panel that can't be drawn inside the main canvas, for instance), provide your
own component with the same props/ref shape as `GameCanvas` and skip it entirely. Reach for this
only after considering "draw it inside the canvas" and rejecting it for a concrete reason — it's
the exception, not the default.

## What NOT to touch

These files are already generic over `gameId` / a `games` row. A new game should never require a
change to any of them:

- `lib/supabase/queries.ts` — `getGames`, `getGame`, `getLeaderboard`, `getUserBestScore`,
  `insertScore` all take an id or return every row; none of them know about specific games.
- `app/juegos/[id]/jugar/actions.ts` — `getGameForPlay`/`saveRealScoreAction` are id-parametrized.
- `app/biblioteca/**`, `app/juegos/[id]/page.tsx`, `app/salon-de-la-fama/**` — all Server
  Components that fetch by id/list from `games`/`scores`. A new row makes the game appear
  automatically.
- `app/juegos/[id]/jugar/page.tsx` — reads `getGameRuntime(game.id)` and either renders the runtime
  or the decorative `.game-arena`. It has no per-game conditionals and should stay that way; if you
  find yourself wanting to add an `if (game.id === "...")` here, that logic belongs in the engine or
  in a `GameRuntime` field instead.

If satisfying the spec seems to require editing one of these, stop and treat that as a sign the
platform itself is missing something generic — raise it instead of special-casing a game id there.
