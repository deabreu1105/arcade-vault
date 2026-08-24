# 01 — Frogger: fila en el catálogo y cover CSS

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-08-24
**Origen:** game-jam — tema «Frogger: cruza la carretera y el río sin convertirte en papilla»

Agregar `frogger` como fila nueva en `games` con su cover propio, dejando intacta la fila
decorativa `ranaria` que ya cubre esta ficción en el catálogo.

## Alcance

**Dentro:**

- La fila nueva en `games`: `id = "frogger"`, `title = "FROGGER"`, `cat = "ARCADE"`,
  `color = "yellow"`, `cover = "cover-frogger"`, con `short`/`long` redactados en este spec.
- La clase `.cover-frogger` nueva en `app/globals.css`.
- El alta de la cadena `"cover-frogger"` en `GAME_COVERS` (`lib/data.ts`).

**Fuera:**

- El motor real (`components/games/frogger/engine.ts`) y su entrada en `GAME_RUNTIMES` — eso es el
  spec `02-frogger-motor.md`. Hasta que ese spec se implemente, `/juegos/frogger/jugar` sigue
  mostrando la simulación decorativa `.game-arena`, igual que cualquier fila sin motor.
- Tocar o reemplazar la fila decorativa `ranaria` existente (`cover-rana`, ARCADE, green) — queda
  en el catálogo tal cual, mismo criterio que las specs 06, 09 y 10 aplicaron con `rocas`,
  `bloque-buster` y `serpentina`.
- Controles táctiles/móviles.
- Anti-cheat o validación de que la puntuación corresponde a una partida real.
- Cualquier cambio a otro juego del catálogo, real o decorativo.

## Modelo de datos

```sql
insert into games (id, title, short, long, cat, cover, color)
values (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río salto a salto sin convertirte en papilla.',
  'Movete con las flechas para saltar de carril en carril: esquiva el tráfico, después subite a
   troncos y tortugas para no ahogarte en el río, y llená los cinco nidos de la orilla para subir de
   nivel. Cada choque, cada zambullida en el agua o caer fuera de la pantalla te cuesta una vida; la
   puntuación crece con cada avance nuevo, cada nido ocupado y cada tablero completado.',
  'ARCADE',
  'cover-frogger',
  'yellow'
);
```

No se agregan columnas ni tablas nuevas. Una partida de `frogger` guarda una fila igual que
cualquier otro juego (`{ user_id, game_id: "frogger", score }`) en `scores`, vía la
`insertScore` genérica de `lib/supabase/queries.ts`. El motor no necesita callbacks adicionales a
los ya definidos en `EngineCallbacks` (`components/games/engine-base.ts`).

## Plan de implementación

1. Escribir y aplicar la migración `add_game_frogger` con el `insert` de arriba. Verificar en
   `/biblioteca` que la tarjeta "FROGGER" aparece junto a `ranaria`, sin reemplazarla.
2. Invocar `/frontend-design` para diseñar `.cover-frogger` en `app/globals.css`: fondo con
   gradiente oscuro en el tinte amarillo/ámbar del juego (asfalto nocturno); una capa `::after` con
   varias franjas de `linear-gradient` que representen los carriles de la carretera (gris oscuro) y
   del río (azul/cian oscuro), separadas por una franja verde para la mediana y el borde superior de
   nidos, todo con `filter: drop-shadow(...)` en amarillo neón para el brillo; y una capa `::before`
   con el glifo `🐸` (o un carácter geométrico si el emoji no encaja con el resto del catálogo,
   decidible en el momento del diseño) centrado sobre la franja inferior, con `text-shadow` a
   juego. Diferenciarla claramente de `.cover-rana` (la decorativa existente para `ranaria`) en
   paleta y composición.
3. Agregar `"cover-frogger"` a `GAME_COVERS` en `lib/data.ts`.
4. Verificación manual: `/biblioteca` muestra la tarjeta nueva filtrable por `ARCADE`,
   `/juegos/frogger` muestra la ficha con leaderboard vacío, y `/admin/juegos` acepta
   `cover-frogger` como valor válido de cover al editar o crear la fila.

## Criterios de aceptación

- [ ] `/biblioteca` muestra la tarjeta "FROGGER" con su cover amarillo, buscable y filtrable por
      categoría `ARCADE`, sin ocultar ni alterar la tarjeta "RANARIA".
- [ ] `/juegos/frogger` muestra la ficha del juego con la descripción de arriba y un leaderboard
      real vacío.
- [ ] `/juegos/frogger/jugar` sigue mostrando la simulación decorativa `.game-arena` (esperado:
      todavía no hay entrada en `GAME_RUNTIMES`).
- [ ] `/admin/juegos` permite crear o editar una fila con `cover = "cover-frogger"` sin rechazo de
      validación.
- [ ] Los demás juegos del catálogo, reales y decorativos (incluido `ranaria`), no cambian de
      comportamiento ni de datos.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Fila nueva (`frogger`) en vez de reutilizar `ranaria`** — mismo criterio que specs 06, 09 y 10
  con `rocas`, `bloque-buster` y `serpentina`: nunca editar una fila decorativa existente para
  convertirla en el juego real; `ranaria` queda intacta y sigue mostrando su simulación.
- **Color `yellow`** — entre los cuatro juegos reales actuales (`asteroides` cyan, `tetris` cyan,
  `arkanoid` magenta, `snake` green), ningún color es `yellow`; se elige para diversificar la
  paleta de la fila de "juegos reales" sin repetir el color de `ranaria` (`green`), que ya está
  tomado por `snake`.
- **Categoría `ARCADE`** — es la clasificación clásica del género (saltos y esquive, sin disparo ni
  puzzle de piezas) y la misma que ya usa `ranaria`; no se fuerza a `VERSUS` ni a otra categoría
  vacía solo por diversidad, porque forzar la categoría traicionaría la mecánica real del juego.
