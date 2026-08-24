# game-jam — «el fondo del mar»

**Fecha:** 2026-08-24 · **Juego elegido:** ABISMO (`abismo`) · **Categoría:** ARCADE · **Color:**
yellow

El tema pedía el fondo del mar, y lo que define al fondo del mar no es la fauna sino el descenso:
la presión, la oscuridad que crece y el aire que se termina. Esos tres sustantivos se convierten en
una sola mecánica: pilotear un batiscafo que baja sin parar por una fosa que se angosta, esquivando
paredes y fauna, mientras la puntuación es literalmente la profundidad alcanzada. Se eligió esa
mecánica porque ninguno de los cuatro motores reales (`asteroides`, `tetris`, `arkanoid`, `snake`)
tiene un mundo que se desplaza ni terreno generado, así que aporta un juego y no una fila más; y
porque se dibuja entera a canvas puro, sin assets nuevos, en el rango de costo de
`components/games/arkanoid/engine.ts`. La categoría vacía es VERSUS, no ARCADE, pero el candidato
marino para ese hueco (un kraken contra un sumergible) es caro y choca de frente con
`duelo-tanques`, que `references/game-proposals.md` ya tiene como `Recomendado` para esa misma
categoría.

## Specs de esta carpeta

| Archivo                         | Qué cubre                                       | Deja el sistema en                   |
| ------------------------------- | ----------------------------------------------- | ------------------------------------ |
| `01-abismo-catalogo-y-cover.md` | Fila en `games`, `.cover-abismo`, `GAME_COVERS` | Juego visible, simulación decorativa |
| `02-abismo-motor.md`            | `engine.ts`, `GAME_RUNTIMES`, verificación      | Juego real y jugable                 |

## Conceptos descartados

- **ARPÓN ABISAL** (`arpon`) — el gancho pendular estilo buscador de oro depende de un cronómetro
  como única fuente de presión, y el HUD de la plataforma (Jugador/Puntuación/Vidas/Nivel) no tiene
  dónde mostrarlo sin dibujar HUD en el canvas, cosa que el contrato prohíbe.
- **BURBUJAS** (`burbujas`) — el tirador de burbujas ganaba en diversidad de categoría (PUZZLE tiene
  un solo juego real), pero es el pariente más cercano de Tetris (una masa que baja y se limpia por
  grupos) y el más caro de los sobrevivientes: grilla hexagonal más dos recorridos de inundación.
- **KRAKEN** (`kraken`) — llenaba la única categoría vacía, VERSUS, pero la IA de tentáculos es el
  costo más alto del lote y compite con `duelo-tanques`, ya `Recomendado` en
  `references/game-proposals.md` para ese mismo hueco.
- **CARDUMEN** (`cardumen`) — comer peces más chicos para crecer repite la ficción y el bucle de
  puntuación de `snake`, y nadar libre en dos ejes no agrega nada que el catálogo no tenga.
- **CARGAS DE PROFUNDIDAD** (`cargas`) — el barco que bombardea submarinos es el más barato de
  todos, pero sería el tercer "disparar cosas" del catálogo y SHOOTER ya tiene `asteroides`.

## Próximo paso

Revisar los specs y, si convencen, implementarlos con `/arcade-game abismo`.
