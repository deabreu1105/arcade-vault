"use client";

import { useActionState, useEffect, useRef } from "react";
import { GAME_CATEGORIES, GAME_COLORS, GAME_COVERS } from "@/lib/data";
import type { Game } from "@/lib/data";

export type GameFormState = { error: string } | null;

export function GameForm({
  mode,
  game,
  action,
  onSuccess,
}: {
  mode: "create" | "edit";
  game?: Game;
  action: (state: GameFormState, formData: FormData) => Promise<GameFormState>;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      onSuccess?.();
    }
    wasPending.current = isPending;
  }, [isPending, state, onSuccess]);

  return (
    <form action={formAction} className="card" style={{ padding: 20, marginTop: 16 }}>
      <div className="field">
        <label>ID (slug)</label>
        <input
          name="id"
          defaultValue={game?.id}
          placeholder="mi-juego-nuevo"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          readOnly={mode === "edit"}
          disabled={mode === "edit"}
          required
        />
      </div>

      <div className="field">
        <label>Título</label>
        <input name="title" defaultValue={game?.title} placeholder="MI JUEGO NUEVO" required />
      </div>

      <div className="field">
        <label>Descripción corta</label>
        <input
          name="short"
          defaultValue={game?.short}
          placeholder="Una línea que resume el juego."
          required
        />
      </div>

      <div className="field">
        <label>Descripción larga</label>
        <textarea
          name="long"
          defaultValue={game?.long}
          placeholder="Descripción completa que aparece en la ficha del juego."
          rows={4}
          required
        />
      </div>

      <div className="field">
        <label>Categoría</label>
        <select name="cat" defaultValue={game?.cat ?? GAME_CATEGORIES[0]} required>
          {GAME_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Color</label>
        <select name="color" defaultValue={game?.color ?? GAME_COLORS[0]} required>
          {GAME_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Cover</label>
        <select name="cover" defaultValue={game?.cover ?? GAME_COVERS[0]} required>
          {GAME_COVERS.map((cover) => (
            <option key={cover} value={cover}>
              {cover}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <div className="mono" style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}>
          {state.error}
        </div>
      )}

      <button className="btn lg" type="submit" style={{ marginTop: 12 }} disabled={isPending}>
        {isPending ? "GUARDANDO..." : mode === "create" ? "CREAR JUEGO" : "GUARDAR CAMBIOS"}
      </button>
    </form>
  );
}
