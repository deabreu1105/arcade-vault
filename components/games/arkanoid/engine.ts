// Motor de Arkanoid — portado de references/started-games/04-arkanoid/{game.js,levels.js,assets/spritesheet.js}
// Sin HUD ni overlays propios: score/vidas/nivel se exponen vía callbacks de ArcadeEngine. Sin
// selector de nivel en pausa (ver spec 09) — PAUSA/REANUDAR son los del HUD de React.

import { ArcadeEngine, type EngineCallbacks } from "@/components/games/engine-base";
import { LEVELS, type BlockColor } from "@/components/games/arkanoid/levels";

export type { EngineCallbacks };

export const WIDTH = 800;
export const HEIGHT = 600;

const PADDLE_SPEED = 400;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (WIDTH - 10 * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;
const EXPLOSION_DURATION = 150;

type Sprite = { sx: number; sy: number; sw: number; sh: number };

const SPRITES: { paddle: Sprite; ball: Sprite; blocks: Record<BlockColor, Sprite> } = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

const EXPLOSION_FRAMES: Record<BlockColor, Sprite[]> = {
  red: [176, 176, 176, 176].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  cyan: [192, 192, 192, 192].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  green: [208, 208, 208, 208].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  magenta: [224, 224, 224, 224].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  yellow: [240, 240, 240, 240].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  hotpink: [256, 256, 256, 256].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
  gray: [176, 176, 176, 176].map((sy, i) => ({ sx: 256 + i * 32, sy, sw: 32, sh: 16 })),
};

type Block = { x: number; y: number; w: number; h: number; color: BlockColor; alive: boolean };
type Explosion = { x: number; y: number; w: number; h: number; color: BlockColor; elapsed: number };

export class ArkanoidEngine extends ArcadeEngine {
  private paddle = { x: 0, y: 560, w: 81, h: 14 };
  private ball = { x: 0, y: 0, w: 16, h: 16, vx: BASE_BALL_VX, vy: BASE_BALL_VY };
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];
  private currentLevel = 1;
  private pointerX: number | null = null;

  private spritesheet: HTMLImageElement | null = null;
  private spritesheetLoaded = false;
  private bounceSound: HTMLAudioElement | null = null;
  private breakSound: HTMLAudioElement | null = null;

  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    super(ctx, callbacks);
    if (typeof window !== "undefined") {
      const img = new Image();
      img.onload = () => {
        this.spritesheetLoaded = true;
      };
      img.onerror = () => {
        this.spritesheetLoaded = false;
      };
      img.src = "/games/arkanoid/spritesheet-breakout.png";
      this.spritesheet = img;
      this.bounceSound = new Audio("/games/arkanoid/ball-bounce.mp3");
      this.breakSound = new Audio("/games/arkanoid/break-sound.mp3");
    }
  }

  private playSound(sound: HTMLAudioElement | null) {
    if (!sound) return;
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.play().catch(() => {});
  }

  private loadLevel(n: number) {
    this.currentLevel = n;
    this.setLevel(n);
    const level = LEVELS[n - 1];
    this.blocks = level.blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = BASE_BALL_VX * level.speed;
    this.ball.vy = BASE_BALL_VY * level.speed;
  }

  protected init() {
    this.state = "playing";
    this.score = 0;
    this.callbacks.onScoreChange(this.score);
    this.paddle.x = (WIDTH - this.paddle.w) / 2;
    this.setLives(3);
    this.loadLevel(1);
  }

  handlePointerMove(x: number) {
    this.pointerX = x;
  }

  private collideAABB(block: Block) {
    const { ball } = this;
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }

  protected update(dt: number) {
    if (this.state === "gameover") return;
    const { paddle, ball } = this;

    if (this.pointerX !== null) {
      paddle.x = Math.max(0, Math.min(WIDTH - paddle.w, this.pointerX - paddle.w / 2));
      this.pointerX = null;
    }
    if (this.isDown("ArrowLeft")) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (this.isDown("ArrowRight"))
      paddle.x = Math.min(WIDTH - paddle.w, paddle.x + PADDLE_SPEED * dt);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      this.playSound(this.bounceSound);
    }
    if (ball.x + ball.w >= WIDTH) {
      ball.x = WIDTH - ball.w;
      ball.vx = -Math.abs(ball.vx);
      this.playSound(this.bounceSound);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      this.playSound(this.bounceSound);
    }

    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      this.playSound(this.bounceSound);
    }

    for (const block of this.blocks) {
      if (!block.alive) continue;
      if (this.collideAABB(block)) {
        block.alive = false;
        this.explosions.push({
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
          color: block.color,
          elapsed: 0,
        });
        this.addScore(10);
        ball.vy = -ball.vy;
        this.playSound(this.breakSound);
        if (this.blocks.every((b) => !b.alive)) {
          if (this.currentLevel < 5) this.loadLevel(this.currentLevel + 1);
          else this.gameOver();
        }
        break;
      }
    }

    for (const exp of this.explosions) exp.elapsed += dt * 1000;
    this.explosions = this.explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    if (ball.y > HEIGHT) {
      const remaining = this.lives - 1;
      if (remaining <= 0) {
        this.setLives(0);
        this.gameOver();
      } else {
        this.setLives(remaining);
        this.ball.x = paddle.x + (paddle.w - ball.w) / 2;
        this.ball.y = paddle.y - ball.h;
        const speed = LEVELS[this.currentLevel - 1].speed;
        this.ball.vx = BASE_BALL_VX * speed;
        this.ball.vy = BASE_BALL_VY * speed;
      }
    }
  }

  private drawSprite(sprite: Sprite, x: number, y: number, w: number, h: number) {
    if (!this.spritesheetLoaded || !this.spritesheet) return;
    this.ctx.drawImage(this.spritesheet, sprite.sx, sprite.sy, sprite.sw, sprite.sh, x, y, w, h);
  }

  protected draw() {
    const { ctx } = this;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const block of this.blocks) {
      if (block.alive)
        this.drawSprite(SPRITES.blocks[block.color], block.x, block.y, block.w, block.h);
    }

    for (const exp of this.explosions) {
      const frameIndex = Math.min(Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4), 3);
      this.drawSprite(EXPLOSION_FRAMES[exp.color][frameIndex], exp.x, exp.y, exp.w, exp.h);
    }

    this.drawSprite(SPRITES.paddle, this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    this.drawSprite(SPRITES.ball, this.ball.x, this.ball.y, this.ball.w, this.ball.h);
  }
}
