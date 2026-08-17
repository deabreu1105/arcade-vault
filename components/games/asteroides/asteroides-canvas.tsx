"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AsteroidsEngine, ENGINE_HEIGHT, ENGINE_WIDTH, type EngineCallbacks } from "./engine";

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

export type AsteroidesCanvasHandle = {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  forceGameOver: () => void;
};

type AsteroidesCanvasProps = EngineCallbacks;

export const AsteroidesCanvas = forwardRef<AsteroidesCanvasHandle, AsteroidesCanvasProps>(
  function AsteroidesCanvas({ onScoreChange, onLivesChange, onLevelChange, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<AsteroidsEngine | null>(null);

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

      const engine = new AsteroidsEngine(ctx, {
        onScoreChange,
        onLivesChange,
        onLevelChange,
        onGameOver,
      });
      engineRef.current = engine;
      engine.start();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
        engine.handleKeyDown(e.code);
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
        engine.handleKeyUp(e.code);
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        engine.destroy();
        engineRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={ENGINE_WIDTH}
        height={ENGINE_HEIGHT}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    );
  },
);
