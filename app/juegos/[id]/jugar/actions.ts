"use server";

import { getGame, insertScore } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function getGameForPlay(id: string) {
  return getGame(id);
}

export async function saveRealScoreAction({ gameId, score }: { gameId: string; score: number }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await insertScore({ userId: user.id, gameId, score });
}
