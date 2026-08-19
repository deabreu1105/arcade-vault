"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import type { Game } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { GameCanvas, type GameCanvasHandle } from "@/components/games/game-canvas";
import { getGameRuntime } from "@/components/games/registry";
import { getGameForPlay, saveRealScoreAction } from "./actions";

export default function GamePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, saveScore } = useAuth();
  const [game, setGame] = useState<Game | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getGameForPlay(id).then((g) => {
      if (!cancelled) setGame(g);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (game === null) notFound();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [engineLevel, setEngineLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  const runtime = game ? getGameRuntime(game.id) : undefined;
  const level = runtime ? engineLevel : Math.floor(score / 2500) + 1;

  useEffect(() => {
    if (!game || over || paused || runtime) return;
    const t = setInterval(() => setScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [game, over, paused, runtime]);

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      if (runtime) {
        if (next) gameCanvasRef.current?.pause();
        else gameCanvasRef.current?.resume();
      }
      return next;
    });
  };
  const endGame = () => {
    if (runtime) gameCanvasRef.current?.forceGameOver();
    else setOver(true);
  };
  const restart = () => {
    if (runtime) gameCanvasRef.current?.restart();
    else {
      setScore(0);
      setLives(3);
    }
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const handleSaveScore = async () => {
    if (user) {
      await saveRealScoreAction({ gameId: game!.id, score });
    } else {
      saveScore({ game: game!.id, score, name });
    }
    setSaved(true);
  };

  if (game === undefined) {
    return (
      <div className="av-player fade-in">
        <div className="crt">
          <div className="crt-screen">
            <div className="crt-content">
              <div className="pixel neon-cyan" style={{ fontSize: 16 }}>
                CARGANDO…
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">
              {lives > 5 ? lives.toLocaleString("es-ES") : "♥ ".repeat(lives).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/juegos/${game.id}`)}>
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {runtime ? (
            (() => {
              const CanvasComponent = runtime.Component ?? GameCanvas;
              return (
                <CanvasComponent
                  ref={gameCanvasRef}
                  {...runtime}
                  onScoreChange={setScore}
                  onLivesChange={setLives}
                  onLevelChange={setEngineLevel}
                  onGameOver={() => setOver(true)}
                />
              );
            })()
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                {user ? (
                  <div className="mono" style={{ fontSize: 14, color: "var(--ink)" }}>
                    {user.name}
                  </div>
                ) : (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="TUS INICIALES"
                  />
                )}
                <button className="btn yellow" onClick={handleSaveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/biblioteca")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
