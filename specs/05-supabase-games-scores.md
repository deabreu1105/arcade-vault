# 05 — Supabase: catálogo de juegos y puntuaciones reales

**Estado:** Draft
**Depende de:** SPEC 01, SPEC 04
**Fecha:** 2026-08-13

**Objetivo:** Mover el catálogo de juegos (`GAMES` en `lib/data.ts`) y las puntuaciones (`av_scores` en `localStorage`) a tablas reales de Postgres en Supabase, para que Biblioteca, Detalle y Salón de la Fama muestren datos reales de usuarios reales.

## Alcance

**Dentro:**

- Tabla `games` en `public`, con seed de los juegos actuales de `lib/data.ts` incluido en la migración.
- Tabla `scores` en `public`, para registrar cada partida guardada por un usuario real (autenticado vía spec 04).
- `best` y `plays` de cada juego pasan a calcularse en tiempo real a partir de `scores` (`MAX(score)` y `COUNT(*)` por `game_id`), en vez de ser columnas fijas.
- Pantallas convertidas a Server Component para su carga inicial de datos, manteniendo Client Components solo para lo interactivo:
  - `app/biblioteca/page.tsx`: Server Component que hace el fetch de `games` (con `best`/`plays` agregados); el buscador y los chips de categoría siguen siendo un Client Component hijo que filtra sobre los datos ya cargados.
  - `app/juegos/[id]/page.tsx`: Server Component que hace el fetch del juego y de su leaderboard (top 10 de `scores` por `game_id`, con `join` a `profiles` para el nombre); `notFound()` si el `id` no existe en `games`.
  - `app/juegos/[id]/jugar/page.tsx`: sigue siendo 100% Client Component (usa `setInterval`/estado local para la simulación), pero el guardado de puntuación al terminar la partida pasa a insertar en `scores` (usuarios reales) en vez de `localStorage["av_scores"]`.
  - `app/salon-de-la-fama/page.tsx`: se reestructura como Server Component que recibe el juego activo por query param o se resuelve en un Client Component hijo que sigue controlando los tabs, consultando el leaderboard real por juego. Se elimina `seededScores` y su uso.
- Guardado de puntuación en el modal de fin de partida:
  - Si hay un usuario real de Supabase logueado: inserta en `scores` `{ user_id, game_id, score }`; el campo de "iniciales" del modal se reemplaza por el `username` del perfil (no editable), ya que el nombre se resuelve vía `profiles`.
  - Si es invitado (sin sesión real): se mantiene el comportamiento actual, exactamente igual — `saveScore` sigue escribiendo en `localStorage["av_scores"]` con el nombre/iniciales editable, y esa puntuación no aparece en el Salón de la Fama real.
- Estado vacío real en Detalle y Salón de la Fama cuando un juego no tiene filas en `scores` todavía ("Aún no hay puntuaciones para este juego. ¡Sé el primero!").
- Fila "tu mejor marca" en Salón de la Fama: se calcula con una consulta real (`MAX(score)` del usuario logueado para ese juego), no con el placeholder decorativo actual; no se muestra si el usuario no tiene ninguna puntuación real guardada para ese juego.
- `lib/data.ts` se reduce a lo que sigue siendo necesario como constante de UI: `CATS` (categorías) y los tipos `Game`/`ScoreRow` si aún aplican. `GAMES` y `seededScores` se eliminan del archivo (ya no hay mock).
- Se elimina el array `PLAYERS`, sin uso una vez removido `seededScores`.

**Fuera (no en este spec):**

- Cualquier cambio a Auth, `profiles` o al modo invitado más allá de lo ya definido en el spec 04.
- Edición/borrado de juegos desde una UI de administración — el catálogo se administra por SQL/migraciones, no hay panel de admin.
- Que el invitado guarde puntuaciones en Supabase (Anonymous Sign-in) — descartado también en el spec 04; el invitado sigue en `localStorage`.
- Anti-cheat o validación de que la puntuación insertada corresponde a una partida real jugada (la "partida" sigue siendo una simulación decorativa, spec 01).
- Realtime (actualizar el Salón de la Fama en vivo sin refrescar) y Edge Functions — planes futuros sin alcance definido.
- Paginación del leaderboard más allá de un top fijo (se define un tope de 10 filas, igual que hoy).
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`games`** (nueva tabla en `public`):
  - `id text primary key` — mismo slug usado hoy (`"bloque-buster"`, `"caida"`, etc.).
  - `title text not null`
  - `short text not null`
  - `long text not null`
  - `cat text not null` (`"ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS"`, sin enum de Postgres para no acoplar el esquema a los tipos de TS; se valida en el tipo `GameCategory` de TypeScript).
  - `cover text not null`
  - `color text not null` (`"cyan" | "magenta" | "yellow" | "green"`)
  - RLS: `select` público (`using (true)`); sin `insert`/`update`/`delete` desde el cliente (el catálogo se gestiona por migración/SQL directo).
  - Seed: la misma migración que crea la tabla inserta las filas de los juegos actuales de `lib/data.ts` (título, descripciones, categoría, cover, color), sin `best`/`plays` (esas columnas no existen en `games`, se calculan aparte).
- **`scores`** (nueva tabla en `public`):
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `game_id text not null references games(id) on delete cascade`
  - `score integer not null`
  - `created_at timestamptz not null default now()`
  - RLS: `select` público (`using (true)`, necesario para que cualquiera vea el Salón de la Fama); `insert` solo del propio usuario (`with check (auth.uid() = user_id)`); sin `update`/`delete` desde el cliente (una puntuación guardada no se edita ni se borra).
- **Vistas/consultas agregadas** (no requieren tabla nueva, solo queries desde el código):
  - `best`/`plays` por juego: `select game_id, max(score) as best, count(*) as plays from scores group by game_id`.
  - Leaderboard de un juego: `select scores.score, scores.created_at, profiles.username from scores join profiles on profiles.id = scores.user_id where game_id = $1 order by score desc limit 10`.
- **`lib/data.ts`** queda solo con `CATS: string[]` y los tipos TS que se sigan usando (`GameCategory`); se elimina `GAMES`, `PLAYERS`, `ScoreRow` (mock) y `seededScores`.
- `av_scores` en `localStorage` sigue existiendo, pero exclusivamente para el modo invitado (sin cambios respecto a spec 01/04).

## Plan de implementación

1. Escribir y aplicar la migración que crea `games` (con RLS y política `select` pública) y hace el seed de los juegos actuales copiando los valores literales de `lib/data.ts`.
2. Escribir y aplicar la migración que crea `scores` (con RLS: `select` público, `insert` solo propio).
3. Crear `lib/supabase/queries.ts` (o equivalente) con funciones tipadas: `getGames()` (con `best`/`plays` agregados), `getGame(id)`, `getLeaderboard(gameId)`, `getUserBestScore(userId, gameId)`, `insertScore({ userId, gameId, score })`.
4. Convertir `app/biblioteca/page.tsx` en Server Component que llama a `getGames()` y le pasa los datos a un Client Component hijo (`components/biblioteca/game-grid.tsx` o similar) que conserva el buscador, los chips y el efecto tilt.
5. Convertir `app/juegos/[id]/page.tsx` en Server Component que llama a `getGame(id)` (→ `notFound()` si no existe) y `getLeaderboard(id)`, renderizando portada/tags/descripción/stat strip/leaderboard con los datos reales.
6. Actualizar `app/juegos/[id]/jugar/page.tsx`: al montar, resuelve el juego con `getGame(id)` (puede seguir siendo una llamada cliente-servidor vía una Server Action o un fetch a una ruta interna, ya que el resto de la pantalla es Client Component); al guardar la puntuación, si `user` viene de Supabase (spec 04) llama a `insertScore`, si es invitado usa `saveScore` (`localStorage`) como hoy.
7. Reestructurar `app/salon-de-la-fama/page.tsx`: tabs de juego (Client Component, usa `getGames()` ya cargado o una lista liviana de `{id, title}`), leaderboard real por juego vía `getLeaderboard(gameId)`, fila "tu mejor marca" vía `getUserBestScore` solo si hay usuario real logueado. Eliminar el uso de `seededScores`.
8. Limpiar `lib/data.ts`: quitar `GAMES`, `PLAYERS`, `ScoreRow`, `seededScores`; conservar `CATS` y los tipos que sigan en uso.
9. Revisión manual en `npm run dev`: `/biblioteca` muestra los juegos reales desde la BD con `best`/`plays` correctos; jugar una partida como usuario real y guardar la puntuación la hace aparecer en `/salon-de-la-fama` para ese juego; jugar como invitado sigue guardando solo en `localStorage` sin aparecer en el Salón de la Fama real; un juego sin puntuaciones muestra el estado vacío; `npm run lint` pasa sin errores.

## Criterios de aceptación

- [ ] `/biblioteca` muestra los juegos reales desde la tabla `games`, con buscador y chips de categoría funcionando igual que antes sobre los datos reales.
- [ ] Cada tarjeta de juego muestra `best` y `plays` calculados en tiempo real desde `scores` (no columnas fijas).
- [ ] `/juegos/[id]` con un `id` inexistente en `games` muestra la página 404 de Next, igual que antes.
- [ ] `/juegos/[id]` muestra un leaderboard real (top 10 por `score` descendente) con el `username` de cada jugador, o el estado vacío si el juego no tiene puntuaciones.
- [ ] Terminar una partida logueado como usuario real y guardar la puntuación inserta una fila en `scores` con el `user_id` correcto y hace que esa puntuación aparezca en `/juegos/[id]` y `/salon-de-la-fama` para ese juego.
- [ ] Terminar una partida como invitado guarda la puntuación en `localStorage["av_scores"]` exactamente como antes de este spec, y esa puntuación NO aparece en el leaderboard real.
- [ ] `/salon-de-la-fama` permite cambiar de juego con los tabs y muestra el podio + tabla con datos reales de `scores`/`profiles`; un juego sin puntuaciones muestra el estado vacío en vez de un podio con datos falsos.
- [ ] La fila "tu mejor marca" en `/salon-de-la-fama` solo aparece si el usuario real logueado tiene al menos una puntuación guardada para el juego activo, y muestra su valor real (no un placeholder).
- [ ] `lib/data.ts` ya no exporta `GAMES`, `PLAYERS` ni `seededScores`.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **`games.id` es el slug de texto existente, no un `uuid` nuevo** — evita tocar las rutas `/juegos/[id]` y todos los enlaces internos que ya usan esos slugs; un `uuid` agregaría una columna `slug` redundante sin necesidad real en este proyecto.
- **`best`/`plays` calculados desde `scores`, no columnas fijas en `games`** — mantenerlos como columnas fijas habría preservado el mock indefinidamente (nunca se actualizarían con partidas reales), contradiciendo el objetivo de tener datos reales; el costo es una query agregada adicional por carga de Biblioteca/Detalle, aceptable a esta escala.
- **Biblioteca y Detalle pasan a Server Component para el fetch inicial** — se prioriza evitar un estado de carga visible (spinner) en la primera carga de datos que antes era síncrona (mock en memoria); se descarta mantener "todo Client Component" (decisión original del spec 01) porque esa decisión asumía datos en memoria sin latencia de red, que ya no aplica. El Reproductor se mantiene Client Component porque su estado (HUD, simulación) es inherentemente de cliente y no depende de este cambio.
- **Invitado sigue en `localStorage`, sin aparecer en el Salón de la Fama real** — decisión ya tomada en el spec 04 (invitado no usa Supabase); aquí se confirma su consecuencia: sus puntuaciones son locales al navegador y no compiten en el ranking real. Unificarlo requeriría Anonymous Sign-in, descartado en spec 04.
- **Se elimina `seededScores` en vez de mantenerlo como fallback decorativo** — una vez que existen datos reales, mezclar puntuaciones falsas con reales sería engañoso para los jugadores (un "campeón" que nunca jugó); se prefiere un estado vacío explícito y honesto.
- **Nombre del jugador en `scores` se resuelve vía `profiles.username` (join), no se duplica en la tabla** — evita datos desnormalizados que puedan desincronizarse si el usuario cambiara su username en el futuro (aunque esa feature esté fuera de alcance, no vale la pena cerrar la puerta con una duplicación innecesaria).
- **Seed de `games` incluido en la migración SQL** — se descarta dejar la tabla vacía para llenarla manualmente, porque el catálogo actual (títulos, descripciones, covers, colores) ya existe y no tiene sentido volver a escribirlo a mano fuera del control de versiones.

## Riesgos identificados

- **Queries agregadas (`best`/`plays`, leaderboard) sin índices explícitos:** con pocos juegos y puntuaciones el rendimiento no es un problema, pero si el volumen de `scores` crece significativamente convendría un índice en `scores(game_id, score desc)`; no se agrega en este spec por no ser necesario a esta escala.
- **Cambio de Client a Server Component en Biblioteca/Detalle:** requiere separar cuidadosamente qué queda como Server (fetch) y qué queda como Client (interactividad); un error aquí podría romper el buscador/chips o el efecto tilt si se pasan mal los datos entre el Server Component y su hijo Client.
- **Cobertura del RLS de `scores`:** si la política de `insert` (`auth.uid() = user_id`) no se aplica correctamente, un usuario autenticado podría intentar insertar puntuaciones a nombre de otro `user_id`; se verifica manualmente en la revisión del paso 9.
