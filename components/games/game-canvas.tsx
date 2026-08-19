"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ArcadeEngine, EngineCallbacks } from "@/components/games/engine-base";

export type GameCanvasHandle = {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  forceGameOver: () => void;
};

export type GameCanvasProps = EngineCallbacks & {
  width: number;
  height: number;
  /** Códigos de tecla (`event.code`) a capturar con preventDefault mientras el canvas está montado. */
  capturedKeys: string[];
  /** Habilita el mapeo de mouse a coordenadas lógicas del canvas (para juegos que usan puntero). */
  pointer?: boolean;
  onPointerMove?: (x: number, y: number) => void;
  onPointerDown?: (x: number, y: number) => void;
  /** Instancia el motor concreto del juego. Se llama una sola vez, al montar. */
  loadEngine: (
    ctx: CanvasRenderingContext2D,
    callbacks: EngineCallbacks,
  ) => ArcadeEngine | Promise<ArcadeEngine>;
};

/**
 * Canvas genérico para un juego real del Vault: instancia el motor recibido por `loadEngine`,
 * conecta sus callbacks a las props, captura el teclado (y opcionalmente el mouse) mientras está
 * montado, y expone pause/resume/restart/forceGameOver vía ref para que la pantalla de Jugador
 * controle la partida desde sus botones existentes.
 *
 * El canvas mantiene su resolución lógica fija (`width`/`height`) y se escala por CSS conservando
 * su proporción dentro del contenedor disponible (letterboxed si no es 4:3 como `.crt-screen`).
 */
export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  {
    width,
    height,
    capturedKeys,
    pointer,
    onPointerMove,
    onPointerDown,
    loadEngine,
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArcadeEngine | null>(null);

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cancelled = false;
    let cleanupListeners: (() => void) | null = null;

    Promise.resolve(
      loadEngine(ctx, { onScoreChange, onLivesChange, onLevelChange, onGameOver }),
    ).then((engine) => {
      // El componente se desmontó (o loadEngine cambió) antes de que el motor terminara de cargar.
      if (cancelled) {
        engine.destroy();
        return;
      }

      const capturedSet = new Set(capturedKeys);
      engineRef.current = engine;
      engine.start();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (capturedSet.has(e.code)) e.preventDefault();
        engine.handleKeyDown(e.code);
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (capturedSet.has(e.code)) e.preventDefault();
        engine.handleKeyUp(e.code);
      };
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      const toLogical = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((e.clientX - rect.left) * width) / rect.width,
          y: ((e.clientY - rect.top) * height) / rect.height,
        };
      };
      const handlePointerMove = (e: MouseEvent) => {
        const { x, y } = toLogical(e);
        onPointerMove?.(x, y);
      };
      const handlePointerDown = (e: MouseEvent) => {
        const { x, y } = toLogical(e);
        onPointerDown?.(x, y);
      };
      if (pointer) {
        canvas.addEventListener("mousemove", handlePointerMove);
        canvas.addEventListener("mousedown", handlePointerDown);
      }

      cleanupListeners = () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        if (pointer) {
          canvas.removeEventListener("mousemove", handlePointerMove);
          canvas.removeEventListener("mousedown", handlePointerDown);
        }
        engine.destroy();
        engineRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanupListeners?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: "auto",
        height: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    />
  );
});
