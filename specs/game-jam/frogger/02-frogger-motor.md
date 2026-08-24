# 02 — Frogger: motor real

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06, `01-frogger-catalogo-y-cover.md`
**Fecha:** 2026-08-24
**Origen:** game-jam — tema «Frogger: cruza la carretera y el río sin convertirte en papilla»

Crear desde cero (sin referencia en `references/started-games/`, que ya está agotada) un motor
real de Frogger sobre una grilla de carriles, dibujado enteramente a canvas puro, y registrarlo en
`GAME_RUNTIMES` para que `frogger` deje de mostrar la simulación decorativa.

## Alcance

**Dentro:**

- Motor en `components/games/frogger/engine.ts`, clase `FroggerEngine extends ArcadeEngine`.
- Grilla lógica de 13 columnas × 15 filas, celda = 40px (canvas 520×600), organizada de abajo hacia
  arriba en cinco bandas:
  1. **Zona de salida** (2 filas inferiores): terreno seguro, ahí resucita la rana tras perder una
     vida y ahí empieza cada partida.
  2. **Carretera** (5 filas): cada fila es un carril con vehículos rectangulares que se mueven a
     velocidad y sentido propios (alternando izquierda/derecha entre filas contiguas), con
     wrap-around al salir de la pantalla.
  3. **Mediana** (1 fila): terreno seguro entre carretera y río.
  4. **Río** (5 filas): cada fila es una corriente con troncos (rectángulos largos) o grupos de
     tortugas (círculos en fila) que se desplazan igual que los vehículos; el agua entre esos
     objetos es letal si la rana cae ahí.
  5. **Orilla de nidos** (1 fila superior): cinco casillas de "nido" repartidas en columnas fijas;
     el resto de la fila es agua.
- Movimiento de la rana por salto discreto de una celda: cada `ArrowUp`/`ArrowDown`/`ArrowLeft`/
  `ArrowRight` (via `pressed()`, una vez por pulsación, no repetido al mantener) mueve a la rana una
  celda en esa dirección si la celda destino existe dentro de la grilla; si no existe, la pulsación
  no hace nada.
- Mientras la rana está sobre un carril de río, su posición horizontal se arrastra cada frame según
  la velocidad del objeto que la sostiene (tronco o tortuga), sumada a `dt`; si ese arrastre saca a
  la rana fuera de la grilla por cualquiera de los dos bordes horizontales, cuenta como caída al
  agua.
- Colisión contra un vehículo en la carretera, caer al agua en el río (ninguna plataforma bajo la
  rana en esa celda), o quedar fuera de la grilla por arrastre: pierde una vida, la rana vuelve a la
  celda de salida, y el arrastre horizontal se resetea a cero.
- Alcanzar la fila de nidos: si la columna de la rana coincide con una casilla de nido libre, el
  nido se marca como ocupado (dibujado con una rana pequeña fija) y la rana vuelve a la celda de
  salida para el siguiente intento; si la columna no coincide con un nido libre (agua o nido ya
  ocupado), cuenta como caída al agua.
- Llenar los cinco nidos completa el nivel: sube el nivel en uno, aumenta la velocidad de todos los
  carriles (carretera y río) y reduce ligeramente el largo de troncos/grupos de tortugas hasta un
  piso mínimo jugable, luego libera los cinco nidos y continúa la partida sin interrupción.
- Puntuación: `+10` la primera vez en la vida actual que la rana alcanza una fila más alta que su
  máximo previo en ese intento (evita puntuar yendo y viniendo entre las mismas filas); `+50` por
  cada nido ocupado; `+200` de bono al completar los cinco nidos de una ronda.
- "Vidas" en el HUD = vidas restantes, empieza en 3; el juego termina al perder la cuarta.
- "Nivel" en el HUD empieza en 1 y sube uno por cada tablero de nidos completado.
- Dibujo a canvas puro: carretera y río como bandas de color sólido, vehículos como rectángulos con
  glow en `var(--yellow)`/tonos de asfalto, troncos como rectángulos marrones, tortugas como grupos
  de círculos verdes, nidos vacíos como arcos punteados y nidos ocupados con una rana pequeña
  sólida, la rana del jugador como un rectángulo redondeado verde con `shadowBlur`. Sin sprites ni
  imágenes: mismo criterio que el cuerpo de `snake` o las naves de `asteroides`.
- Entrada `frogger` en `GAME_RUNTIMES` (`components/games/registry.ts`): `width: 520`,
  `height: 600`, `capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]`, sin `pointer`.

**Fuera (no en este spec):**

- Cronómetro visible por intento — el HUD estándar no tiene una casilla para un contador de tiempo
  regresivo, y dibujarlo dentro del canvas sería HUD propio del motor, que el contrato prohíbe; se
  descarta la presión de tiempo del Frogger original a cambio de la presión de tráfico/corriente.
- Tortugas que se sumergen periódicamente (mecánica real del arcade original) — agrega un segundo
  temporizador de peligro por fila que complica la calibración sin cambiar la novedad mecánica ya
  lograda con vehículos + flotadores; queda fuera de este spec.
- Bonus por "mosca" o ítems especiales recogibles sobre los nidos.
- Controles WASD o táctiles.
- Anti-cheat o validación de que la puntuación insertada corresponde a una partida real (mismo
  alcance que specs 05/06/09/10).
- Assets nuevos en `public/games/frogger/` — no hacen falta, todo se dibuja a canvas puro.
- Portar o dar motor real a cualquier otro juego decorativo del catálogo — siguen sin cambios.
- Tocar la fila decorativa `ranaria` — sigue mostrando su simulación actual sin cambios.

## Modelo de datos

Sin cambios de esquema. El motor usa exactamente `EngineCallbacks`
(`components/games/engine-base.ts`): `onScoreChange`, `onLivesChange`, `onLevelChange`,
`onGameOver`. Una partida de `frogger` inserta en `scores` la misma forma
`{ user_id, game_id: "frogger", score }` que cualquier otro juego, sin columnas nuevas.

## Plan de implementación

1. Crear `components/games/frogger/engine.ts` con el estado de grilla: posición de la rana
   (`col`, `row`), arrastre horizontal fraccional acumulado, lista de carriles (`{ row, type:
"road" | "river" | "safe", speed, direction, objetos }`), lista de nidos (`{ col, ocupado }`),
   vidas, nivel, puntuación, y el máximo de fila alcanzado en el intento actual.
2. Implementar `init()`: generar los carriles con velocidades y longitudes de objeto iniciales,
   colocar la rana en la celda de salida central, resetear vidas a 3, nivel a 1, nidos vacíos,
   máximo de fila alcanzado a la fila de salida, y — siguiendo el bug ya encontrado y corregido en
   los specs 09 y 10 — fijar explícitamente `this.state = "playing"` y disparar `onScoreChange(0)`.
3. Implementar `update(dt)`: avanzar la posición de cada objeto de cada carril según su velocidad y
   `dt`, con wrap-around en los bordes horizontales; si la rana está sobre un carril de río, sumar
   el arrastre correspondiente a su posición horizontal fraccional; comprobar colisión contra
   vehículos (carretera), ausencia de plataforma bajo la rana (río) y arrastre fuera de grilla, y
   en cualquiera de esos casos restar una vida, resetear la posición de la rana y el arrastre, y
   llamar a `gameOver()` si las vidas llegan a cero.
4. Implementar `handleKeyDown`/`pressed()` para mover la rana una celda por pulsación, sin permitir
   moverse fuera de la grilla; al entrar en la fila de nidos, resolver ocupación de nido o caída al
   agua como se describe arriba; sumar puntos por avance de fila máxima y por nido ocupado.
5. Implementar la transición de "los cinco nidos llenos": subir nivel, aumentar velocidades,
   reducir longitud de objetos hasta el piso mínimo, vaciar los nidos y devolver la rana a la
   celda de salida, sin detener el loop del motor.
6. Implementar `draw()`: bandas de fondo por tipo de carril, objetos de carretera y río, nidos
   vacíos/ocupados, y la rana del jugador, todo a canvas puro.
7. Agregar la entrada `frogger` a `GAME_RUNTIMES` en `components/games/registry.ts`.
8. Prueba manual aislada: entrar a `/juegos/frogger/jugar` y confirmar que la rana salta celda a
   celda con las flechas, que cruzar la carretera sin tocar un vehículo es posible, y que subirse a
   un tronco arrastra a la rana horizontalmente.
9. Revisión manual completa en `npm run dev`: perder una vida por choque de vehículo, perder una
   vida por caer al agua sin plataforma, perder una vida por arrastre fuera de la grilla, ocupar un
   nido y ver la puntuación subir, completar los cinco nidos y confirmar que el nivel sube y la
   velocidad aumenta, perder la última vida y ver el modal de "FIN DEL JUEGO" con la puntuación
   real, pausar/reanudar sin que la partida avance durante la pausa, terminar con el botón `FIN`,
   guardar la puntuación logueado como usuario real (aparece en `/juegos/frogger` y
   `/salon-de-la-fama`) y como invitado (solo `localStorage`), reiniciar con `JUGAR DE NUEVO`, y
   confirmar que jugar (flechas) no hace scroll de la página. Verificar `npm run lint` y
   `npx tsc --noEmit`. Guardar capturas en `.playwright-screenshots/`.

## Criterios de aceptación

- [ ] `/juegos/frogger/jugar` carga el motor real: la rana salta celda a celda con `←`/`→`/`↑`/`↓`,
      nunca sale de la grilla por una pulsación directa.
- [ ] El HUD superior (Jugador/Puntuación/Vidas/Nivel) refleja en tiempo real el score, las vidas y
      el nivel reales del motor, no valores simulados.
- [ ] Chocar contra un vehículo en la carretera resta una vida y devuelve la rana a la salida.
- [ ] Caer al agua sin plataforma bajo la rana, o ser arrastrada fuera de la grilla por un tronco o
      grupo de tortugas, resta una vida y devuelve la rana a la salida.
- [ ] Ocupar un nido libre suma puntos y lo marca como ocupado visualmente; ocupar los cinco nidos
      sube el nivel, aumenta la velocidad de carriles y vacía los nidos sin detener la partida.
- [ ] Perder la tercera vida (cuarto fallo) abre el modal de "FIN DEL JUEGO" con la puntuación real.
- [ ] `PAUSA` congela vehículos, troncos y la rana de inmediato; `REANUDAR` continúa exactamente
      donde quedó.
- [ ] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con
      `game_id = 'frogger'` y aparece en `/juegos/frogger` y `/salon-de-la-fama`.
- [ ] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [ ] `JUGAR DE NUEVO` reinicia el motor a nivel 1, score 0, 3 vidas y nidos vacíos, sin recargar la
      página.
- [ ] Jugar (flechas) no produce scroll de la página.
- [ ] Los demás juegos del catálogo (incluido `ranaria`) siguen mostrando su comportamiento actual,
      sin cambios.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sin cronómetro visible por intento** — el HUD fijo de la plataforma (Jugador/Puntuación/
  Vidas/Nivel) no tiene una casilla para un contador regresivo, y dibujarlo dentro del canvas sería
  HUD propio del motor, prohibido por el contrato; la presión del juego viene solo del tráfico y la
  corriente, no del reloj.
- **Sin tortugas que se sumergen** — es fiel al arcade original, pero agrega un segundo
  temporizador de peligro por fila justo cuando el resto de la mecánica (vehículos + flotadores) ya
  aporta la novedad necesaria; se puede agregar en una iteración futura sin romper este spec.
- **Puntuación por avance de fila máxima, no por cada salto** — evita que el jugador farme puntos
  saltando adelante y atrás sobre la misma fila; solo se premia progreso neto, igual de simple de
  calcular que un contador de saltos pero sin ese exploit.
- **Arrastre horizontal fraccional en vez de "salto" con el tronco** — la rana debe moverse con el
  tronco de forma continua (por `dt`), no en saltos discretos como el resto del movimiento, porque
  así se comporta el original y es la única forma de que "caer del borde por arrastre" sea un
  peligro real y no cosmético.
- **Grilla de 13×15, celda 40px (canvas 520×600)** — un tablero vertical no 4:3 hace que
  `GameCanvas` lo deje con barras laterales dentro del `.crt-screen`, igual que el 400×600 de
  `tetris` o el 480×480 de `snake`; se prioriza una grilla legible sobre encajar el 4:3 exacto.
- **Sin controles WASD ni táctiles** — consistente con Asteroides/Tetris/Arkanoid/Snake, que
  tampoco agregan un esquema de teclado alternativo.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                | Mitigación                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El arrastre fraccional sobre el río mezcla movimiento continuo (por `dt`) con el resto del juego, que es puramente discreto por celda; un error de redondeo podría dejar a la rana "flotando" entre columnas o teletransportarse al fallar la comparación de límites. | `ArcadeEngine` ya clampea `dt` a 50ms máximo; el arrastre se acumula en un campo fraccional propio (`this.dragOffset`) separado de la columna entera (`col`), y solo se colapsa a una columna entera al recibir un input de salto o al detectar salida de grilla, evitando comparaciones ambiguas a mitad de celda. Se verifica manualmente en el paso 9 del plan. |
| Nueve carriles con velocidades y longitudes de objeto distintas, más su aceleración por nivel, es más estado por-frame que cualquier motor real actual salvo Tetris.                                                                                                  | El estado de cada carril es una lista plana de objetos con posición y velocidad, sin colisión entre objetos del mismo carril ni pathfinding; el costo es lineal en el número de carriles y objetos, comparable a las oleadas de asteroides.                                                                                                                        |
