# 04 — Supabase: setup y autenticación real

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-08-13

**Objetivo:** Configurar el cliente de Supabase en el proyecto e implementar autenticación real (email + password) que reemplace el login/registro falso actual, manteniendo el modo invitado tal como funciona hoy.

## Alcance

**Dentro:**

- Cliente de Supabase para Next.js App Router: cliente de navegador (`lib/supabase/client.ts`), cliente de servidor para Server Components/Server Actions (`lib/supabase/server.ts`), y helper de middleware (`lib/supabase/middleware.ts`) siguiendo el paquete `@supabase/ssr`.
- `proxy.ts` en la raíz del proyecto (ver nota de implementación) que refresca la sesión de Supabase en cada request (patrón estándar de `@supabase/ssr`).
- Tabla `profiles` en Postgres: `id uuid` (PK, FK a `auth.users.id`), `username text`, `created_at timestamptz default now()`.
  - RLS habilitado: cualquiera autenticado o anónimo puede hacer `select` (el Salón de la Fama de specs futuros necesitará leer nombres públicos); solo el propio usuario puede `update` su fila (`auth.uid() = id`); no se permite `insert`/`delete` desde el cliente.
  - Trigger `on_auth_user_created` en `auth.users` (`after insert`) que ejecuta una función `handle_new_user()` para crear automáticamente la fila en `profiles`, tomando el username de `raw_user_meta_data->>'username'` (enviado desde el signup).
- Server Actions en `app/login/actions.ts`: `signUpAction` (crea el usuario en Supabase Auth con `email`, `password`, y `username` en `options.data`) y `signInAction` (`email`, `password`), ambas usando el cliente de servidor, con `redirect("/biblioteca")` en éxito y devolviendo `{ error: string }` en fallo (credenciales inválidas, email ya registrado, etc.).
- Server Action `signOutAction` que cierra la sesión real de Supabase.
- Actualizar `app/login/page.tsx`: el formulario de "Iniciar sesión"/"Crear cuenta" pasa a invocar los Server Actions (usando `useActionState`/`useFormState` de React 19 para mostrar el error debajo del formulario), en vez de llamar a `login()` del contexto directamente. El botón "Jugar como invitado" y los botones sociales de Google/GitHub se mantienen exactamente igual que hoy (decorativos, sin funcionalidad).
- Actualizar `components/auth-provider.tsx` para unificar dos fuentes de sesión:
  - **Invitado:** exactamente el comportamiento actual (`localStorage["av_user"]`, `login(null)` al pulsar "Jugar como invitado").
  - **Usuario real de Supabase:** el provider se suscribe a `supabase.auth.onAuthStateChange` (cliente de navegador) y, cuando hay sesión, resuelve el `username` desde `profiles` para exponer `{ name: username }` con la misma forma que hoy (`SessionUser`), de modo que `components/nav.tsx` no necesita cambios.
  - `logout()` pasa a detectar si la sesión activa es de Supabase (llama a `signOutAction` y redirige) o de invitado (limpia `localStorage` como hoy).
- Variables de entorno nuevas en `.env.template`: `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (documentadas sin valores reales; `SUPABASE_DB_PASSWORD` ya existe en el archivo).
- Dependencias nuevas: `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- Configuración manual (fuera de git, documentada en el spec): desactivar "Confirm email" en la configuración de Auth del proyecto de Supabase, para permitir login inmediato tras el registro.

**Fuera (no en este spec):**

- Tablas `games` y `scores`, y la migración del catálogo de juegos (`lib/data.ts`) y de `saveScore`/`av_scores` a Postgres — spec futuro (Spec B, depende de este).
- OAuth real con Google/GitHub — los botones sociales siguen siendo decorativos.
- Recuperación de contraseña ("olvidé mi contraseña"), cambio de email o de username desde la UI.
- Roles, permisos de administrador o cualquier RBAC.
- Realtime y Edge Functions — mencionados como planes futuros del proyecto, sin alcance definido todavía.
- Unificar el modo invitado bajo Supabase (ej. Anonymous Sign-in) — el invitado se mantiene 100% en `localStorage`, sin tocar Supabase.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

- **`profiles`** (nueva tabla en `public`):
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `username text not null`
  - `created_at timestamptz not null default now()`
  - RLS: `select` para todos (`using (true)`); `update` solo del propio usuario (`using (auth.uid() = id)`); sin políticas de `insert`/`delete` para el cliente (la fila se crea solo vía el trigger, que corre con privilegios de la función).
- **Función + trigger `handle_new_user`**: `security definer`, inserta en `profiles (id, username)` usando `new.id` y `new.raw_user_meta_data->>'username'` cuando se inserta una fila en `auth.users`.
- **`SessionUser`** (tipo existente en `components/auth-provider.tsx`, sin cambios de forma): `{ name: string } | null`. Ahora puede originarse de un usuario invitado (`localStorage`) o de un usuario real de Supabase (resuelto vía `profiles.username`).
- No se toca `lib/data.ts` (`GAMES`, `PLAYERS`, `seededScores`) ni `av_scores` — quedan para el spec futuro de datos.

## Plan de implementación

1. Agregar `@supabase/supabase-js` y `@supabase/ssr` a `package.json` (`npm install`).
2. Agregar `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` a `.env.template`; completar `.env.local` con los valores reales del proyecto de Supabase ya conectado.
3. Crear `lib/supabase/client.ts` (browser client con `createBrowserClient`), `lib/supabase/server.ts` (server client con `createServerClient` y manejo de cookies vía `next/headers`), y `lib/supabase/middleware.ts` (helper `updateSession` que refresca cookies).
4. Crear `proxy.ts` en la raíz que llama al helper de `lib/supabase/middleware.ts` en cada request (excluyendo assets estáticos).
5. Aplicar la migración de base de datos (tabla `profiles`, políticas RLS, función y trigger `handle_new_user`) contra el proyecto de Supabase conectado.
6. Desactivar manualmente "Confirm email" en la configuración de Auth del proyecto de Supabase (paso de configuración, no de código).
7. Crear `app/login/actions.ts` con `signUpAction`, `signInAction` y `signOutAction` como Server Actions, usando el cliente de servidor.
8. Actualizar `app/login/page.tsx`: conectar el formulario a los Server Actions con `useActionState`, mostrar el error devuelto debajo del formulario, mantener el botón de invitado y los botones sociales decorativos sin cambios.
9. Actualizar `components/auth-provider.tsx` para resolver la sesión real de Supabase (cliente de navegador + `onAuthStateChange` + lectura de `profiles`) y unificarla con el estado de invitado existente, ajustando `logout()` para manejar ambos casos.
10. Revisión manual en `npm run dev`: registrar un usuario nuevo (verificar fila creada en `profiles`), cerrar sesión, iniciar sesión con esas credenciales, refrescar la página (la sesión debe persistir), jugar como invitado (debe seguir funcionando igual que antes), y verificar que `npm run lint` pasa sin errores.

## Criterios de aceptación

- [x] `proxy.ts` refresca la sesión de Supabase en cada request sin romper la navegación existente.
- [x] Registrar una cuenta nueva desde `/login` (tab "Crear cuenta") crea el usuario en Supabase Auth y una fila correspondiente en `profiles` con el `username` ingresado, sin requerir confirmación de correo.
- [x] Tras registrarse, la sesión queda iniciada de inmediato y la navegación redirige a `/biblioteca`.
- [x] Iniciar sesión con credenciales válidas desde el tab "Iniciar sesión" redirige a `/biblioteca`; con credenciales inválidas muestra un mensaje de error en el formulario sin recargar la página.
- [x] El nav muestra el `username` del usuario autenticado (igual que hoy muestra `user.name`) y permite cerrar sesión.
- [x] Cerrar sesión de un usuario real invalida la sesión de Supabase (no solo el estado del cliente) y vuelve a mostrar el botón "Iniciar Sesión".
- [x] "Jugar como invitado" sigue funcionando exactamente igual que antes de este spec (sin pasar por Supabase).
- [x] Refrescar la página con una sesión real activa mantiene al usuario logueado (la sesión sobrevive al refresh gracias al proxy).
- [x] Los botones sociales (Google/GitHub) siguen siendo decorativos, sin funcionalidad ni errores al hacer click.
- [x] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **División en dos specs (setup+Auth aquí; games/scores en un spec futuro)** — se descarta un spec único porque cubriría Auth, esquema de `games`, esquema de `scores` y RLS de cada uno; dividir permite revisar e implementar Auth de forma aislada antes de tocar el resto de los datos.
- **Server Actions en vez de API Routes o Client SDK directo** — es el patrón recomendado actualmente por Supabase para Next.js App Router con `@supabase/ssr`; maneja las cookies de sesión server-side sin exponer lógica de Auth al cliente, a diferencia del patrón de API Route usado en el spec 03 para contacto (ahí no había sesión que gestionar).
- **Trigger de base de datos para crear `profiles`, no insert manual desde el cliente** — garantiza que todo usuario en `auth.users` tenga su fila en `profiles` sin depender de que el código del cliente complete ese paso; evita usuarios "huérfanos" si el insert manual falla después de un signup exitoso.
- **Solo `username` en `profiles`, sin avatar** — no se pide avatar en el flujo de registro actual (el formulario solo tiene usuario/correo/contraseña); agregar el campo ahora sería especular sobre una feature no solicitada.
- **Invitado 100% en `localStorage`, sin Supabase Anonymous Sign-in** — se mantiene el comportamiento actual del modo invitado sin cambios, evitando acoplarlo a Supabase antes de que haya un motivo real (ej. necesitar que el invitado también persista puntuaciones en Postgres, que es parte del spec futuro de datos).
- **Confirmación de email desactivada** — para un MVP de esta naturaleza, exigir confirmación de correo agregaría un paso de fricción y estado de UI ("revisa tu correo") no solicitado; se puede activar más adelante si el proyecto lo requiere.
- **Botones sociales decorativos se mantienen sin cambios** — implementar OAuth real de Google/GitHub queda fuera de alcance (ya decidido en la fase de preguntas); ocultarlos ahora sería un cambio visual no solicitado.
- **RLS de `profiles` permite `select` público** — los nombres de usuario deben poder mostrarse en el Salón de la Fama (spec futuro) sin requerir que el visitante esté autenticado; no se expone ningún otro dato sensible en esta tabla.
- **`proxy.ts` en vez de `middleware.ts`** — hallazgo durante la implementación: esta versión del proyecto usa Next.js 16, donde `middleware.ts` está deprecado y renombrado a `proxy.ts` (misma funcionalidad, export `middleware()` → `proxy()`). Se usa `proxy.ts` para evitar el warning de deprecación; el helper interno `lib/supabase/middleware.ts` conserva ese nombre porque no es un archivo de convención de Next.js, solo una función auxiliar.
- **Tab "Iniciar sesión" pasa a pedir Correo + Contraseña (ya no "Usuario")** — hallazgo durante la implementación: Supabase Auth identifica la cuenta por email, no por username, y no hay forma segura de mapear username→email desde el cliente sin exponer emails de otros usuarios. Se ajustó el formulario para pedir correo en el login, manteniendo "Usuario" solo en el registro.
- **Revocado `EXECUTE` público sobre `handle_new_user()`** — el advisor de seguridad de Supabase detectó que la función `security definer` era invocable como RPC público (`/rest/v1/rpc/handle_new_user`) por `anon`/`authenticated`, permitiendo insertar filas arbitrarias en `profiles`. Se revocó el permiso para `anon`, `authenticated` y `public`; el trigger sigue funcionando porque no depende de ese grant.
- **Resincronización de sesión por cambio de ruta en `auth-provider.tsx`** — hallazgo durante la prueba en vivo: tras un login/signup vía Server Action, Next.js hace una navegación "soft" (sin recargar la página) y el cliente de navegador de Supabase no se enteraba de la nueva sesión hasta un refresh manual, porque el sign-in ocurrió en un cliente de servidor distinto y `onAuthStateChange` no se dispara solo. Se agregó una resincronización con `supabase.auth.getUser()` (valida contra el servidor de Auth) disparada en cada cambio de `pathname`, además de la suscripción a `onAuthStateChange` ya prevista.

## Riesgos identificados

- **Migración de Auth de mock a real es un cambio de comportamiento visible:** cualquier "usuario" creado antes de este spec (nunca existió como fila real) no tiene equivalente en Supabase; no hay migración de datos porque no había datos reales que migrar.
- **Middleware mal configurado puede bloquear rutas:** si el `matcher` del middleware no excluye correctamente los assets estáticos, podría degradar el rendimiento o interferir con rutas públicas; se verifica manualmente en el paso 10 del plan.
- **Dependencia de configuración manual en el dashboard de Supabase** (desactivar confirmación de email): si no se aplica en el entorno de destino, el registro quedará bloqueado hasta confirmar el correo, rompiendo el criterio de "login inmediato".
