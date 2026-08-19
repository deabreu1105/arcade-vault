import type { ComponentType, Ref } from "react";
import type { ArcadeEngine, EngineCallbacks } from "@/components/games/engine-base";
import type { GameCanvasHandle, GameCanvasProps } from "@/components/games/game-canvas";

/**
 * Describe cómo montar el motor real de un juego dentro de la pantalla de Jugador
 * (app/juegos/[id]/jugar/page.tsx). Un juego que no tiene entrada aquí sigue mostrando la
 * simulación decorativa (.game-arena) — así conviven juegos reales y juegos aún no portados.
 */
export type GameRuntime = {
  /** Resolución lógica del canvas. No tiene que ser 4:3: GameCanvas la deja letterboxed. */
  width: number;
  height: number;
  /** Códigos de tecla (`event.code`) a capturar con preventDefault mientras se juega. */
  capturedKeys: string[];
  /** Si el juego usa mouse (p. ej. mover una pala), habilita el mapeo de puntero de GameCanvas. */
  pointer?: boolean;
  /** Instancia el motor concreto. Import dinámico para no cargar todos los motores de una vez. */
  loadEngine: (
    ctx: CanvasRenderingContext2D,
    callbacks: EngineCallbacks,
  ) => ArcadeEngine | Promise<ArcadeEngine>;
  /**
   * Escape hatch: si el juego necesita más DOM que un solo canvas (p. ej. un panel "siguiente
   * pieza" separado), reemplaza a GameCanvas por completo. Recibe las mismas props + ref.
   */
  Component?: ComponentType<GameCanvasProps & { ref?: Ref<GameCanvasHandle> }>;
};

export const GAME_RUNTIMES: Record<string, GameRuntime> = {
  asteroides: {
    width: 800,
    height: 600,
    capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "Space"],
    loadEngine: async (ctx, callbacks) => {
      const { AsteroidsEngine } = await import("@/components/games/asteroides/engine");
      return new AsteroidsEngine(ctx, callbacks);
    },
  },
  tetris: {
    width: 400,
    height: 600,
    capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"],
    loadEngine: async (ctx, callbacks) => {
      const { TetrisEngine } = await import("@/components/games/tetris/engine");
      return new TetrisEngine(ctx, callbacks);
    },
  },
  arkanoid: {
    width: 800,
    height: 600,
    capturedKeys: ["ArrowLeft", "ArrowRight"],
    pointer: true,
    loadEngine: async (ctx, callbacks) => {
      const { ArkanoidEngine } = await import("@/components/games/arkanoid/engine");
      return new ArkanoidEngine(ctx, callbacks);
    },
  },
  snake: {
    width: 480,
    height: 480,
    capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
    loadEngine: async (ctx, callbacks) => {
      const { SnakeEngine } = await import("@/components/games/snake/engine");
      return new SnakeEngine(ctx, callbacks);
    },
  },
};

export function getGameRuntime(id: string): GameRuntime | undefined {
  return GAME_RUNTIMES[id];
}
