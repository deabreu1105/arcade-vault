"use server";

import { revalidatePath } from "next/cache";
import type { GameFormState } from "@/components/admin/game-form";
import { GAME_CATEGORIES, GAME_COLORS, GAME_COVERS } from "@/lib/data";
import type { Game, GameCategory } from "@/lib/data";
import { createGame, deleteGame, isCurrentUserAdmin, updateGame } from "@/lib/supabase/queries";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
}

function parseGameInput(formData: FormData): Omit<Game, "id"> | { error: string } {
  const title = String(formData.get("title") || "").trim();
  const short = String(formData.get("short") || "").trim();
  const long = String(formData.get("long") || "").trim();
  const cat = String(formData.get("cat") || "") as GameCategory;
  const color = String(formData.get("color") || "") as Game["color"];
  const cover = String(formData.get("cover") || "");

  if (!title || !short || !long) {
    return { error: "Completa título, descripción corta y descripción larga." };
  }
  if (!GAME_CATEGORIES.includes(cat)) return { error: "Categoría inválida." };
  if (!GAME_COLORS.includes(color)) return { error: "Color inválido." };
  if (!GAME_COVERS.includes(cover as (typeof GAME_COVERS)[number])) {
    return { error: "Cover inválida." };
  }

  return { title, short, long, cat, color, cover };
}

export async function createGameAction(
  _prevState: GameFormState,
  formData: FormData,
): Promise<GameFormState> {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };

  const id = String(formData.get("id") || "").trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    return { error: "El id debe ser minúsculas, números y guiones (ej. mi-juego-nuevo)." };
  }

  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  try {
    await createGame({ id, ...parsed });
  } catch (err) {
    return { error: getErrorMessage(err, "No se pudo crear el juego.") };
  }

  revalidatePath("/admin/juegos");
  revalidatePath("/biblioteca");
  return null;
}

export async function updateGameAction(
  id: string,
  _prevState: GameFormState,
  formData: FormData,
): Promise<GameFormState> {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };

  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  try {
    await updateGame(id, parsed);
  } catch (err) {
    return { error: getErrorMessage(err, "No se pudo actualizar el juego.") };
  }

  revalidatePath("/admin/juegos");
  revalidatePath("/biblioteca");
  revalidatePath(`/juegos/${id}`);
  return null;
}

export async function deleteGameAction(id: string): Promise<{ error: string } | null> {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };

  try {
    await deleteGame(id);
  } catch (err) {
    return { error: getErrorMessage(err, "No se pudo borrar el juego.") };
  }

  revalidatePath("/admin/juegos");
  revalidatePath("/biblioteca");
  revalidatePath("/salon-de-la-fama");
  return null;
}
