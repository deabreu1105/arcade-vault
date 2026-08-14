import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/data";

export type GameWithStats = Game & { best: number; plays: number };

export type LeaderboardEntry = {
  username: string;
  score: number;
  createdAt: string;
};

export async function getGames(): Promise<GameWithStats[]> {
  const supabase = await createClient();

  const [{ data: games, error: gamesError }, { data: scores, error: scoresError }] =
    await Promise.all([
      supabase.from("games").select("*").order("title"),
      supabase.from("scores").select("game_id, score"),
    ]);

  if (gamesError) throw gamesError;
  if (scoresError) throw scoresError;

  const statsByGameId = new Map<string, { best: number; plays: number }>();
  for (const row of scores ?? []) {
    const current = statsByGameId.get(row.game_id) ?? { best: 0, plays: 0 };
    current.best = Math.max(current.best, row.score);
    current.plays += 1;
    statsByGameId.set(row.game_id, current);
  }

  return (games ?? []).map((game) => ({
    ...game,
    best: statsByGameId.get(game.id)?.best ?? 0,
    plays: statsByGameId.get(game.id)?.plays ?? 0,
  }));
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}

export async function getGameStats(gameId: string): Promise<{ best: number; plays: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("scores").select("score").eq("game_id", gameId);

  if (error) throw error;

  const scores = data ?? [];
  return {
    best: scores.reduce((max, row) => Math.max(max, row.score), 0),
    plays: scores.length,
  };
}

export async function getLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("user_id, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(10);

  if (scoresError) throw scoresError;
  if (!scores || scores.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      "id",
      scores.map((row) => row.user_id),
    );

  if (profilesError) throw profilesError;

  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return scores.map((row) => ({
    username: usernameById.get(row.user_id) ?? "???",
    score: row.score,
    createdAt: row.created_at,
  }));
}

export async function getUserBestScore(userId: string, gameId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.score ?? null;
}

export async function getUsername(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.username ?? null;
}

export async function insertScore({
  userId,
  gameId,
  score,
}: {
  userId: string;
  gameId: string;
  score: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ user_id: userId, game_id: gameId, score });

  if (error) throw error;
}
