// Motor de Snake — construido desde cero (sin referencia en references/started-games/), usando
// los sprites de fruta de references/source-assets/snake-assets/ como comida. Sin HUD ni overlay
// propios: score/nivel se exponen vía callbacks de ArcadeEngine. "Vidas" siempre 0 (se ve como
// "—" en el HUD): Snake clásico no tiene vidas, una sola colisión termina la partida.

import { ArcadeEngine, type EngineCallbacks } from "@/components/games/engine-base";
import {
  FRUITS_IMAGE_SRC,
  randomFruitSprite,
  type SpriteRect,
} from "@/components/games/snake/sprites";

export type { EngineCallbacks };

const GRID = 20;
const CELL = 24;
export const WIDTH = GRID * CELL; // 480
export const HEIGHT = GRID * CELL; // 480

const BASE_STEP_MS = 160;
const MIN_STEP_MS = 70;
const STEP_DECREASE_PER_LEVEL = 12;
const FRUITS_PER_LEVEL = 5;
const POINTS_PER_FRUIT = 10;

type Cell = { col: number; row: number };
type Dir = { dx: number; dy: number };

const UP: Dir = { dx: 0, dy: -1 };
const DOWN: Dir = { dx: 0, dy: 1 };
const LEFT: Dir = { dx: -1, dy: 0 };
const RIGHT: Dir = { dx: 1, dy: 0 };

export class SnakeEngine extends ArcadeEngine {
  private snake: Cell[] = [];
  private direction: Dir = RIGHT;
  private pendingDirection: Dir = RIGHT;
  private food: (Cell & { sprite: SpriteRect }) | null = null;
  private stepAccum = 0;
  private stepInterval = BASE_STEP_MS;
  private fruitsEaten = 0;

  private image: HTMLImageElement | null = null;
  private imageLoaded = false;

  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    super(ctx, callbacks);
    if (typeof window !== "undefined") {
      const img = new Image();
      img.onload = () => {
        this.imageLoaded = true;
      };
      img.onerror = () => {
        this.imageLoaded = false;
      };
      img.src = FRUITS_IMAGE_SRC;
      this.image = img;
    }
  }

  private isOccupied(col: number, row: number) {
    return this.snake.some((s) => s.col === col && s.row === row);
  }

  private spawnFood() {
    let col: number;
    let row: number;
    do {
      col = Math.floor(Math.random() * GRID);
      row = Math.floor(Math.random() * GRID);
    } while (this.isOccupied(col, row));
    this.food = { col, row, sprite: randomFruitSprite() };
  }

  protected init() {
    this.state = "playing";
    this.score = 0;
    this.callbacks.onScoreChange(this.score);
    this.setLives(0);
    this.setLevel(1);
    this.fruitsEaten = 0;
    this.stepInterval = BASE_STEP_MS;
    this.stepAccum = 0;
    const startRow = Math.floor(GRID / 2);
    this.snake = [
      { col: 9, row: startRow },
      { col: 8, row: startRow },
      { col: 7, row: startRow },
    ];
    this.direction = RIGHT;
    this.pendingDirection = RIGHT;
    this.spawnFood();
  }

  private isOpposite(a: Dir, b: Dir) {
    return a.dx === -b.dx && a.dy === -b.dy;
  }

  private readDirectionInput() {
    let next: Dir | null = null;
    if (this.pressed("ArrowUp")) next = UP;
    else if (this.pressed("ArrowDown")) next = DOWN;
    else if (this.pressed("ArrowLeft")) next = LEFT;
    else if (this.pressed("ArrowRight")) next = RIGHT;
    if (next && !this.isOpposite(next, this.direction)) this.pendingDirection = next;
  }

  /** Devuelve true si la partida terminó en este paso. */
  private step(): boolean {
    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const newHead: Cell = { col: head.col + this.direction.dx, row: head.row + this.direction.dy };

    if (newHead.col < 0 || newHead.col >= GRID || newHead.row < 0 || newHead.row >= GRID) {
      this.gameOver();
      return true;
    }

    const grew = !!this.food && newHead.col === this.food.col && newHead.row === this.food.row;
    const bodyToCheck = grew ? this.snake : this.snake.slice(0, -1);
    if (bodyToCheck.some((s) => s.col === newHead.col && s.row === newHead.row)) {
      this.gameOver();
      return true;
    }

    this.snake.unshift(newHead);
    if (grew) {
      this.addScore(POINTS_PER_FRUIT);
      this.fruitsEaten++;
      const level = Math.floor(this.fruitsEaten / FRUITS_PER_LEVEL) + 1;
      this.setLevel(level);
      this.stepInterval = Math.max(
        MIN_STEP_MS,
        BASE_STEP_MS - (level - 1) * STEP_DECREASE_PER_LEVEL,
      );
      this.spawnFood();
    } else {
      this.snake.pop();
    }
    return false;
  }

  protected update(dt: number) {
    if (this.state === "gameover") return;
    this.readDirectionInput();

    this.stepAccum += dt * 1000;
    while (this.stepAccum >= this.stepInterval) {
      this.stepAccum -= this.stepInterval;
      if (this.step()) return;
    }
  }

  private drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(WIDTH, i * CELL);
      ctx.stroke();
    }
  }

  private drawSegment(cell: Cell, color: string, glow: number) {
    const { ctx } = this;
    const pad = 2;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.beginPath();
    ctx.roundRect(cell.col * CELL + pad, cell.row * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  protected draw() {
    const { ctx } = this;
    ctx.fillStyle = "#04140c";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    this.drawGrid();

    if (this.food && this.imageLoaded && this.image) {
      const { sprite } = this.food;
      const pad = 2;
      ctx.drawImage(
        this.image,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h,
        this.food.col * CELL + pad,
        this.food.row * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
      );
    }

    for (let i = this.snake.length - 1; i >= 1; i--) {
      this.drawSegment(this.snake[i], "#00c46f", 6);
    }
    if (this.snake[0]) this.drawSegment(this.snake[0], "#baffe3", 10);
  }
}
