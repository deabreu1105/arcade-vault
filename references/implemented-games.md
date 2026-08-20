# Juegos de Arcade Vault

Estado del catálogo según la tabla `games` de Supabase (proyecto `rcsimffriebjuypildqz`).

Hay **12 filas** en `games`. De ellas, **4 son juegos reales y jugables** (tienen entrada en
`GAME_RUNTIMES` de `components/games/registry.ts` y un motor propio); las otras **8 siguen
mostrando la simulación decorativa** de la pantalla de Jugador (`.game-arena`).

---

## Juegos implementados (motor real)

### ASTEROIDES — `asteroides`

- **Categoría:** SHOOTER · **Color:** cyan · **Cover:** `cover-asteroides`
- **Spec:** `specs/06-asteroides-juego-real.md` · **Motor:** `components/games/asteroides/engine.ts`
- **Canvas:** 800 × 600 · **Controles:** ← → (rotar), ↑ (propulsión), Espacio (disparar)
- **Descripción:** Rota tu nave triangular, propúlsate y dispara para partir asteroides en
  fragmentos cada vez más pequeños. Sobrevive con tus 3 vidas, sube de nivel al limpiar el campo y
  atrapa el power-up cian de disparo triple cuando aparezca.

### TETRIS — `tetris`

- **Categoría:** PUZZLE · **Color:** cyan · **Cover:** `cover-tetris`
- **Spec:** `specs/08-tetris-juego-real.md` · **Motor:** `components/games/tetris/engine.ts`
- **Canvas:** 400 × 600 · **Controles:** ← → (mover), ↑ / X (rotar), ↓ (soft drop),
  Espacio (hard drop)
- **Descripción:** El clásico Tetris: 7 piezas estándar más una pieza especial (la "tuerca"),
  rotación con wall kicks, pieza fantasma, soft drop y hard drop, y niveles que aceleran la caída
  cada 10 líneas.

### ARKANOID — `arkanoid`

- **Categoría:** ARCADE · **Color:** magenta · **Cover:** `cover-arkanoid`
- **Spec:** `specs/09-arkanoid-juego-real.md` · **Motor:** `components/games/arkanoid/engine.ts`
- **Canvas:** 800 × 600 · **Controles:** ← → o mouse (puntero habilitado)
- **Descripción:** Mueve el paddle con las flechas o el mouse para no dejar caer la pelota. Rompe
  los bloques de cada nivel para sumar puntos y avanzar: 5 niveles con patrones distintos y una
  pelota cada vez más rápida. Perdés una vida cada vez que la pelota cae, y ganás la partida al
  limpiar el nivel 5.

### SNAKE — `snake`

- **Categoría:** ARCADE · **Color:** green · **Cover:** `cover-snake-real`
- **Spec:** `specs/10-snake-juego-real.md` · **Motor:** `components/games/snake/engine.ts`
- **Canvas:** 480 × 480 · **Controles:** ← → ↑ ↓
- **Descripción:** Movete con las flechas para recolectar frutas variadas y crecer. Cada 5 frutas
  subís de nivel y la serpiente acelera. Chocar contra una pared o contra tu propio cuerpo termina
  la partida al instante.

---

## Catálogo decorativo (aún sin motor)

Estas filas existen en `games` y aparecen en Biblioteca, Detalle, Jugador y Salón de la Fama, pero
la pantalla de Jugador les muestra la simulación decorativa porque no tienen entrada en
`GAME_RUNTIMES`.

| ID              | Título        | Categoría | Cover            | Color   | Resumen                                             |
| --------------- | ------------- | --------- | ---------------- | ------- | --------------------------------------------------- |
| `bloque-buster` | BLOQUE BUSTER | ARCADE    | `cover-bricks`   | cyan    | Rebota la pelota y destruye muros de neón.          |
| `caida`         | CAÍDA         | PUZZLE    | `cover-tetro`    | magenta | Encaja las piezas antes de que el techo te aplaste. |
| `serpentina`    | SERPENTINA    | ARCADE    | `cover-snake`    | green   | Crece sin morder tu propia cola.                    |
| `gloton`        | GLOTÓN        | ARCADE    | `cover-glot`     | yellow  | Devora puntos y escapa de los fantasmas.            |
| `invasores`     | INVASORES     | SHOOTER   | `cover-invaders` | green   | Defiende el planeta de filas alienígenas.           |
| `rocas`         | ROCAS         | SHOOTER   | `cover-rocas`    | yellow  | Pulveriza asteroides en gravedad cero.              |
| `ranaria`       | RANARIA       | ARCADE    | `cover-rana`     | green   | Cruza la autopista de pixeles.                      |
| `duelo-pixel`   | DUELO PIXEL   | VERSUS    | `cover-duelo`    | cyan    | Dos paletas. Una pelota. Reflejos máximos.          |

> Nota: `bloque-buster`, `caida`, `serpentina` y `rocas` son las versiones decorativas originales de
> los cuatro juegos que después se implementaron de verdad como `arkanoid`, `tetris`, `snake` y
> `asteroides`.

---

## Cómo se agrega un juego real

`/arcade-game <nombre|carpeta>` cubre el flujo completo: spec → migración en `games` → cover
(`.cover-<id>` en `app/globals.css` + entrada en `GAME_COVERS` de `lib/data.ts`) → motor en
`components/games/<id>/engine.ts` extendiendo `ArcadeEngine` → entrada en `GAME_RUNTIMES` →
verificación con Playwright.
