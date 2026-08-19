// Base compartida para los motores de juego real del Vault.
// Encapsula el andamiaje que es igual en todos los juegos (loop de requestAnimationFrame,
// pausa/reanudación sin saltos de dt, ciclo de vida) para que cada motor concreto (p. ej.
// components/games/asteroides/engine.ts) solo tenga que implementar su propia lógica de juego.

export type EngineCallbacks = {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (score: number) => void;
};

export type GameState = "playing" | "dead" | "gameover";

/**
 * Motor de juego real: recibe el contexto de canvas y los callbacks por constructor, y expone
 * el ciclo de vida que la pantalla de Jugador necesita (start/pause/resume/restart/forceGameOver/
 * destroy) más el manejo de teclado. Cada juego concreto extiende esta clase e implementa
 * `init()`, `update(dt)` y `draw()`.
 */
export abstract class ArcadeEngine {
  protected ctx: CanvasRenderingContext2D;
  protected callbacks: EngineCallbacks;

  protected score = 0;
  protected lives = 3;
  protected level = 1;
  protected state: GameState = "playing";

  private keys: Record<string, boolean> = {};
  private justPressed: Record<string, boolean> = {};

  private paused = false;
  private running = false;
  private lastTime: number | null = null;
  private rafId: number | null = null;
  private tick = (ts: number) => {
    const dt = this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    if (!this.paused) this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.tick);
  };

  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    this.ctx = ctx;
    this.callbacks = callbacks;
  }

  /** Reinicia el estado interno del juego a una partida nueva. Llamado por start() y restart(). */
  protected abstract init(): void;
  /** Avanza la simulación `dt` segundos. No se llama mientras el motor está en pausa. */
  protected abstract update(dt: number): void;
  /** Dibuja el estado actual. Sigue llamándose en pausa (último frame congelado). */
  protected abstract draw(): void;

  start() {
    this.init();
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTime = null;
  }

  restart() {
    this.init();
    this.paused = false;
    this.lastTime = null;
  }

  forceGameOver() {
    if (this.state === "gameover") return;
    this.state = "gameover";
    this.callbacks.onGameOver(this.score);
  }

  destroy() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  handleKeyDown(code: string) {
    if (!this.keys[code]) this.justPressed[code] = true;
    this.keys[code] = true;
  }

  handleKeyUp(code: string) {
    this.keys[code] = false;
  }

  protected isDown(code: string) {
    return !!this.keys[code];
  }

  /** True solo en el primer update() tras presionar la tecla (evita repetición mientras se mantiene). */
  protected pressed(code: string) {
    const val = !!this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  protected addScore(points: number) {
    this.score += points;
    this.callbacks.onScoreChange(this.score);
  }

  protected setLives(lives: number) {
    this.lives = lives;
    this.callbacks.onLivesChange(this.lives);
  }

  protected setLevel(level: number) {
    this.level = level;
    this.callbacks.onLevelChange(this.level);
  }

  protected gameOver() {
    this.state = "gameover";
    this.callbacks.onGameOver(this.score);
  }
}
