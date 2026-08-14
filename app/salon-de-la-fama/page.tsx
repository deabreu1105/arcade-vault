import Link from "next/link";
import { getGames, getLeaderboard, getUserBestScore, getUsername } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function HallOfFamePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game: gameParam } = await searchParams;
  const games = await getGames();
  const activeGame = games.find((g) => g.id === gameParam) ?? games[0];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rows, youBest, youName] = await Promise.all([
    getLeaderboard(activeGame.id),
    user ? getUserBestScore(user.id, activeGame.id) : Promise.resolve(null),
    user ? getUsername(user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon-de-la-fama?game=${g.id}`}
            className={"chip" + (g.id === activeGame.id ? " active" : "")}
          >
            {g.title}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
          <div
            className="pixel"
            style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}
          >
            AÚN NO HAY PUNTUACIONES
          </div>
          <div>Aún no hay puntuaciones para este juego. ¡Sé el primero!</div>
        </div>
      ) : (
        <>
          <div className="podium">
            {rows[1] && (
              <div className="podium-slot silver">
                <div className="rank-num">02</div>
                <div className="name">{rows[1].username}</div>
                <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
                <div className="date">
                  {new Date(rows[1].createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
            )}
            <div className="podium-slot gold">
              <div
                className="pixel"
                style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}
              >
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                01
              </div>
              <div className="name">{rows[0].username}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {rows[0].score.toLocaleString("es-ES")}
              </div>
              <div className="date">{new Date(rows[0].createdAt).toLocaleDateString("es-ES")}</div>
            </div>
            {rows[2] && (
              <div className="podium-slot bronze">
                <div className="rank-num">03</div>
                <div className="name">{rows[2].username}</div>
                <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
                <div className="date">
                  {new Date(rows[2].createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
            )}
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.username + i}
                className={"tr" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">{r.username}</div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                <div className="dt">{new Date(r.createdAt).toLocaleDateString("es-ES")}</div>
              </div>
            ))}
            {user && youBest !== null && (
              <>
                <div className="tr you-label">▸ TU MEJOR MARCA EN {activeGame.title}</div>
                <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
                  <div className="rk" style={{ color: "var(--yellow)" }}>
                    —
                  </div>
                  <div className="pl" style={{ color: "var(--yellow)" }}>
                    {youName}
                  </div>
                  <div
                    className="sc"
                    style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}
                  >
                    {youBest.toLocaleString("es-ES")}
                  </div>
                  <div className="dt"></div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
