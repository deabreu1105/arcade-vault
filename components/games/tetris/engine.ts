// Motor de Tetris — portado de references/started-games/03-tetris/game.js
// Sin HUD ni overlay propios: el score/líneas/nivel se exponen vía callbacks de ArcadeEngine.
// Único elemento dibujado en canvas que no tiene equivalente en el HUD de React: la vista previa
// de la siguiente pieza, en la franja lateral derecha del canvas (ver reference/porting.md).

import { ArcadeEngine, type EngineCallbacks } from "@/components/games/engine-base";

export type { EngineCallbacks };

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

export const BOARD_WIDTH = COLS * BLOCK; // 300
export const BOARD_HEIGHT = ROWS * BLOCK; // 600
export const PANEL_WIDTH = 100;
export const ENGINE_WIDTH = BOARD_WIDTH + PANEL_WIDTH; // 400
export const ENGINE_HEIGHT = BOARD_HEIGHT; // 600

const COLORS = [
  null,
  "#4dd0e1", // I - cian
  "#ffd54f", // O - amarillo
  "#ba68c8", // T - violeta
  "#81c784", // S - verde
  "#e57373", // Z - rojo
  "#90caf9", // J - celeste
  "#ffb74d", // L - naranja
  "#9e9e9e", // N - tuerca
];

type Shape = number[][];

const PIECES: (Shape | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const WALL_KICKS = [0, -1, 1, -2, 2];

const DAS = 0.28; // retraso antes de que izquierda/derecha empiecen a repetirse
const ARR = 0.05; // intervalo de repetición una vez pasado el DAS

type Piece = { shape: Shape; x: number; y: number };
type HeldKey = "left" | "right" | "down";

function cloneShape(shape: Shape): Shape {
  return shape.map((row) => [...row]);
}

function rotateCW(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Shape = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

export class TetrisEngine extends ArcadeEngine {
  private board: number[][] = [];
  private current: Piece | null = null;
  private next: Piece | null = null;
  private dropInterval = 1000;
  private dropAccum = 0;
  private linesCleared = 0;

  private dasTimer: Record<HeldKey, number> = { left: 0, right: 0, down: 0 };
  private arrTimer: Record<HeldKey, number> = { left: 0, right: 0, down: 0 };

  private createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  private randomPiece(): Piece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = cloneShape(PIECES[type] as Shape);
    return {
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  private collide(shape: Shape, ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  private tryRotate() {
    const current = this.current;
    if (!current) return;
    const rotated = rotateCW(current.shape);
    for (const kick of WALL_KICKS) {
      if (!this.collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  private moveHorizontal(dir: number) {
    const current = this.current;
    if (!current) return;
    if (!this.collide(current.shape, current.x + dir, current.y)) current.x += dir;
  }

  private softDrop() {
    const current = this.current;
    if (!current) return;
    if (!this.collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      this.addScore(1);
    } else {
      this.lockPiece();
    }
  }

  private ghostY(): number {
    const current = this.current;
    if (!current) return 0;
    let gy = current.y;
    while (!this.collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  private hardDrop() {
    const current = this.current;
    if (!current) return;
    const gy = this.ghostY();
    this.addScore((gy - current.y) * 2);
    current.y = gy;
    this.lockPiece();
  }

  private merge() {
    const current = this.current;
    if (!current) return;
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) this.board[current.y + r][current.x + c] = current.shape[r][c];
  }

  private clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.linesCleared += cleared;
      this.addScore((LINE_SCORES[cleared] ?? 0) * this.level);
      this.setLives(this.linesCleared);
      this.setLevel(Math.floor(this.linesCleared / 10) + 1);
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
    }
  }

  private lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private isGameOver(): boolean {
    return this.state === "gameover";
  }

  private spawn() {
    this.current = this.next;
    this.next = this.randomPiece();
    if (this.current && this.collide(this.current.shape, this.current.x, this.current.y)) {
      this.gameOver();
    }
  }

  private handleRepeatedKey(
    code: string,
    key: HeldKey,
    dt: number,
    action: () => void,
    das: number,
  ) {
    if (this.pressed(code)) {
      action();
      this.dasTimer[key] = 0;
      this.arrTimer[key] = 0;
      return;
    }
    if (this.isDown(code)) {
      this.dasTimer[key] += dt;
      if (this.dasTimer[key] >= das) {
        this.arrTimer[key] += dt;
        if (this.arrTimer[key] >= ARR) {
          action();
          this.arrTimer[key] = 0;
        }
      }
    } else {
      this.dasTimer[key] = 0;
      this.arrTimer[key] = 0;
    }
  }

  protected init() {
    this.board = this.createBoard();
    this.score = 0;
    this.linesCleared = 0;
    this.dropInterval = 1000;
    this.dropAccum = 0;
    this.state = "playing";
    this.dasTimer = { left: 0, right: 0, down: 0 };
    this.arrTimer = { left: 0, right: 0, down: 0 };
    this.next = this.randomPiece();
    this.spawn();
    this.callbacks.onScoreChange(this.score);
    this.setLives(0);
    this.setLevel(1);
  }

  protected update(dt: number) {
    if (this.state === "gameover") return;

    this.handleRepeatedKey("ArrowLeft", "left", dt, () => this.moveHorizontal(-1), DAS);
    this.handleRepeatedKey("ArrowRight", "right", dt, () => this.moveHorizontal(1), DAS);
    this.handleRepeatedKey("ArrowDown", "down", dt, () => this.softDrop(), 0);

    if (this.pressed("ArrowUp") || this.pressed("KeyX")) this.tryRotate();
    if (this.pressed("Space")) this.hardDrop();

    if (this.isGameOver()) return;

    this.dropAccum += dt * 1000;
    if (this.dropAccum >= this.dropInterval) {
      this.dropAccum = 0;
      const current = this.current;
      if (current && !this.collide(current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        this.lockPiece();
      }
    }
  }

  private drawCell(px: number, py: number, colorIndex: number, size: number, alpha = 1) {
    if (!colorIndex) return;
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS[colorIndex] as string;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(px + 1, py + 1, size - 2, 4);
    ctx.globalAlpha = 1;
  }

  private drawBoard() {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, BOARD_HEIGHT);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(BOARD_WIDTH, r * BLOCK);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) this.drawCell(c * BLOCK, r * BLOCK, this.board[r][c], BLOCK);

    const current = this.current;
    if (!current) return;

    const gy = this.ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          this.drawCell((current.x + c) * BLOCK, (gy + r) * BLOCK, current.shape[r][c], BLOCK, 0.2);

    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          this.drawCell(
            (current.x + c) * BLOCK,
            (current.y + r) * BLOCK,
            current.shape[r][c],
            BLOCK,
          );
  }

  private drawNextPreview() {
    const ctx = this.ctx;
    const originX = BOARD_WIDTH + 20;
    const originY = 30;
    const boxSize = 60;

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(originX, originY, boxSize, boxSize);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("NEXT", originX, originY - 8);

    const next = this.next;
    if (!next) return;
    const NB = 14;
    const offX = Math.floor((4 - next.shape[0].length) / 2);
    const offY = Math.floor((4 - next.shape.length) / 2);
    for (let r = 0; r < next.shape.length; r++)
      for (let c = 0; c < next.shape[r].length; c++)
        if (next.shape[r][c])
          this.drawCell(originX + (offX + c) * NB, originY + (offY + r) * NB, next.shape[r][c], NB);
  }

  protected draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, ENGINE_WIDTH, ENGINE_HEIGHT);

    this.drawBoard();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(BOARD_WIDTH, 0);
    ctx.lineTo(BOARD_WIDTH, ENGINE_HEIGHT);
    ctx.stroke();

    this.drawNextPreview();
  }
}
