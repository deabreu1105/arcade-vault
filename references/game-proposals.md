# Propuestas de juegos — Arcade Vault

Memoria del agente `game-planner` (`.claude/agents/game-planner.md`). Cada invocación reconcilia
este archivo con `GAME_RUNTIMES` (`components/games/registry.ts`) y con la tabla `games`, y después
agrega las propuestas nuevas.

Estados: `Recomendado` (ganador de su ronda) · `Sugerido` (evaluado, no ganó) · `Descartado` (falla
un eliminatorio de la rúbrica) · `Aprobado` (el usuario lo eligió) · `Implementado` (ya tiene motor
y spec).

Lo escribe el agente. Editalo a mano solo para cambiar un `Estado` — por ejemplo, marcar `Aprobado`
el juego que elegiste antes de correr `/arcade-game`.

---

## Estado del catálogo al 2026-08-24

Leído de `GAME_RUNTIMES` y de la tabla `games` en esta sesión, no de memoria.

- Juegos reales (4): `asteroides` (SHOOTER), `tetris` (PUZZLE), `arkanoid` (ARCADE),
  `snake` (ARCADE).
- Conteo por categoría entre los reales: ARCADE 2 · SHOOTER 1 · PUZZLE 1 · **VERSUS 0**.
- Filas decorativas libres (sin contraparte real): `gloton`, `invasores`, `ranaria`, `duelo-pixel`.
- Filas decorativas ya cubiertas: `bloque-buster`, `caida`, `serpentina`, `rocas`.
- Material de partida agotado: los tres juegos de `references/started-games/` (`02-asteroids`,
  `03-tetris`, `04-arkanoid`) ya están portados, y `references/source-assets/snake-assets/` lo
  consumió la spec 10. **Todo candidato nuevo se dibuja a canvas puro o exige traer assets nuevos
  a `public/games/<id>/`.**
- Precedente de las specs 06, 09 y 10: cada juego real creó una **fila nueva** en `games` y dejó
  intacta la decorativa. Ninguna propuesta de este archivo rompe ese precedente.

---

## Índice

| #   | Juego            | Id propuesto     | Categoría | Fecha      | Estado      | Veredicto en una línea                                                      |
| --- | ---------------- | ---------------- | --------- | ---------- | ----------- | --------------------------------------------------------------------------- |
| 01  | DUELO DE TANQUES | `duelo-tanques`  | VERSUS    | 2026-08-24 | Recomendado | Llena la única categoría vacía con una mecánica que no repite a nadie.        |
| 02  | SPACE INVADERS   | `space-invaders` | SHOOTER   | 2026-08-24 | Sugerido    | El más barato y canónico, pero SHOOTER ya tiene `asteroides`.                 |
| 03  | FROGGER          | `frogger`        | ARCADE    | 2026-08-24 | Sugerido    | Costo bajísimo y mecánica fresca, pero engorda la categoría más poblada.      |
| 04  | PONG             | `pong`           | VERSUS    | 2026-08-24 | Sugerido    | También llena VERSUS, pero es pala-y-pelota otra vez, como `arkanoid`.        |
| 05  | MISSILE COMMAND  | `missile-command`| SHOOTER   | 2026-08-24 | Sugerido    | Buen uso del puntero, pero es el tercer "disparar cosas en el espacio".       |
| 06  | LUNAR LANDER     | `lunar-lander`   | ARCADE    | 2026-08-24 | Sugerido    | Física linda y barata, pero comparte inercia y empuje con `asteroides`.       |
| 07  | PAC-MAN          | `pac-man`        | ARCADE    | 2026-08-24 | Sugerido    | El más deseable a futuro y el más caro: cuatro IAs de fantasma.               |
| 08  | COLUMNS          | `columns`        | PUZZLE    | 2026-08-24 | Descartado  | Segundo apilador de piezas que caen: agrega una fila, no un juego.            |
| 09  | DUELO EN LÍNEA   | `duelo-online`   | VERSUS    | 2026-08-24 | Descartado  | Exige red y backend nuevo: rompe el eliminatorio del contrato.                |
| 10  | ESCUADRÓN        | `escuadron`      | SHOOTER   | 2026-08-24 | Sugerido    | Formación con picadas curvas; costo medio, buena novedad sobre `asteroides`.  |
| 11  | CIEMPIÉS         | `ciempies`       | SHOOTER   | 2026-08-24 | Sugerido    | Partición de entidad y campo de hongos; medio-alto, novedad real.             |
| 12  | TIRO AL BLANCO   | `tiro-al-blanco` | SHOOTER   | 2026-08-24 | Sugerido    | Único candidato 100% puntero; riesgo de soporte táctil sin verificar.         |
| 13  | Q\*BERT          | `q-bert`         | ARCADE    | 2026-08-24 | Sugerido    | Movimiento isométrico en grafo; medio-alto, control poco intuitivo.           |
| 14  | DIG DUG          | `dig-dug`        | ARCADE    | 2026-08-24 | Sugerido    | Terreno destructible celda a celda; alto costo de estado y rendimiento.       |
| 15  | DONKEY KONG      | `donkey-kong`    | ARCADE    | 2026-08-24 | Sugerido    | Plataformas con gravedad; ningún engine actual tiene salto ni geometría inclinada. |
| 16  | GEMAS NEÓN       | `gemas-neon`     | PUZZLE    | 2026-08-24 | Sugerido    | Match-3 con cascadas; costo medio, primera mecánica de grilla estática.       |
| 17  | BODEGA           | `bodega`         | PUZZLE    | 2026-08-24 | Sugerido    | Sokoban: motor barato, pero el contenido (niveles solucionables) es caro.     |
| 18  | FUSIÓN           | `fusion`         | PUZZLE    | 2026-08-24 | Sugerido    | Estilo 2048; el motor más barato del lote, casi sin riesgo técnico.           |
| 19  | APAGA LUCES      | `apaga-luces`    | PUZZLE    | 2026-08-24 | Sugerido    | Lights Out; generación de niveles resolubles trivial, riesgo mínimo.          |
| 20  | FLUJO            | `flujo`          | PUZZLE    | 2026-08-24 | Sugerido    | Flow Free; necesita puntero y niveles pre-diseñados como Sokoban.             |
| 21  | DUELO DE PISTOLEROS | `duelo-pistoleros` | VERSUS | 2026-08-24 | Sugerido    | Reacción pura con `Space`; el motor más simple del catálogo, poca profundidad.|
| 22  | CARRERA RELÁMPAGO | `carrera-relampago` | VERSUS | 2026-08-24 | Sugerido    | Carrera contra fantasma IA; costo medio por física de manejo.                |
| 23  | ESGRIMA NEÓN     | `esgrima-neon`   | VERSUS    | 2026-08-24 | Sugerido    | Parada/ataque por señales; costo medio, exige tuning fino de tiempos.         |
| 24  | HOCKEY AÉREO     | `hockey-aereo`   | VERSUS    | 2026-08-24 | Sugerido    | Air hockey con puntero; riesgo de leerse como variante de `pong`/`arkanoid`.  |
| 25  | ARENA DE SUMO    | `arena-sumo`     | VERSUS    | 2026-08-24 | Sugerido    | Empuje físico circular; mecánica más nueva del lote, sin precedente para calibrar. |

---

## Propuestas

### 01 — DUELO DE TANQUES (Combat, Atari 1977) · `duelo-tanques`

- **Fecha:** 2026-08-24 · **Estado:** Recomendado · **Categoría:** VERSUS · **Color:** yellow
- **Mecánica:** Dos tanques en una arena de neón con muros interiores. El jugador rota, avanza y
  dispara un proyectil que rebota en las paredes; el rival es una IA que persigue, esquiva y
  dispara. Cada impacto destruye al tanque golpeado y arranca una ronda nueva con el mapa rotado.
- **Encaje con el contrato:** Un solo canvas 800 × 600, teclado puro, sin DOM extra ni `Component`.
  El eliminatorio del marcador se resuelve como **humano contra IA**: se puntúa y se guarda
  únicamente la corrida del humano (impactos acertados y rondas ganadas), así que `scores` sigue
  recibiendo `(game_id, player, score)` de una sola partida y `/salon-de-la-fama` ordena igual que
  siempre.
- **Vidas / Nivel:** Vidas = impactos que el jugador aún puede recibir (3). Nivel = ronda actual,
  que además sube la agresividad de la IA y cambia el patrón de muros.
- **Controles:** `ArrowLeft`, `ArrowRight` (rotar), `ArrowUp` (avanzar), `ArrowDown` (retroceder),
  `Space` (disparar). Sin puntero.
- **Assets:** Canvas puro. Tanques como polígonos y muros como rectángulos con glow, en la línea de
  `components/games/asteroides/engine.ts`. Cover `.cover-duelo-tanques` en CSS puro.
- **Costo:** medio. Lo encarece la IA rival y el rebote de proyectiles contra muros; el resto es
  colisión AABB trivial. Esperable entre `arkanoid` (8 KB) y `asteroides` (12 KB).
- **Por qué sí:** VERSUS es la única categoría sin ningún juego real, y este es el único candidato
  que la llena sin repetir mecánica de nadie: nada en el catálogo tiene movimiento libre en 2D con
  rotación, un oponente que decide, ni proyectiles que rebotan. Además crea fila nueva y deja
  `duelo-pixel` intacto, como hicieron las specs 06, 09 y 10.

### 02 — SPACE INVADERS · `space-invaders`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** SHOOTER · **Color:** green
- **Mecánica:** Cañón que se mueve en el eje horizontal y dispara a una formación alienígena que
  desciende en zigzag, acelerando a medida que quedan menos filas. Cuatro búnkeres se erosionan.
- **Encaje con el contrato:** Canvas 800 × 600, teclado, marcador por alien derribado. Encaje
  perfecto, sin fricción.
- **Vidas / Nivel:** Vidas = cañones restantes (3). Nivel = oleada.
- **Controles:** `ArrowLeft`, `ArrowRight`, `Space`.
- **Assets:** Canvas puro; los sprites de aliens se pueden dibujar como rejillas de píxeles.
- **Costo:** bajo. Sin física, sin IA real, colisión rectangular.
- **Por qué no:** Es el candidato más seguro y el más aburrido de elegir ahora. SHOOTER ya tiene
  `asteroides`, y "nave que dispara hacia arriba" es la mecánica más cercana a lo ya implementado.
  Queda como el favorito natural para la ronda siguiente.

### 03 — FROGGER · `frogger`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** green
- **Mecánica:** Cruzar carriles de autos y luego un río sobre troncos y tortugas, saltando de
  casilla en casilla hasta llenar los cinco nidos de la orilla superior.
- **Encaje con el contrato:** Canvas 600 × 700, teclado, puntos por avanzar de fila y por nido
  completado.
- **Vidas / Nivel:** Vidas = ranas restantes (3). Nivel = pantalla, con carriles más rápidos.
- **Controles:** `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.
- **Assets:** Canvas puro.
- **Costo:** bajo. Todo es movimiento en carriles y colisión por casilla; probablemente el motor más
  corto del repo después de `snake` (6 KB).
- **Por qué no:** Excelente relación costo/beneficio, pero ARCADE ya tiene dos juegos reales y
  VERSUS tiene cero. La diversidad de categoría le gana al costo bajo en esta ronda.

### 04 — PONG · `pong`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** cyan
- **Mecánica:** Dos palas, una pelota, primero a N puntos. La pala rival la maneja una IA con error
  deliberado para que sea vencible.
- **Encaje con el contrato:** Canvas 800 × 600, teclado o puntero. Mismo truco de marcador que
  `duelo-tanques`: solo se guarda el puntaje del humano.
- **Vidas / Nivel:** Vidas = puntos que puede conceder antes de perder el set. Nivel = set, con la
  IA más precisa y la pelota más rápida.
- **Controles:** `ArrowUp`, `ArrowDown`, con `pointer: true` opcional.
- **Assets:** Canvas puro.
- **Costo:** bajo. Sería el motor más pequeño del catálogo.
- **Por qué no:** Llena VERSUS, sí, pero es pala-y-pelota-con-rebote, que es exactamente lo que ya
  hace `arkanoid`. Cumple el casillero de categoría sin aportar mecánica nueva; `duelo-tanques`
  llena el mismo casillero y además aporta.

### 05 — MISSILE COMMAND · `missile-command`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** SHOOTER · **Color:** magenta
- **Mecánica:** Lluvia de misiles enemigos sobre seis ciudades; el jugador apunta con el mouse y
  lanza antimisiles cuya explosión expansiva encadena destrucciones.
- **Encaje con el contrato:** Canvas 800 × 600 con `pointer: true`, igual que `arkanoid`. Puntos por
  misil interceptado y bonus por ciudad sobreviviente al final de la oleada.
- **Vidas / Nivel:** Vidas = ciudades en pie. Nivel = oleada.
- **Controles:** Puntero para apuntar y disparar; `Space` como disparo alternativo.
- **Assets:** Canvas puro.
- **Costo:** medio. Lo encarece la explosión expansiva con colisión círculo-punto y el encadenado.
- **Por qué no:** Es el tercer juego de "disparar objetos que vienen del espacio" y refuerza una
  categoría que ya tiene representante, mientras VERSUS sigue vacío.

### 06 — LUNAR LANDER · `lunar-lander`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** cyan
- **Mecánica:** Descender un módulo lunar contra la gravedad, gastando combustible finito, y posar
  suave sobre plataformas marcadas con multiplicador.
- **Encaje con el contrato:** Canvas 800 × 600, teclado, puntaje por aterrizaje según suavidad,
  multiplicador de la plataforma y combustible sobrante.
- **Vidas / Nivel:** Vidas = módulos restantes (3). Nivel = terreno, cada uno con plataformas más
  angostas y más gravedad.
- **Controles:** `ArrowLeft`, `ArrowRight`, `ArrowUp`.
- **Assets:** Canvas puro; el terreno es una polilínea generada.
- **Costo:** bajo-medio. Física simple y colisión contra segmentos.
- **Por qué no:** Empuje con inercia y rotación es justo lo que ya se siente al jugar `asteroides`.
  Aporta menos novedad de la que parece, y suma a ARCADE.

### 07 — PAC-MAN · `pac-man`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** yellow
- **Mecánica:** Recorrer un laberinto comiendo puntos, con cuatro fantasmas de personalidad distinta
  y power pellets que invierten la persecución por unos segundos.
- **Encaje con el contrato:** Canvas 448 × 496, teclado, puntaje por punto, fruta y fantasma comido.
- **Vidas / Nivel:** Vidas = intentos restantes (3). Nivel = laberinto completado.
- **Controles:** las cuatro flechas.
- **Assets:** Canvas puro es viable, pero el laberinto en tiles y la animación de bocado dan trabajo.
- **Costo:** alto. Lo encarece lo que hace al juego bueno: cuatro IAs con objetivos de persecución
  distintos, modos scatter/chase alternados y navegación por celdas. Estaría bastante por encima de
  los 12 KB de `asteroides`.
- **Por qué no:** Es el juego más valioso que falta y merece una spec propia bien pensada, no ser
  encajado ahora. Con VERSUS vacío y un costo alto sin material de partida, esta ronda no es la suya.

### 08 — COLUMNS · `columns`

- **Fecha:** 2026-08-24 · **Estado:** Descartado · **Categoría:** PUZZLE · **Color:** magenta
- **Mecánica:** Tríos de gemas que caen; se rotan sus colores y se alinean tres iguales en cualquier
  dirección para eliminarlas en cascada.
- **Encaje con el contrato:** Encaja sin problema — canvas, teclado, marcador acumulativo.
- **Vidas / Nivel:** Vidas constante en 1. Nivel = velocidad de caída.
- **Controles:** las cuatro flechas más `Space`.
- **Assets:** Canvas puro.
- **Costo:** medio.
- **Por qué no:** Falla por novedad mecánica, no por eliminatorio: es el segundo apilador de piezas
  que caen en una grilla, con `tetris` ya implementado. Agrega una fila al catálogo, no un juego.
- **Qué tendría que cambiar:** Que PUZZLE se vuelva el hueco del catálogo y no quede ninguna mecánica
  de puzzle realmente distinta disponible.

### 09 — DUELO EN LÍNEA (VERSUS real entre dos jugadores) · `duelo-online`

- **Fecha:** 2026-08-24 · **Estado:** Descartado · **Categoría:** VERSUS · **Color:** magenta
- **Mecánica:** Dos personas en máquinas distintas compitiendo en tiempo real, con emparejamiento y
  sincronización de estado.
- **Encaje con el contrato:** Ninguno. Exige red, canal de tiempo real y backend nuevo, cosas que el
  eliminatorio del contrato prohíbe explícitamente. Además, un marcador de 1v1 no es un número
  comparable entre corridas para `/salon-de-la-fama`.
- **Costo:** alto, y en la parte equivocada: plataforma, no juego.
- **Por qué no:** Rompe dos eliminatorios a la vez. La forma sana de llenar VERSUS es humano contra
  IA, que es lo que propone `duelo-tanques`.
- **Qué tendría que cambiar:** Que la plataforma incorpore Supabase Realtime y un modelo de partidas
  como feature propia, con su spec, antes de que un juego pueda apoyarse en eso.

### 10 — ESCUADRÓN (Galaga, 1981) · `escuadron`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** SHOOTER · **Color:** yellow
- **Mecánica:** Formación de naves que entra, se acomoda en grilla y luego rompe filas en picadas
  individuales o en pares que embisten al jugador; derribar en picada vale más que en formación.
- **Controles:** `ArrowLeft`, `ArrowRight`, `Space`. Sin puntero.
- **Costo:** medio. Estado por-nave (formada/transición/picada) con curvas tipo Bézier; sin
  pathfinding real.
- **Riesgo:** curvas mal ajustadas se sienten "on rails" o injustamente letales; requiere tuning
  manual, no un parámetro trivial.

### 11 — CIEMPIÉS (Centipede, 1981) · `ciempies`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** SHOOTER · **Color:** cyan
- **Mecánica:** Movimiento libre en la franja inferior de un campo de hongos, disparando contra un
  ciempiés que serpentea y se parte en dos cuerpos independientes al ser herido; arañas y pulgas
  cruzan como amenaza secundaria.
- **Controles:** las cuatro flechas, `Space`. Sin puntero.
- **Costo:** medio-alto. Lista de segmentos que se escinde en cualquier punto, más una grilla de
  hongos que crece con cada disparo fallido.
- **Riesgo:** calibrar densidad y regeneración del campo; mal ajustado, el juego se vuelve imposible
  o trivial.

### 12 — TIRO AL BLANCO (Duck Hunt, 1984) · `tiro-al-blanco`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** SHOOTER · **Color:** green
- **Mecánica:** Sin nave propia: apuntar y hacer click sobre patos que cruzan en oleadas con
  velocidad y trayectoria crecientes; errar uno cuesta una vida.
- **Controles:** `pointer: true` únicamente, ninguna tecla capturada.
- **Costo:** bajo-medio. Colisión círculo-punto trivial; el trabajo está en diseñar trayectorias
  variadas (rectas, arco, zigzag).
- **Riesgo:** único candidato sin ningún control de teclado — válido por contrato, pero primera vez
  en el catálogo; verificar que el mapeo de `pointer` de `GameCanvas` sirve también para touch.

### 13 — Q\*BERT · `q-bert`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** magenta
- **Mecánica:** Saltar en diagonal entre los cubos de una pirámide isométrica para cambiarles el
  color y cubrirla toda, esquivando a Coily y otros enemigos que bajan por las mismas aristas.
- **Controles:** las cuatro flechas mapeadas a las cuatro diagonales isométricas.
- **Costo:** medio-alto. Proyección isométrica simple, pero el grafo de aristas de la pirámide y la
  IA de Coily persiguiendo sobre ese grafo (no una grilla cartesiana) es más trabajo que cualquier
  engine actual salvo `tetris`.
- **Riesgo:** mapear flechas a diagonales puede confundir sin buen HUD; el descenso de Coily por
  aristas necesita cuidado para no verse "tonto".

### 14 — DIG DUG · `dig-dug`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** cyan
- **Mecánica:** Cavar túneles empujando en las cuatro direcciones, inflar enemigos con una manguera
  hasta que exploten, o dejar caer rocas para aplastarlos.
- **Controles:** las cuatro flechas, `Space` para la manguera.
- **Costo:** alto. Terreno destructible como buffer de estado por celda con su propio redibujado,
  más un modo "fantasma" de enemigos que atraviesan tierra sin cavar.
- **Riesgo:** rendimiento del redibujado celda a celda; tuning fino de la física de rocas y del
  "inflar hasta explotar" para que no se sienta injusto.

### 15 — DONKEY KONG · `donkey-kong`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** ARCADE · **Color:** yellow
- **Mecánica:** Plataformas con gravedad: subir escaleras, saltar barriles que ruedan por rampas
  inclinadas, llegar arriba antes de que se acabe el tiempo.
- **Controles:** `ArrowLeft`, `ArrowRight`, `ArrowUp`/`ArrowDown` (escaleras), `Space` (saltar).
- **Costo:** medio-alto. Física de salto con gravedad y colisión contra vigas inclinadas; ningún
  engine actual tiene geometría inclinada.
- **Riesgo:** el "game feel" del salto es difícil de afinar y muy visible si sale mal.

### 16 — GEMAS NEÓN (Bejeweled) · `gemas-neon`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** PUZZLE · **Color:** yellow
- **Mecánica:** Grilla estática 8×8; intercambiar gemas adyacentes forma líneas de 3+ que se
  eliminan y generan cascadas encadenadas por relleno pasivo desde arriba.
- **Controles:** cursor con flechas + `Space` para seleccionar/confirmar; `pointer` opcional.
- **Costo:** medio. Detección de matches en 4 direcciones, cascadas, y detectar "sin movimientos
  posibles" para regenerar el tablero sin bucles ni tableros irresolubles.
- **Riesgo:** balancear probabilidad de colores para no generar tableros sin jugadas válidas.

### 17 — BODEGA (Sokoban) · `bodega`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** PUZZLE · **Color:** green
- **Mecánica:** Empujar cajas sobre objetivos marcados en una grilla con muros fijos; completo
  cuando todas las cajas están en su lugar.
- **Controles:** las cuatro flechas, `Space` opcional para deshacer.
- **Costo:** bajo-medio en motor, pero alto en contenido: generar niveles Sokoban solucionables no es
  trivial; lo realista es un banco de 10-15 niveles hechos a mano.
- **Riesgo:** sin generador confiable, el catálogo de niveles queda fijo y limitado.

### 18 — FUSIÓN (estilo 2048) · `fusion`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** PUZZLE · **Color:** magenta
- **Mecánica:** Grilla 4×4; deslizar fusiona fichas iguales duplicando su valor, aparece una ficha
  nueva por movimiento válido, termina sin movimientos posibles.
- **Controles:** las cuatro flechas.
- **Costo:** bajo. Probablemente el motor más simple del catálogo, comparable a `snake` o menor.
- **Riesgo:** casi ninguno técnico; cuidar el título/id para no asociarse directamente a la marca del
  clon original (de ahí "Fusión" y no "2048").

### 19 — APAGA LUCES (Lights Out) · `apaga-luces`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** PUZZLE · **Color:** cyan
- **Mecánica:** Grilla 5×5 de celdas encendidas/apagadas; activar una invierte su estado y el de sus
  vecinas ortogonales; apagar todas antes de que se acabe el tiempo.
- **Controles:** cursor con flechas + `Space` para togglear; `pointer` opcional.
- **Costo:** bajo. Generación de niveles resolubles es trivial (siempre parte del estado apagado).
- **Riesgo:** bajo; solo cuidar un cursor visible si se juega por teclado.

### 20 — FLUJO (Flow Free) · `flujo`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** PUZZLE · **Color:** green
- **Mecánica:** Trazar caminos que conecten pares de puntos de colores sin cruzarse, idealmente
  cubriendo toda la grilla, contra un cronómetro.
- **Controles:** `pointer: true` obligatorio (arrastre); por teclado dejaría de sentirse como el
  juego original.
- **Costo:** medio-alto. El motor de trazado es manejable, pero generar niveles que garanticen una
  solución que llene el tablero es un problema de generación procedural genuinamente difícil.
- **Riesgo:** mismo talón de Aquiles que `bodega` — motor barato, contenido caro.

### 21 — DUELO DE PISTOLEROS · `duelo-pistoleros`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** magenta
- **Mecánica:** Dos pistoleros esperan una señal aleatoria; el que presiona `Space` primero después
  de la señal gana el duelo, presionar antes es falta. Duelos encadenados cada vez más impredecibles.
- **Controles:** solo `Space`.
- **Costo:** bajo. El motor más simple del lote, comparable a `snake` o menor.
- **Riesgo:** un solo input puede sentirse "poco juego" frente al resto del catálogo.

### 22 — CARRERA RELÁMPAGO · `carrera-relampago`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** cyan
- **Mecánica:** Vista cenital, el jugador conduce contra un auto fantasma IA en una pista con curvas
  y chicanas; gana quien complete más vueltas antes del cronómetro o de chocar demasiado.
- **Controles:** `ArrowUp`/`ArrowDown` (acelerar/frenar), `ArrowLeft`/`ArrowRight` (dirección).
- **Costo:** medio. Física de dirección/derrape más la IA siguiendo waypoints de la pista.
- **Riesgo:** ajustar la física de manejo sin ser un simulador; el seguimiento de waypoints puede
  verse robótico si no se suaviza.

### 23 — ESGRIMA NEÓN · `esgrima-neon`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** green
- **Mecánica:** Dos esgrimistas de perfil; la IA ataca con amagues visibles que el jugador debe parar
  o esquivar, y ataca cuando ve una abertura. Partido a 5 toques.
- **Controles:** `ArrowLeft`/`ArrowRight` (avanzar/retroceder), `Space` (atacar), `ArrowDown` (parar).
- **Costo:** medio. Máquina de estados de amague/ataque/parada de la IA con ventanas de tiempo
  legibles sin puntero.
- **Riesgo:** diseñar señales claras de "amague vs. ataque real" a tiempo de reacción humano.

### 24 — HOCKEY AÉREO · `hockey-aereo`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** yellow
- **Mecánica:** Disco que rebota libremente en una mesa; el jugador mueve su mazo en 2D con el mouse
  en su mitad, la IA defiende y ataca en la suya. Partido a N goles.
- **Controles:** `pointer: true` (como `arkanoid`); flechas opcionales.
- **Costo:** medio. Física de rebote 2D, transferencia de velocidad mazo-disco, heurística de
  defensa/ataque de la IA.
- **Riesgo:** libertad 2D lo distingue de `pong`, pero un evaluador estricto podría verlo como la
  misma familia "pala contra pelota" ya cubierta por `arkanoid`/`pong` (descartado).

### 25 — ARENA DE SUMO · `arena-sumo`

- **Fecha:** 2026-08-24 · **Estado:** Sugerido · **Categoría:** VERSUS · **Color:** magenta
- **Mecánica:** Vista cenital de un dohyo circular; jugador e IA se empujan al moverse el uno contra
  el otro, gana el asalto quien saca al rival del círculo. Mejor de N asaltos.
- **Controles:** las cuatro flechas (empujar), `Space` (embestida con costo de resistencia).
- **Costo:** bajo-medio. Vectores de fuerza simples, chequeo de límite circular, barra de
  resistencia; sin pathfinding real.
- **Riesgo:** balancear resistencia/embestida para que la IA no sea trivial ni imbatible; mecánica
  más nueva del lote, sin precedente en el catálogo para calibrar el costo con certeza.
