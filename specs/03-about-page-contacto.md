# 03 — Pantalla "Acerca de" y envío de correo de contacto

**Estado:** Implementado
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-08-12

**Objetivo:** Implementar la pantalla "Acerca de" (`/acerca-de`) de `references/templates/home-about/about.jsx`, con su formulario de contacto enviando correos reales vía Resend a través de una API Route.

## Alcance

**Dentro:**

- Pantalla **Acerca de** (`/acerca-de`): hero de misión con highlights (`HEART`, `BROWSER`, `PLANT`), separador decorativo animado (`.about-divider`) y sección de contacto con formulario — igual que `about.jsx`.
- Animación de aparición al hacer scroll (`.reveal`/`.in` con `IntersectionObserver`) replicada igual que en las demás pantallas del proyecto (reutilizando el mismo patrón de spec 02, no un hook nuevo si ya existe uno reusable).
- Formulario de contacto (nombre, correo, mensaje) como Client Component:
  - Validación de campos vacíos con efecto "shake", igual que el template.
  - Al enviar, hace `POST` a `app/api/contact/route.ts` con `{ name, email, msg }`.
  - Mientras la petición está en curso, el botón muestra estado de carga (deshabilitado).
  - Si la API responde éxito, se muestra el estado "terminal" de éxito del template (con el nombre del remitente).
  - Si la API responde error (o la petición falla), se muestra un estado de error visible en el formulario (mensaje corto, sin usar el estado de éxito) y se permite reintentar.
  - Formulario no lee sesión/auth — siempre inicia vacío, igual que el template.
- **API Route** `app/api/contact/route.ts` (Node runtime): recibe `POST`, valida que `name`, `email` y `msg` no estén vacíos server-side, usa el SDK `resend` para enviar un correo con esos datos, y responde `{ ok: true }` o `{ ok: false, error }` con el status HTTP correspondiente (400 en validación, 500 en fallo de envío).
- Configuración de Resend:
  - `RESEND_API_KEY` — API key de Resend, en `.env.local` (no se commitea).
  - `CONTACT_TO_EMAIL` — correo destino donde llegan los mensajes, en `.env.local`.
  - Remitente (`from`) fijo en el código: `onboarding@resend.dev` (dominio de pruebas de Resend, no requiere verificación de dominio propio).
  - `.env.example` con las dos variables documentadas (sin valores reales) para que el equipo sepa qué configurar.
- Dependencia nueva: paquete `resend` (SDK oficial de Node/JS) agregado a `package.json`.
- Actualizar `components/nav.tsx`: agregar el link "Acerca de" → `/acerca-de` en el nav de escritorio y en el panel móvil, después de "Salón de la Fama".
- Estilos: portar la sección `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` a `app/globals.css` (`.about-hero`, `.highlight-row`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`, etc.).
- Componente Acerca de como Client Component (`"use client"`), igual que el resto de pantallas del proyecto.

**Fuera (no en este spec):**

- Cualquier otra pantalla o flujo fuera de "Acerca de" y su formulario de contacto.
- Persistencia de los mensajes de contacto (no se guardan en `localStorage` ni en base de datos; solo se envían por correo).
- Rate limiting, captcha o protección anti-spam del formulario.
- Verificación de un dominio propio en Resend — se usa el dominio de pruebas `onboarding@resend.dev`.
- Prellenar el formulario con datos de sesión del usuario logueado.
- Tests automatizados (no hay test runner configurado en el proyecto).

## Modelo de datos

No se introduce ninguna estructura de datos persistente. El único "modelo" es el payload transitorio del formulario:

- Cliente → API: `{ name: string, email: string, msg: string }` (mismos nombres de campo que el `useState` del template).
- API → cliente: `{ ok: true }` en éxito, o `{ ok: false, error: string }` en fallo.

No hay relación con `GAMES`, `localStorage` ni el contexto de auth existente.

## Plan de implementación

1. Agregar la dependencia `resend` a `package.json` (`npm install resend`).
2. Crear `.env.example` en la raíz con `RESEND_API_KEY=` y `CONTACT_TO_EMAIL=` documentados; confirmar que `.env*` ya está en `.gitignore` (lo está).
3. Portar la sección `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` a `app/globals.css`.
4. Crear `app/api/contact/route.ts`: handler `POST` que valida el body, instancia `Resend` con `process.env.RESEND_API_KEY`, envía el correo a `process.env.CONTACT_TO_EMAIL` desde `onboarding@resend.dev` con asunto y cuerpo basados en `name`/`email`/`msg`, y devuelve el JSON de resultado con el status HTTP adecuado.
5. Crear `components/about/highlight-icon.tsx` con los 3 iconos SVG pixel (`HEART`, `BROWSER`, `PLANT`) de `HighlightIcon` en `about.jsx`.
6. Crear `app/acerca-de/page.tsx` (Client Component) con las secciones de `about.jsx`: hero de misión + highlights, divisor animado, y sección de contacto con el formulario controlado que hace `fetch("/api/contact", { method: "POST", ... })`, maneja estados `idle | loading | success | error`, y reutiliza la animación `.reveal` ya presente en el proyecto.
7. Actualizar `components/nav.tsx`: agregar el link "Acerca de" → `/acerca-de` en `links` (desktop) y en el panel móvil, y añadir `"acerca-de"` al tipo/lógica de `isActive`.
8. Revisión visual manual en `npm run dev` de `/acerca-de` (desktop y mobile) comparando contra `about.jsx`/`styles.css`; probar el envío del formulario con una `RESEND_API_KEY` real (éxito) y forzar un error (ej. key inválida o campo vacío) para verificar el estado de error; correr `npm run lint` sin errores.

## Criterios de aceptación

- [x] `/acerca-de` muestra el hero de misión, los 3 highlights y el separador animado, con animación de aparición al hacer scroll.
- [x] La sección de contacto muestra el formulario (nombre, correo, mensaje) y los 3 tips, igual que el template.
- [x] Enviar el formulario con algún campo vacío dispara el efecto "shake" y no hace la petición a la API.
- [x] Enviar el formulario completo hace `POST` a `/api/contact`, deshabilita el botón mientras está en curso, y en éxito muestra el estado "terminal" con el nombre ingresado.
- [x] Si la API responde error (o la red falla), se muestra un mensaje de error en el formulario y el usuario puede reintentar sin recargar la página.
- [x] `app/api/contact/route.ts` valida los campos server-side (400 si falta alguno) y usa Resend para enviar el correo a `CONTACT_TO_EMAIL` desde `onboarding@resend.dev`.
- [x] Falta de `RESEND_API_KEY`/`CONTACT_TO_EMAIL` o fallo del SDK de Resend produce una respuesta 500 con `{ ok: false, error }`, sin tirar la aplicación.
- [x] El nav de escritorio y el menú móvil muestran el link "Acerca de" apuntando a `/acerca-de`, activo cuando la ruta actual es `/acerca-de`.
- [x] `.env.example` documenta `RESEND_API_KEY` y `CONTACT_TO_EMAIL` sin valores reales. (Cubierto por `.env.template`, ya existente y permitido en `.gitignore`; ver nota abajo.)
- [x] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **API Route (`/api/contact`) en vez de Server Action** — se elige el patrón de endpoint explícito porque es más fácil de probar de forma aislada (curl/Postman) y separa claramente el contrato cliente/servidor; una Server Action habría acoplado el envío al árbol de componentes de la pantalla.
- **Destinatario y API key por variable de entorno, remitente fijo en código** — el destino (`CONTACT_TO_EMAIL`) y la key son secretos/configuración que cambian por entorno, por lo que van en `.env.local`; el remitente usa el dominio de pruebas `onboarding@resend.dev` porque no se cuenta con un dominio propio verificado en Resend, así que se hardcodea para evitar una variable que solo tendría un valor posible por ahora.
- **Estado de error real en el formulario, no solo el optimista del template** — se descarta replicar el comportamiento 100% decorativo del template (que siempre "tiene éxito") porque ahora el envío es real y puede fallar (Resend caído, falta de API key); mostrar el fallo evita que el usuario crea que su mensaje llegó cuando no fue así.
- **El link "Acerca de" se agrega al nav en este spec** — se completa la navegación que el spec 02 dejó pendiente explícitamente, ya que ahora la ruta destino existe.
- **Ruta `/acerca-de` en vez de `/about`** — se mantiene la convención en español ya usada por el resto de rutas del proyecto (`/biblioteca`, `/salon-de-la-fama`).
- **Formulario no lee el contexto de auth** — se mantiene el comportamiento del template (formulario siempre vacío al entrar), evitando acoplar la pantalla de contacto al estado de sesión sin que el template lo pida.
- **Sin persistencia de mensajes ni protección anti-spam** — fuera de alcance porque el pedido original solo cubre "implementar la pantalla y el envío de correo"; agregar rate limiting o guardado en base de datos sería una ampliación no solicitada.
- **`.env.template` en vez de `.env.example`** — durante la implementación se encontró que ya existía `.env.template` con el contenido exacto pedido (`RESEND_API_KEY=`, `CONTACT_TO_EMAIL=`) y que el `.gitignore` del proyecto solo tiene la excepción `!.env.template` (no `!.env.example`); crear `.env.example` habría quedado ignorado por git. Se decidió usar el archivo ya existente en vez de crear uno nuevo redundante.

## Riesgos identificados

- **Dependencia de un servicio externo (Resend):** si la cuenta de Resend no tiene `RESEND_API_KEY` configurada en el entorno de despliegue, todos los envíos fallarán con 500 hasta que se configure la variable — el criterio de aceptación de manejo de error cubre que esto no rompa la UI, pero el envío real requiere la key.
- **Dominio de pruebas `onboarding@resend.dev`:** Resend puede limitar el volumen o el destino de correos enviados desde este dominio (normalmente solo permite enviar a la propia cuenta verificada en modo pruebas); si los correos no llegan a `CONTACT_TO_EMAIL` en producción, el siguiente paso sería verificar un dominio propio, lo cual queda fuera de este spec.
