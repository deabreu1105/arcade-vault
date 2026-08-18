import { notFound } from "next/navigation";
import { AdminGamesClient } from "@/components/admin/admin-games-client";
import { getGames, isCurrentUserAdmin } from "@/lib/supabase/queries";

export default async function AdminGamesPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) notFound();

  const games = await getGames();

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>
      <h1 className="neon-cyan">ADMIN · JUEGOS</h1>
      <AdminGamesClient games={games} />
    </div>
  );
}
