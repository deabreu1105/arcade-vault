# Propuestas de juegos — Arcade Vault

Memoria del agente `game-planner` (`.claude/agents/game-planner.md`). Cada invocación reconcilia
este archivo con `GAME_RUNTIMES` (`components/games/registry.ts`) y con la tabla `games`, y después
agrega las propuestas nuevas.

Estados: `Recomendado` (ganador de su ronda) · `Sugerido` (evaluado, no ganó) · `Descartado` (falla
un eliminatorio de la rúbrica) · `Aprobado` (el usuario lo eligió) · `Implementado` (ya tiene motor
y spec).

Lo escribe el agente. Editalo a mano solo para cambiar un `Estado` — por ejemplo, marcar `Aprobado`
el juego que elegiste antes de correr `/arcade-game`.

---

## Índice

| #   | Juego | Id propuesto | Categoría | Fecha | Estado | Veredicto en una línea |
| --- | ----- | ------------ | --------- | ----- | ------ | ---------------------- |

_Sin propuestas todavía._

---

## Propuestas

_Sin propuestas todavía._

<!-- Formato de cada ficha, una por candidato evaluado (no solo el ganador):

### NN — TÍTULO (referencia clásica) · `id-propuesto`

- **Fecha:** YYYY-MM-DD · **Estado:** Recomendado · **Categoría:** ARCADE · **Color:** yellow
- **Mecánica:** qué hace el jugador, en dos o tres oraciones.
- **Encaje con el contrato:** canvas, entrada, y cómo puntúa para el Salón de la Fama.
- **Vidas / Nivel:** qué significa cada uno en el HUD.
- **Controles:** los `event.code` a capturar, y si necesita puntero.
- **Assets:** canvas puro, o qué habría que traer a `public/games/<id>/`.
- **Costo:** bajo | medio | alto — y qué lo encarece.
- **Por qué sí / por qué no:** el argumento decisivo.
- **Qué tendría que cambiar:** solo si está `Descartado`.
-->
