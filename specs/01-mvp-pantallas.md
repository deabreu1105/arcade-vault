# 01 — MVP de pantallas visuales de Arcade Vault

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-08-11

**Objetivo:** Implementar en Next.js (App Router) todas las pantallas visuales de `references/templates/` (Biblioteca, Detalle de juego, Reproductor, Login y Salón de la Fama), con navegación, datos mock y persistencia en `localStorage`, sin implementar la lógica real de ningún juego.

## Alcance

**Dentro:**

- Layout raíz con fondo (grid perspectiva + scanlines + ruido), fuentes pixel/mono y `Nav` con menú responsive (desktop + panel móvil).
- Pantalla **Biblioteca** (`/`): hero, buscador, chips de categoría, grid de tarjetas de juego con tilt al hover.
- Pantalla **Detalle de juego** (`/juegos/[id]`): portada, tags, descripción, stat strip, acciones ("Jugar ahora" / "Volver al vault") y leaderboard lateral.
- Pantalla **Reproductor** (`/juegos/[id]/jugar`): HUD (jugador, puntuación, vidas, nivel), "CRT" con escena decorativa animada por CSS, controles de pausa/fin, y modal de fin de partida con guardado de puntuación.
  - La simulación de partida (puntuación autoincremental, subida de nivel, pausa) se replica igual que en el template — es una animación decorativa, no un juego jugable.
- Pantalla **Login** (`/login`): tabs "Iniciar sesión" / "Crear cuenta", formulario (sin validación real), botón de invitado, botones sociales decorativos (Google/GitHub, no funcionales).
- Pantalla **Salón de la Fama** (`/salon-de-la-fama`): tabs por juego, podio top 3, tabla de puntuaciones, fila "tu mejor marca" si hay sesión.
- Estado de sesión (usuario logueado o invitado) y guardado de puntuaciones en `localStorage`, compartido entre pantallas vía un contexto de React en el layout.
- Datos de juegos y jugadores como mocks estáticos en TypeScript (equivalentes a `data.jsx`).
- Estilos: se porta `styles.css` casi literal a `app/globals.css` (variables, clip-paths, keyframes, clases `.btn`, `.card`, `.pixel`, etc.), conservando el look neón/pixel-art. Tailwind se usa solo para utilidades de layout donde haga falta, no para rehacer el sistema visual existente.
- Fuentes (`Press Start 2P`, `JetBrains Mono`, `Courier Prime`) cargadas con `next/font/google`.
- Todas las pantallas/componentes interactivos son Client Components (`"use client"`).

**Fuera (no en este spec):**

- Lógica real de cualquier juego (Bloque Buster, Caída, Serpentina, etc.) — solo existen como datos mock y portadas decorativas.
- Backend, API routes o base de datos real. Todo el login y las puntuaciones son falsos y viven en `localStorage` del navegador.
- Autenticación real (validación de credenciales, OAuth con Google/GitHub real, seguridad de sesión).
- Tests automatizados (no hay test runner configurado en el proyecto).
- Cualquier pantalla o flujo no presente en `references/templates/`.

## Modelo de datos

Todo vive en el cliente; no hay base de datos ni API.

- **`lib/data.ts`** — puerto de `data.jsx`:
  - `GAMES: Game[]` — `{ id, title, short, long, cat, cover, color, best, plays }`.
  - `CATS: string[]` — `["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]`.
  - `PLAYERS: string[]` — nombres usados para generar puntuaciones falsas.
  - `seededScores(seed: number, count?: number): ScoreRow[]` — misma función determinista por semilla que en el template, `{ rank, name, score, date }`.
- **Sesión de usuario** (`localStorage["av_user"]`) — `{ name: string } | null`. Se lee/escribe desde un contexto de React (`AuthProvider` en `app/layout.tsx`) que expone `user`, `login(user)`, `logout()`.
- **Puntuaciones guardadas** (`localStorage["av_scores"]`) — array de `{ game: string, score: number, name: string, at: number }`, con `saveScore(entry)` expuesto por el mismo contexto. Solo se usa para escribir (el template tampoco lo lee de vuelta en ninguna pantalla).
- No se introduce ninguna otra estructura de datos ni persistencia adicional.

## Plan de implementación

1. Configurar fuentes con `next/font/google` (Press Start 2P, JetBrains Mono, Courier Prime) en `app/layout.tsx`, expuestas como variables CSS (`--pixel`, `--mono`).
2. Portar `styles.css` a `app/globals.css` (manteniendo las variables de color, clases de botones/tarjetas/animaciones), conservando el import de Tailwind ya existente en el proyecto.
3. Crear `lib/data.ts` con `GAMES`, `CATS`, `PLAYERS` y `seededScores`, tipados en TypeScript.
4. Crear `AuthProvider` (Client Component, p. ej. `components/auth-provider.tsx`) con estado `user`, `login`, `logout`, `saveScore`, sincronizado con `localStorage` (`av_user`, `av_scores`).
5. Actualizar `app/layout.tsx`: envolver la app en `AuthProvider`, renderizar las capas de fondo (`.av-bg`, `.av-noise`), `<Nav />` y el `<footer>`, dejando `<main>{children}</main>` para las rutas.
6. Construir `components/nav.tsx` (Client Component): logo, links activos según ruta (`usePathname`), contador de créditos, botón de sesión/logout, panel móvil con overlay — usando `AuthProvider`.
7. Construir la página `/` (`app/page.tsx`, Client Component): hero, buscador, chips de categoría, grid de `GameCard` con efecto tilt, enlazando a `/juegos/[id]`.
8. Construir `app/juegos/[id]/page.tsx`: portada, tags, descripción, stat strip, botones "Jugar ahora" (→ `/juegos/[id]/jugar`) y "Volver al vault" (→ `/`), leaderboard con `seededScores`. Si el `id` no existe en `GAMES`, se llama a `notFound()`.
9. Construir `app/juegos/[id]/jugar/page.tsx`: HUD, simulación de puntuación/nivel con `useEffect`/`setInterval`, pausa, botón "Fin", escena CRT decorativa, modal de fin de partida con input de iniciales y `saveScore` vía `AuthProvider`, botones "Jugar de nuevo" y "Volver al vault". Mismo tratamiento de `id` inválido que el paso 8.
10. Construir `app/login/page.tsx`: tabs "Iniciar sesión"/"Crear cuenta", formulario controlado, botón "Jugar como invitado", botones sociales decorativos; al enviar, llama a `login()` del contexto y redirige a `/`.
11. Construir `app/salon-de-la-fama/page.tsx`: tabs por juego (usa `GAMES`), podio top 3, tabla completa con `seededScores`, fila "tu mejor marca" si `user` existe en el contexto.
12. Revisión visual manual en `npm run dev` de las 5 pantallas (desktop y mobile) comparando contra el HTML de referencia (`references/templates/Arcade Vault.html`) y `npm run lint` sin errores.

## Criterios de aceptación

- [ ] `/` muestra el hero, buscador y chips de categoría; filtrar por texto y/o categoría actualiza el grid sin recargar la página.
- [ ] Cada tarjeta de juego enlaza a `/juegos/[id]` con el `id` correcto.
- [ ] `/juegos/[id]` muestra portada, descripción, stats y leaderboard con 10 filas generadas por `seededScores`; un `id` inexistente muestra la página 404 de Next.
- [ ] Desde el detalle, "Jugar ahora" navega a `/juegos/[id]/jugar` y "Volver al vault" navega a `/`.
- [ ] `/juegos/[id]/jugar` incrementa la puntuación automáticamente cada ~220ms mientras no está en pausa ni terminado; "Pausa" detiene el incremento y cambia su label a "Reanudar"; "Fin" abre el modal de fin de partida.
- [ ] En el modal de fin de partida, guardar la puntuación escribe una entrada en `localStorage["av_scores"]` y muestra el toast "puntuación guardada"; "Jugar de nuevo" reinicia el estado del HUD; "Volver al vault" navega a `/`.
- [ ] `/login` permite alternar entre "Iniciar sesión" y "Crear cuenta"; enviar el formulario (con cualquier valor) o pulsar "Jugar como invitado" establece la sesión, la persiste en `localStorage["av_user"]` y redirige a `/`.
- [ ] Tras iniciar sesión, el botón de la barra de navegación muestra el nombre del usuario y permite cerrar sesión (borra `localStorage["av_user"]`).
- [ ] `/salon-de-la-fama` permite cambiar de juego con los tabs, muestra el podio top 3 y la tabla completa; si hay sesión activa, se muestra la fila "tu mejor marca".
- [ ] El menú de navegación colapsa a un panel lateral en viewport móvil (< 840px) y se puede abrir/cerrar.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Ninguna pantalla implementa mecánica de juego jugable — solo datos mock, animaciones CSS y navegación.

## Decisiones tomadas y descartadas

- **Rutas de archivo reales en vez de SPA con hash** — se descarta replicar el router por hash del template porque Next.js App Router ya da URLs compartibles e idiomáticas; el costo es traducir la navegación por objetos `{name, id}` a `next/navigation` (`useRouter`, `usePathname`, `Link`).
- **CSS global portado casi literal + Tailwind solo para layout nuevo** — se descarta reescribir todo el sistema visual a utilidades Tailwind porque el look (glitch, scanlines, `clip-path`, gradientes de portada por CSS puro) es complejo y ya está resuelto; reescribirlo agrega riesgo de perder fidelidad visual sin beneficio real.
- **Simulación de partida decorativa completa** — se mantiene el comportamiento "falso juego" del `GamePlayer` original (puntuación autoincremental, niveles, pausa, modal de game over) porque es parte de la experiencia visual pedida, no una mecánica de juego real.
- **Todo mock/`localStorage`, sin backend** — no se introduce API ni base de datos; se acepta que login y puntuaciones no sean reales, igual que en el template.
- **Todos los componentes de pantalla como Client Components** — no se separa en Server + islas de cliente porque todo el estado relevante (usuario, filtros, tabs, HUD) vive en cliente y la separación no aportaría beneficio de rendimiento perceptible en este MVP.
- **Fuentes vía `next/font/google`** en vez de `<link>` a Google Fonts, siguiendo la convención estándar de Next.js para carga de fuentes.
- **`notFound()` de Next.js para `id` de juego inválido** en `/juegos/[id]` y `/juegos/[id]/jugar` — el template original simplemente no renderizaba nada; se prefiere una página 404 explícita por ser el comportamiento estándar de Next.js App Router.
- **Estado de sesión centralizado en un `AuthProvider` de contexto** en el layout raíz, en vez de re-derivar `user` desde `localStorage` en cada página — necesario porque, a diferencia del template (un único componente `App`), aquí el estado debe compartirse entre rutas de archivo independientes.
