import { GameGrid } from "@/components/biblioteca/game-grid";
import { getGames } from "@/lib/supabase/queries";

export default async function BibliotecaPage() {
  const games = await getGames();

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <GameGrid games={games} />
    </div>
  );
}
