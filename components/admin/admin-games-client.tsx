"use client";

import { Fragment, useState } from "react";
import { GameForm } from "@/components/admin/game-form";
import { createGameAction, deleteGameAction, updateGameAction } from "@/app/admin/juegos/actions";
import type { GameWithStats } from "@/lib/supabase/queries";

export function AdminGamesClient({ games }: { games: GameWithStats[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      `¿Borrar "${id}"? También se borrarán todas las puntuaciones guardadas para este juego. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    setDeleteError(null);
    const result = await deleteGameAction(id);
    setDeletingId(null);
    if (result?.error) setDeleteError(result.error);
  }

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr className="mono" style={{ fontSize: 11, textAlign: "left" }}>
              <th style={{ padding: 12 }}>ID</th>
              <th style={{ padding: 12 }}>TÍTULO</th>
              <th style={{ padding: 12 }}>CATEGORÍA</th>
              <th style={{ padding: 12 }}>COLOR</th>
              <th style={{ padding: 12 }}>COVER</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <Fragment key={game.id}>
                <tr className="mono" style={{ fontSize: 12 }}>
                  <td style={{ padding: 12 }}>{game.id}</td>
                  <td style={{ padding: 12 }}>{game.title}</td>
                  <td style={{ padding: 12 }}>{game.cat}</td>
                  <td style={{ padding: 12 }}>{game.color}</td>
                  <td style={{ padding: 12 }}>{game.cover}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        setCreating(false);
                        setEditingId(editingId === game.id ? null : game.id);
                      }}
                    >
                      {editingId === game.id ? "CERRAR" : "EDITAR"}
                    </button>{" "}
                    <button
                      className="btn ghost"
                      onClick={() => handleDelete(game.id)}
                      disabled={deletingId === game.id}
                    >
                      {deletingId === game.id ? "BORRANDO..." : "BORRAR"}
                    </button>
                  </td>
                </tr>
                {editingId === game.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12 }}>
                      <GameForm
                        mode="edit"
                        game={game}
                        action={updateGameAction.bind(null, game.id)}
                        onSuccess={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && (
        <div className="mono" style={{ color: "var(--magenta)", fontSize: 11, marginTop: 12 }}>
          {deleteError}
        </div>
      )}

      {creating ? (
        <GameForm mode="create" action={createGameAction} onSuccess={() => setCreating(false)} />
      ) : (
        <button
          className="btn lg"
          style={{ marginTop: 24 }}
          onClick={() => {
            setEditingId(null);
            setCreating(true);
          }}
        >
          NUEVO JUEGO
        </button>
      )}
    </div>
  );
}
