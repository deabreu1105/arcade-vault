# game-jam — «Frogger: cruza la carretera y el río sin convertirte en papilla»

**Fecha:** 2026-08-24 · **Juego elegido:** FROGGER (`frogger`) · **Categoría:** ARCADE · **Color:**
yellow

El tema nombra la mecánica sin dejar espacio a interpretación: saltar carril por carril entre
tráfico y luego sobre troncos y tortugas hasta llenar los nidos de la orilla. Ningún motor real del
catálogo (`asteroides`, `tetris`, `arkanoid`, `snake`) mueve al jugador sobre una grilla discreta
mientras el escenario entero se desplaza en carriles independientes con velocidades y sentidos
opuestos, así que la mecánica es nueva aunque el nombre sea clásico. Se descartaron tres variantes
que se alejaban del tema explícito o duplicaban lo ya construido: un corredor infinito que abandona
el río, un conductor que esquiva peatones invirtiendo el rol de víctima, y un equilibrista que
recorta la carretera y deja solo el río. La versión completa (carretera + río + cinco nidos) es la
que más fielmente cumple el tema, la más barata de las cuatro candidatas y la única que se dibuja
entera a canvas puro sin assets nuevos.

## Specs de esta carpeta

| Archivo                          | Qué cubre                                        | Deja el sistema en                   |
| -------------------------------- | ------------------------------------------------ | ------------------------------------ |
| `01-frogger-catalogo-y-cover.md` | Fila en `games`, `.cover-frogger`, `GAME_COVERS` | Juego visible, simulación decorativa |
| `02-frogger-motor.md`            | `engine.ts`, `GAME_RUNTIMES`, verificación       | Juego real y jugable                 |

## Conceptos descartados

- **CARRETERA INTERMINABLE** (`carretera-sin-fin`) — un corredor sin fin donde la rana avanza sola
  y el jugador solo esquiva a izquierda/derecha abandona la mitad del tema (no hay río, ni troncos,
  ni nidos) y su progresión de dificultad es solo "más rápido", más pobre que la mecánica de grilla
  con dos tipos de peligro distintos.
- **SEMÁFORO ROJO** (`semaforo-rojo`) — invertir el rol y conducir un auto que esquiva peatones
  encaja con el tema literal ("carretera") pero traiciona su ficción: el jugador deja de ser la
  víctima potencial de la "papilla" para causarla, y la mecánica de solo esquivar en un carril es
  más delgada que la de saltar entre carriles con objetivos.
- **EQUILIBRISTA DEL RÍO** (`equilibrista-rio`) — quedarse solo con la fase de troncos y tortugas
  que se hunden a intervalos cubre la mitad del tema (no hay carretera) y depende de temporizadores
  de hundimiento difíciles de calibrar sin arriesgar partidas injustas; también pierde la lectura de
  "Vidas" más clara que da chocar contra un auto.

## Próximo paso

Revisar los specs y, si convencen, implementarlos con `/arcade-game frogger`.
