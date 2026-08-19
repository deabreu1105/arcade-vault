# 07 — Panel de administración de juegos

**Estado:** Implementado
**Depende de:** SPEC 04, SPEC 05
**Fecha:** 2026-08-17

**Objetivo:** Agregar una ruta protegida `/admin/juegos` donde un usuario marcado como administrador puede crear, editar y borrar filas de la tabla `games`, reemplazando la gestión actual por SQL/migraciones manuales.

## Alcance

**Dentro:**

- Columna `is_admin boolean not null default false` en `profiles` (spec 04), agregada vía migración.
- La misma migración marca `is_admin = true` para el perfil correspondiente al usuario con email `daniel.abreu@esourcecapital.com` en `auth.users` (si ya existe esa cuenta al aplicar la migración).
- Políticas RLS nuevas en `games` para `insert`/`update`/`delete`, restringidas a usuarios cuyo `profiles.is_admin` sea `true` (vía subquery/join a `profiles` usando `auth.uid()`). La política `select` pública existente no cambia.
- Ruta `app/admin/juegos/page.tsx` (Server Component): verifica sesión real de Supabase y `is_admin`; si no hay sesión o el usuario no es admin, responde con `notFound()` (no revela que la ruta existe). Si es admin, renderiza la tabla de juegos existentes con acciones de editar/borrar y un botón para crear uno nuevo.
- Formulario de creación/edición (`components/admin/game-form.tsx`, Client Component) con los campos de `games`: `id` (solo en creación, texto libre validado como slug), `title`, `short`, `long`, selector de `cat` (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`), selector de `color` (`cyan`/`magenta`/`yellow`/`green`), selector de `cover` (las 9 clases ya definidas en `globals.css`: `cover-asteroides`, `cover-bricks`, `cover-duelo`, `cover-glot`, `cover-invaders`, `cover-rana`, `cover-rocas`, `cover-snake`, `cover-tetro`). En modo edición, `id` se muestra de solo lectura.
- Server Actions en `app/admin/juegos/actions.ts`: `createGameAction`, `updateGameAction`, `deleteGameAction`. Cada una vuelve a verificar `is_admin` del usuario autenticado antes de mutar (no confía solo en el gate de la página ni solo en RLS).
- Confirmación de borrado: un diálogo (`window.confirm` o modal simple) que menciona explícitamente que las puntuaciones (`scores`) asociadas a ese juego también se borrarán (por el `on delete cascade` ya existente de spec 05), antes de ejecutar `deleteGameAction`.
- Funciones nuevas en `lib/supabase/queries.ts` (o archivo equivalente): `isCurrentUserAdmin()`, `createGame(input)`, `updateGame(id, input)`, `deleteGame(id)`.
- Validación de `id` nuevo: minúsculas, números y guiones únicamente (mismo patrón que los slugs existentes: `bloque-buster`, `duelo-pixel`); si ya existe un juego con ese `id`, el insert falla por la PK y el formulario muestra el error de Postgres tal cual (sin mensaje custom).

**Fuera (no en este spec):**

- Panel de administración de `scores` (ver/editar/borrar puntuaciones) — explícitamente descartado para este spec, según lo acordado.
- UI para gestionar quién es admin (agregar/quitar `is_admin` a otras cuentas) — se hace a mano por SQL si hace falta un segundo admin en el futuro.
- Enlace de navegación a `/admin/juegos` en `components/nav.tsx` — la ruta se accede escribiendo la URL directamente; no se modifica la navegación pública ni el `SessionUser`/`auth-provider.tsx` para exponer `is_admin` al resto de la UI.
- Reordenar o renombrar el `id` de un juego ya creado — permanece fijo tras la creación (ver Decisiones).
- Subida de imágenes de portada o creación de nuevas clases `cover-*` desde el panel — el selector solo ofrece las 9 clases ya definidas en `globals.css`; una cover nueva se sigue agregando a mano en CSS, fuera de este spec.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`profiles`** (tabla existente de spec 04): se agrega una columna vía migración:
  ```sql
  alter table profiles add column is_admin boolean not null default false;

  update profiles set is_admin = true
  where id = (select id from auth.users where email = 'daniel.abreu@esourcecapital.com');
  ```
- **`games`** (tabla existente de spec 05, sin cambios de columnas): se agregan políticas RLS nuevas:
  ```sql
  create policy "admins can insert games" on games
    for insert
    with check (
      exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
    );

  create policy "admins can update games" on games
    for update
    using (
      exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
    );

  create policy "admins can delete games" on games
    for delete
    using (
      exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
    );
  ```
- **Constantes de UI nuevas** (en `lib/data.ts` o junto al formulario): lista fija de covers válidas, reutilizando/extrayendo el mismo conjunto de 9 clases que ya existen en `app/globals.css`.
- No se agregan tablas nuevas. `scores` no se toca en este spec.

## Plan de implementación

1. Escribir y aplicar la migración: columna `is_admin` en `profiles`, marcado del admin inicial por email, y las tres políticas RLS de `insert`/`update`/`delete` en `games`. Verificar con una consulta manual que el perfil de `daniel.abreu@esourcecapital.com` quedó con `is_admin = true`.
2. Agregar `isCurrentUserAdmin()`, `createGame`, `updateGame`, `deleteGame` a `lib/supabase/queries.ts`.
3. Crear `app/admin/juegos/page.tsx`: Server Component que llama a `isCurrentUserAdmin()`; si es `false` o no hay sesión, `notFound()`; si es `true`, llama a `getGames()` y renderiza la lista con botones de editar/borrar y un botón "Nuevo juego".
4. Crear `components/admin/game-form.tsx`: formulario controlado con los selectores de `cat`/`color`/`cover` y los campos de texto, reutilizable para creación (todos los campos vacíos, `id` editable) y edición (precargado, `id` de solo lectura).
5. Crear `app/admin/juegos/actions.ts` con `createGameAction`/`updateGameAction`/`deleteGameAction`, cada una revalidando `is_admin` antes de llamar a las funciones de `queries.ts`, y usando `revalidatePath("/admin/juegos")` y `revalidatePath("/biblioteca")` tras cada mutación exitosa.
6. Conectar el formulario y el diálogo de confirmación de borrado a las Server Actions desde `app/admin/juegos/page.tsx` (o un Client Component hijo que reciba la lista de juegos por props).
7. Revisión manual en `npm run dev`: entrar a `/admin/juegos` sin sesión (ver 404), entrar logueado como usuario no-admin (ver 404), entrar logueado como `daniel.abreu@esourcecapital.com` (ver el panel), crear un juego de prueba con cada selector, verlo aparecer en `/biblioteca`, editarlo (confirmar que `id` no es editable), borrarlo (confirmar el aviso de cascada y que desaparece de `/biblioteca`). Verificar que `npm run lint` pasa sin errores.

## Criterios de aceptación

- [x] Un usuario sin sesión que visita `/admin/juegos` recibe la página 404 de Next.
- [x] Un usuario autenticado con `is_admin = false` que visita `/admin/juegos` recibe la página 404 de Next.
- [x] El usuario admin tiene `is_admin = true` tras la migración/marcado manual y puede ver `/admin/juegos`. El email `daniel.abreu@esourcecapital.com` no existía como cuenta real en este proyecto de Supabase (riesgo previsto en este spec); se marcó `daniel@dominio.com` como admin inicial en su lugar.
- [x] Crear un juego nuevo desde el formulario inserta una fila en `games` y esa fila aparece de inmediato en `/biblioteca` con el cover/color/categoría elegidos.
- [x] Editar un juego existente actualiza sus campos (`title`, `short`, `long`, `cat`, `cover`, `color`) sin permitir cambiar su `id`.
- [x] Borrar un juego muestra una confirmación que menciona el borrado en cascada de sus puntuaciones antes de ejecutar el delete.
- [x] Borrar un juego elimina la fila de `games` (y en cascada sus filas de `scores`) y el juego deja de aparecer en `/biblioteca`, `/juegos/[id]` y `/salon-de-la-fama`.
- [x] Intentar crear un juego con un `id` ya existente muestra el error de Postgres sin romper la página.
- [x] Un usuario no-admin autenticado que intente llamar directamente a `createGameAction`/`updateGameAction`/`deleteGameAction` (o hacer un insert/update/delete directo contra `games` vía API de Supabase) es rechazado por RLS.
- [x] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Rol de admin vía columna `is_admin` en `profiles`, no una tabla de roles separada** — con un solo rol necesario (admin de juegos) una tabla `roles`/`user_roles` sería sobreingeniería; si en el futuro se necesitan más roles, se migra entonces.
- **Migración marca el admin inicial por email hardcodeado** — se descarta dejar la columna en `false` para todos y requerir un UPDATE manual posterior, porque el email de la cuenta admin ya se conoce; simplifica la puesta en marcha a costa de tener un email fijo en la migración (aceptable, es información propia del entorno de desarrollo).
- **`notFound()` en vez de redirect a `/login` o `/biblioteca`** — no revela si la ruta existe o si el usuario simplemente no es admin, igual de opaco para ambos casos; consistente con el uso de `notFound()` ya existente en `/juegos/[id]` (spec 05) para ids inexistentes.
- **`id` fijo tras la creación** — cambiarlo rompería enlaces existentes (`/juegos/[id]`) y las filas de `scores` que lo referencian por `game_id`; no se agrega `on update cascade` a la FK para esto.
- **Selectores cerrados para `cat`, `color` y `cover`, sin texto libre** — evita crear juegos con una categoría/color no soportado por la UI existente o una clase `cover-*` inexistente en CSS, lo que dejaría la tarjeta del juego rota visualmente en `/biblioteca`.
- **Doble capa de seguridad: RLS en `games` + chequeo de `is_admin` en las Server Actions** — RLS protege contra cualquier llamada directa a Supabase (bypaseando la UI), y el chequeo en la Server Action evita depender únicamente del mensaje de error de Postgres para dar una respuesta clara en la propia acción.
- **Sin enlace de navegación al panel** — se accede solo por URL directa; agregar un link visible solo para admins requeriría exponer `is_admin` en `SessionUser`/`auth-provider.tsx`, un cambio no solicitado para este spec.
- **Sin panel de administración de `scores` en este spec** — decisión explícita del usuario; borrar/editar puntuaciones queda para un spec futuro si hace falta.

## Riesgos identificados

- **Email hardcodeado en la migración:** si la cuenta `daniel.abreu@esourcecapital.com` todavía no existe en `auth.users` al aplicar la migración, el `update` no marca a nadie como admin y el panel queda inaccesible hasta correr un `update` manual; se verifica en el paso 1 del plan.
- **Único admin sin UI para agregar más:** si esa cuenta se pierde o se necesita un segundo admin, la única vía es un `update` SQL manual directo contra Supabase — aceptado porque una UI de gestión de roles está fuera de alcance.
- **`notFound()` para usuarios no-admin autenticados:** alguien que sepa que existe `/admin/juegos` pero no sea admin ve una 404 idéntica a la de una ruta inexistente; no hay mensaje de "no tenés permisos", lo cual es intencional pero podría confundir a un admin legítimo que no inició sesión (se resuelve iniciando sesión primero).
