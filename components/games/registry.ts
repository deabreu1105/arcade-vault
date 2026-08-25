import type { ComponentType, Ref } from "react";
import type { ArcadeEngine, EngineCallbacks } from "@/components/games/engine-base";
import type { GameCanvasHandle, GameCanvasProps } from "@/components/games/game-canvas";

/**
 * Un botón táctil individual del overlay de controles. Sintetiza el mismo `event.code` que el
 * motor ya escucha vía `capturedKeys` — el motor no distingue si vino de teclado o de este botón.
 */
export type TouchButton = {
  /** El mismo event.code que el motor ya escucha vía capturedKeys. */
  code: string;
  /** Texto corto o ícono a mostrar dentro del botón. */
  label: string;
  /** Posición fija sobre el canvas, como porcentaje del ancho/alto lógico. */
  position: { top: string; left: string };
};

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
  /** Overlay de botones táctiles sobre el canvas, para jugar en pantallas táctiles. */
  touchControls?: TouchButton[];
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
    touchControls: [
      { code: "ArrowLeft", label: "◀", position: { top: "88%", left: "10%" } },
      { code: "ArrowRight", label: "▶", position: { top: "88%", left: "40%" } },
      { code: "ArrowUp", label: "▲", position: { top: "60%", left: "6%" } },
      { code: "Space", label: "DISPARAR", position: { top: "88%", left: "86%" } },
    ],
    loadEngine: async (ctx, callbacks) => {
      const { AsteroidsEngine } = await import("@/components/games/asteroides/engine");
      return new AsteroidsEngine(ctx, callbacks);
    },
  },
  tetris: {
    width: 400,
    height: 600,
    capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"],
    touchControls: [
      { code: "ArrowLeft", label: "◀", position: { top: "90%", left: "14%" } },
      { code: "ArrowRight", label: "▶", position: { top: "90%", left: "42%" } },
      { code: "ArrowDown", label: "▼", position: { top: "70%", left: "28%" } },
      { code: "ArrowUp", label: "GIRAR", position: { top: "90%", left: "70%" } },
      { code: "Space", label: "CAÍDA RÁPIDA", position: { top: "70%", left: "56%" } },
    ],
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
    touchControls: [
      { code: "ArrowUp", label: "▲", position: { top: "68%", left: "20%" } },
      { code: "ArrowLeft", label: "◀", position: { top: "78%", left: "74%" } },
      { code: "ArrowRight", label: "▶", position: { top: "60%", left: "90%" } },
      { code: "ArrowDown", label: "▼", position: { top: "90%", left: "46%" } },
    ],
    loadEngine: async (ctx, callbacks) => {
      const { SnakeEngine } = await import("@/components/games/snake/engine");
      return new SnakeEngine(ctx, callbacks);
    },
  },
};

export function getGameRuntime(id: string): GameRuntime | undefined {
  return GAME_RUNTIMES[id];
}
