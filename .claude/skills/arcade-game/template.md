# Plantilla de spec para un juego real (skill `/arcade-game`)

Esta plantilla es una variante de `.claude/skills/spec/template.md`, sesgada al caso concreto de
"agregar un juego real con motor propio y leaderboard". Sigue las mismas reglas globales de esa
plantilla (una idea por oración, nombres concretos, sin código largo, sin TODOs). La diferencia es
que aquí las secciones ya vienen con la forma que este tipo de spec necesita, tomada de
`specs/06-asteroides-juego-real.md` — el primer spec de este tipo, ya implementado.

## Encabezado

```markdown
# NN — <Nombre del juego>: <resumen de una línea>

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06 (y cualquier otro spec relevante)
**Fecha:** YYYY-MM-DD
```

Seguido de un párrafo **Objetivo** de una sola oración: qué juego se agrega y de dónde sale (una
carpeta de `references/started-games/` o "desde cero").

## Alcance

**Dentro** — enumerar, como mínimo:

- La fila nueva en `games` (id, title, cat, color, cover) — el id y el resto de campos ya se
  decidieron en la Fase 2 del skill.
- La clase `.cover-<id>` nueva en `app/globals.css` y su alta en `GAME_COVERS` (`lib/data.ts`).
- El motor en `components/games/<id>/engine.ts`, qué clases/mecánicas porta o implementa, y qué se
  le quita respecto al original (HUD dibujado en canvas, overlay de game over, pausa interna) por
  quedar cubierto por la plataforma (`ArcadeEngine`, `GameCanvas`, el HUD y el modal de React ya
  existentes).
- La entrada nueva en `components/games/registry.ts` (`GAME_RUNTIMES`).
- Qué significan "Vidas" y "Nivel" en este juego, si no es obvio.
- Assets nuevos, si los hay, y dónde quedan (`public/games/<id>/`).

**Fuera** — repetir, adaptado al juego concreto, lo que ya está descartado para todo juego real por
los specs 05/06 (no repetir la lista completa, solo lo que aplique):

- Controles táctiles/móviles, salvo que este juego específico los necesite de verdad.
- Anti-cheat o validación de que la puntuación corresponde a una partida real.
- Tocar cualquier otro juego del catálogo — sigue con su simulación decorativa sin cambios.
- Cualquier cosa de la referencia original que no tenga sentido en la plataforma (temas
  claro/oscuro propios, un menú, sonido si no se pidió explícitamente).

## Modelo de datos

El `insert into games` literal, con los valores exactos decididos en la Fase 2:

```sql
insert into games (id, title, short, long, cat, cover, color)
values (
  '<id>',
  '<TITLE>',
  '<short>',
  '<long>',
  '<CAT>',
  'cover-<id>',
  '<color>'
);
```

Si el motor necesita un tipo de callbacks distinto al estándar (`EngineCallbacks` de
`components/games/engine-base.ts`), documentarlo aquí — pero el caso normal es no necesitar nada
nuevo, ya que "Vidas"/"Nivel" son suficientemente genéricos para casi cualquier juego de arcade.

Si no hay modelo de datos nuevo más allá de la fila en `games` (el caso normal): decirlo
explícitamente, igual que exige la plantilla base.

## Plan de implementación

Usar los pasos de la sección "Fase 4 — Implementar" de `SKILL.md` como esqueleto, pero
concretados a este juego: nombre de la migración, qué clases del original se portan literal y
cuáles se reescriben, qué controles captura el componente, y el orden exacto en que se hace cada
cosa. Cada paso debe dejar el sistema funcional (ver regla general de la plantilla base).

## Criterios de aceptación

Checklist booleano. Adaptar del spec 06, que ya cubre el caso general:

- [ ] `/biblioteca` muestra la tarjeta nueva con su cover, buscable y filtrable por su categoría.
- [ ] `/juegos/<id>` muestra la ficha con leaderboard real (vacío al inicio).
- [ ] `/juegos/<id>/jugar` carga el motor real: [listar los controles concretos del juego].
- [ ] El HUD (Jugador/Puntuación/Vidas/Nivel) refleja el estado real del motor, no valores
      simulados.
- [ ] [Condición de fin de partida concreta del juego] abre el modal de "FIN DEL JUEGO" con la
      puntuación real.
- [ ] `PAUSA` congela la partida de inmediato; `REANUDAR` continúa exactamente donde quedó.
- [ ] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con
      `game_id = '<id>'` y aparece en `/juegos/<id>` y `/salon-de-la-fama`.
- [ ] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [ ] `JUGAR DE NUEVO` reinicia el motor sin recargar la página.
- [ ] Jugar no produce scroll de la página.
- [ ] Los demás juegos del catálogo no cambian de comportamiento.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

Registrar aquí únicamente lo que sea específico de este juego. No repetir las decisiones ya
tomadas de forma general en los specs 05/06 y en el refactor de plataforma (base de motor
compartida, HUD de React en vez de HUD en canvas, etc.) — esas ya están documentadas ahí y siguen
aplicando sin cambios.

## Riesgos identificados

Solo si este juego introduce un riesgo que Asteroides no tuvo (p. ej. un aspect ratio no 4:3, uso
de mouse, assets de audio/imagen, un panel secundario). Si no hay ninguno nuevo, omitir la
sección.
