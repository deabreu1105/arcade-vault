# 02 — Home page (landing)

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-08-12

**Objetivo:** Implementar la pantalla Home (landing) de `references/templates/home-about/home.jsx` en `/`, moviendo la Biblioteca actual a `/biblioteca` y actualizando la navegación y los enlaces internos en consecuencia.

## Alcance

**Dentro:**

- Pantalla **Home** (`/`): hero con siluetas flotantes decorativas, sección "¿Por qué Arcade Vault?" (feature cards), rail de juegos destacados (primeros 6 de `GAMES`), sección de stats, sección "Actividad en vivo" (últimas puntuaciones + top jugadores del día), sección de precios (plan único gratis + FAQ) y CTA final — igual que `home.jsx`.
- Animación de aparición al hacer scroll (`useReveal` con `IntersectionObserver`, clases `.reveal`/`.in`) replicada como en el template.
- Mover la pantalla Biblioteca actual (hero, buscador, chips, grid de juegos) de `app/page.tsx` a `app/biblioteca/page.tsx`, sin cambios funcionales.
- Actualizar `components/nav.tsx`: agregar el link "Inicio" (apunta a `/`) antes de "Biblioteca"; el link "Biblioteca" pasa a apuntar a `/biblioteca`; el logo sigue apuntando a `/`.
- Actualizar todos los enlaces/botones internos "Volver al vault" (`app/salon-de-la-fama/page.tsx`, `app/juegos/[id]/page.tsx`, `app/juegos/[id]/jugar/page.tsx`) para que naveguen a `/biblioteca` en vez de `/`.
- Actualizar la redirección tras iniciar sesión / crear cuenta / entrar como invitado en `app/login/page.tsx` para que apunte a `/biblioteca` (mismo destino que antes de este spec, cuando `/` era la Biblioteca).
- Sección "Actividad en vivo": los arrays de últimas puntuaciones y top jugadores se portan literales desde `home.jsx` (nombres y puntajes fijos), como contenido decorativo — no se generan con `seededScores`.
- El botón "VER SALÓN →" de la sección de actividad enlaza a `/salon-de-la-fama`; los botones "EXPLORAR JUEGOS" / "VER TODOS LOS JUEGOS →" enlazan a `/biblioteca`; los botones "CREAR CUENTA" / "EMPEZAR GRATIS →" / CTA final ("INSERTAR MONEDA →" si aplica) enlazan a `/login`.
- Estilos: portar la sección `/* ===== HOME PAGE ===== */` de `references/templates/home-about/styles.css` (hero, siluetas, feature cards, mini-rail, stats, activity, pricing, CTA final, `.reveal`) a `app/globals.css`, conservando el resto del sistema visual ya portado en el spec 01.
- Componente Home como Client Component (`"use client"`), igual que el resto de pantallas del proyecto.

**Fuera (no en este spec):**

- Pantalla "Acerca de" / Contacto (`about.jsx`) — queda para un spec futuro; el link "Acerca de" **no** se agrega al nav todavía, para no enlazar a una ruta inexistente.
- Cualquier cambio a la lógica, datos o pantallas de Biblioteca, Detalle, Reproductor, Login o Salón de la Fama más allá de mover la ruta y actualizar enlaces de navegación.
- Datos reales o backend para "Actividad en vivo" — sigue siendo contenido decorativo estático, igual que en el template.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

No se introduce ninguna estructura de datos nueva. La sección "Juegos disponibles ahora" reutiliza `GAMES` de `lib/data.ts` (ya existente, `GAMES.slice(0, 6)`). Las listas de "últimas puntuaciones" y "top jugadores" son arrays literales embebidos en el componente Home, tal como en `home.jsx`, sin persistencia ni relación con `localStorage`.

## Plan de implementación

1. Mover el contenido actual de `app/page.tsx` (pantalla Biblioteca) a `app/biblioteca/page.tsx` sin cambios funcionales.
2. Portar la sección `/* ===== HOME PAGE ===== */` de `references/templates/home-about/styles.css` a `app/globals.css` (hero, `.home-silos`, `.feature-grid`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.pricing-grid`, `.home-final`, `.reveal`).
3. Crear `components/home/floating-silhouettes.tsx` (o equivalente) con los 8 SVG decorativos de `FloatingSilhouettes` en `home.jsx`.
4. Crear `components/home/feature-icon.tsx` con los 4 iconos SVG pixel (`GAMEPAD`, `FREE`, `TROPHY`, `ROCKET`) de `FeatureIcon`.
5. Crear un hook `useReveal` (Client Component/hook compartido) que aplique `IntersectionObserver` a los elementos `.reveal` del árbol renderizado, igual que en el template.
6. Construir `app/page.tsx` (Client Component) con las secciones de `home.jsx`: hero (siluetas + eyebrow + título + CTAs), "¿Por qué Arcade Vault?", rail de juegos (`GAMES.slice(0, 6)` con `MiniCard` enlazando a `/juegos/[id]`), stats, actividad en vivo (arrays literales), precios/FAQ y CTA final.
7. Actualizar `components/nav.tsx`: agregar el link "Inicio" → `/`, cambiar el link "Biblioteca" → `/biblioteca`, y ajustar `isActive` para que "Inicio" solo esté activo en `/` exacto y "Biblioteca" cubra `/biblioteca` y `/juegos/*`.
8. Actualizar los botones "Volver al vault" en `app/salon-de-la-fama/page.tsx`, `app/juegos/[id]/page.tsx` y `app/juegos/[id]/jugar/page.tsx` para navegar a `/biblioteca`.
9. Actualizar `app/login/page.tsx` para redirigir a `/biblioteca` tras iniciar sesión, crear cuenta o entrar como invitado.
10. Revisión visual manual en `npm run dev` de `/` (desktop y mobile) comparando contra `home.jsx`/`styles.css`, verificar que `/biblioteca` sigue funcionando igual que antes, y correr `npm run lint` sin errores.

## Criterios de aceptación

- [x] `/` muestra la pantalla Home: hero con siluetas flotantes y CTAs, sección de features, rail de juegos destacados, stats, actividad en vivo y precios/FAQ, con animación de aparición al hacer scroll.
- [x] El rail de juegos destacados muestra los primeros 6 juegos de `GAMES` y cada tarjeta enlaza a `/juegos/[id]` con el `id` correcto.
- [x] Los CTAs "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS →" navegan a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/login`; "VER SALÓN →" navega a `/salon-de-la-fama`.
- [x] `/biblioteca` muestra la pantalla Biblioteca (hero, buscador, chips, grid con filtrado) exactamente igual que antes de este spec.
- [x] El nav muestra "Inicio" (activo solo en `/`) y "Biblioteca" (activo en `/biblioteca` y `/juegos/*`, apunta a `/biblioteca`); el logo sigue enlazando a `/`.
- [x] Los botones "Volver al vault" en Detalle, Reproductor y Salón de la Fama navegan a `/biblioteca`.
- [x] Iniciar sesión, crear cuenta o entrar como invitado desde `/login` redirige a `/biblioteca`.
- [x] El menú móvil refleja los mismos cambios de enlaces que el nav de escritorio.
- [x] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Biblioteca se mueve a `/biblioteca`, no se mantiene en `/`** — se descarta implementar la Home en una ruta secundaria (ej. `/inicio`) porque el template usa `/` como landing y las URLs raíz idiomáticas son las que Next.js App Router favorece; el costo es actualizar los enlaces internos que asumían que `/` era la biblioteca.
- **El link "Acerca de" no se agrega al nav en este spec** — se descarta adelantarlo porque `about.jsx` queda fuera de alcance; agregar el link ahora produciría una ruta 404 hasta que exista su propio spec.
- **"Actividad en vivo" con datos literales, no generados** — se mantiene el comportamiento decorativo del template (nombres y puntajes fijos) porque es contenido de ambientación, no un ranking real; generar con `seededScores` agregaría complejidad sin beneficio, ya que tampoco se lee de `localStorage` en el template original.
- **Botones "Volver al vault" y redirección post-login apuntan a `/biblioteca`** — se ajustan para preservar el comportamiento previo al spec (antes de mover Biblioteca, esos flujos llevaban al usuario a la lista de juegos, no a la nueva landing).
- **Home como Client Component completo** — igual que las demás pantallas del proyecto (spec 01), no se separa en Server + islas de cliente porque la animación de scroll (`useReveal`) requiere `IntersectionObserver` en cliente para toda la página.
