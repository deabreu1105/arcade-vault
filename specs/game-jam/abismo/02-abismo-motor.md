# 02 — ABISMO: motor real del descenso y alta en GAME_RUNTIMES

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06, `01-abismo-catalogo-y-cover.md`
**Fecha:** 2026-08-24
**Origen:** game-jam — tema «el fondo del mar»

**Objetivo:** Implementar desde cero `AbismoEngine`, el motor de descenso por una fosa marina
generada procedimentalmente, y registrarlo en `GAME_RUNTIMES` para que `/juegos/abismo/jugar` deje
de mostrar la simulación decorativa y pase a ser un juego real con leaderboard.

## Alcance

**Dentro:**

- Motor nuevo en `components/games/abismo/engine.ts`, clase `AbismoEngine extends ArcadeEngine`,
  que implementa `init()`, `update(dt)` y `draw()` y nada más de la superficie pública.
- **Canvas y mundo.** Resolución lógica 480 × 720, vertical, que `GameCanvas` deja letterboxed con
  barras laterales dentro del `.crt-screen` 4:3 — el mismo trato que ya recibe `tetris` con
  400 × 600. La cámara baja sola a `scrollSpeed` píxeles por segundo; la profundidad en metros es
  `cameraY / PIXELS_PER_METER`, con `PIXELS_PER_METER = 4`.
- **El batiscafo.** Un círculo de unos 14 px de radio con un cono de luz amarillo hacia abajo.
  El jugador controla su velocidad lateral con `←`/`→` y su velocidad vertical relativa a la cámara
  con `↑`/`↓`. La velocidad no se integra como empuje newtoniano: cada eje persigue una velocidad
  objetivo con amortiguación exponencial (`v += (objetivo - v) * min(1, DRAG * dt)`), de modo que
  soltar la tecla frena el sumergible en aproximadamente dos décimas de segundo. Es agua, no vacío,
  y por eso no se siente como `asteroides`. La `y` del batiscafo queda acotada entre el 12 % y el
  70 % de la altura del canvas: el jugador puede adelantarse o rezagarse dentro de la pantalla,
  pero nunca escapar de la cámara.
- **La fosa.** Una cola de segmentos `{ topY, left, right }` de 40 px de alto cada uno, en
  coordenadas de mundo. Se generan por delante de la cámara y se descartan cuando salen por arriba.
  Cada segmento nuevo toma el centro del anterior más un paso aleatorio acotado a `MAX_SHIFT`
  píxeles, y un semiancho igual al semiancho base de la zona más un jitter, con piso en
  `MIN_HALF_WIDTH`. `MAX_SHIFT` se fija de modo que la pendiente de la pared nunca supere la
  velocidad lateral máxima del batiscafo: así toda fosa generada es atravesable.
- **Peligros.** Dos tipos, sembrados con probabilidad por zona en cada segmento nuevo: `medusa`,
  que flota a media agua y se desplaza en horizontal siguiendo un seno con fase propia; y `erizo`,
  clavado a la pared izquierda o derecha y estático. Ambos son círculos para la colisión.
- **Recolectables.** `perla`, un círculo chico con glow que suma 50 puntos y desaparece al tocarlo.
  Es la única fuente de puntos que no es profundidad.
- **Puntuación.** La puntuación es la profundidad en metros enteros alcanzada más 50 por perla. El
  motor acumula la parte fraccionaria del metro y llama a `addScore()` solo con enteros, así que el
  HUD nunca muestra decimales y el número solo crece dentro de una partida, que es lo que
  `/salon-de-la-fama` necesita para ordenar.
- **Vidas.** "Vidas" son los tanques de oxígeno: empieza en 3 y baja de a uno en cada choque contra
  pared, medusa o erizo. Tras un choque hay 1,5 segundos de invulnerabilidad con el batiscafo
  parpadeando, se lo recoloca en el centro del segmento actual y se le anula la velocidad. Con el
  tercer choque, `gameOver()`.
- **Nivel.** "Nivel" es la zona de profundidad, y se deriva de los metros: 1 Luz (0–400 m),
  2 Crepúsculo (400–1000 m), 3 Abisal (1000–1800 m), 4 Hadal (más de 1800 m). Cada zona sube
  `scrollSpeed`, baja el semiancho base de la fosa, sube la densidad de peligros y oscurece el
  fondo. El juego no termina en la zona 4: la dificultad se estanca ahí y la partida sigue siendo
  infinita, porque la puntuación es la profundidad y una carrera infinita se compara igual de bien
  entre corridas.
- **Oscuridad.** Al final de cada `draw()` se pinta un `radial-gradient` centrado en el batiscafo
  que oscurece el resto de la pantalla, con opacidad creciente por zona (0 en la zona 1, hasta
  aproximadamente 0,85 en la zona 4). Es el efecto que convierte el descenso en tensión y es una
  sola operación de canvas por frame.
- **Entrada nueva en `GAME_RUNTIMES`** (`components/games/registry.ts`): `width: 480`,
  `height: 720`, `capturedKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]`, sin `pointer`,
  y un `loadEngine` con `import("@/components/games/abismo/engine")` dinámico como los otros cuatro.

**Fuera (no en este spec):**

- **Lo que el motor deliberadamente no hace, porque la plataforma ya lo cubre:** no dibuja HUD en el
  canvas (Jugador/Puntuación/Vidas/Nivel los pinta React), no dibuja overlay de game over ni de
  pausa, no tiene tecla propia de pausa, no crea su propio bucle de `requestAnimationFrame` y no
  registra sus propios listeners de teclado — todo eso vive en `ArcadeEngine` y en `GameCanvas`.
- Un medidor de oxígeno con cuenta regresiva: no hay lugar en el HUD y el contrato prohíbe dibujar
  HUD en el canvas, así que el oxígeno se expresa como los tres tanques de "Vidas".
- Controles WASD, táctiles o de puntero: solo las cuatro flechas, igual que el resto del Vault.
- Sonido, música y cualquier asset en `public/games/abismo/`.
- Ascenso o final de partida por llegar a un fondo: la fosa no tiene fin.
- Anti-cheat o validación de que la puntuación viene de una partida real, mismo alcance que las
  specs 05, 06, 09 y 10.
- Tocar cualquier otro juego del catálogo, real o decorativo.
- Tocar los archivos genéricos de la plataforma: `lib/supabase/queries.ts`,
  `app/juegos/[id]/jugar/actions.ts`, `app/juegos/[id]/jugar/page.tsx`, `app/biblioteca/**`,
  `app/juegos/[id]/page.tsx` y `app/salon-de-la-fama/**`.
- Tests automatizados: el proyecto no tiene test runner.

## Modelo de datos

- Sin cambios. La fila de `games` la crea el spec `01-abismo-catalogo-y-cover.md` y no se toca acá.
- Sin columnas ni tablas nuevas. Una partida guarda una fila de `scores` como cualquier otro juego:
  `{ user_id, game_id: "abismo", score }`.
- El motor no necesita callbacks distintos de `EngineCallbacks` (`components/games/engine-base.ts`):
  usa los cuatro estándar, `onScoreChange`, `onLivesChange`, `onLevelChange` y `onGameOver`.

## Plan de implementación

1. Crear `components/games/abismo/engine.ts` con el esqueleto de `AbismoEngine extends ArcadeEngine`
   y las constantes del mundo (`PIXELS_PER_METER`, `SEGMENT_H`, `MAX_SHIFT`, `MIN_HALF_WIDTH`,
   `DRAG`, velocidades máximas y la tabla de zonas). En este paso `init()` genera la fosa inicial y
   `draw()` pinta fondo y paredes, sin batiscafo: ya se puede mirar la fosa desplazándose.
2. Implementar el batiscafo y su control amortiguado en `update(dt)`, con el acotado de la `y` a la
   banda visible y la colisión contra las paredes muestreando el segmento a la altura del
   sumergible. En este paso el choque solo reposiciona; todavía no descuenta tanques.
3. Implementar la generación de peligros y perlas por segmento, sus movimientos y la colisión
   círculo contra círculo. Recolectar una perla suma 50 puntos con `addScore(50)`.
4. Implementar profundidad, puntuación por metro entero, tanques con invulnerabilidad de 1,5 s y
   `gameOver()` al agotar el tercero, y la progresión de zona con `setLevel(zona)` cada vez que
   cruza un umbral.
5. Terminar `draw()`: paredes con relleno de roca y borde neón, medusas como cúpula con tentáculos,
   erizos como estrella de púas, perlas con glow, batiscafo con casco y cono de luz, parpadeo
   durante la invulnerabilidad, y por último el degradado radial de oscuridad de la zona.
6. Revisar que `init()` deje el motor realmente reiniciado: tiene que poner `this.state` en
   `"playing"` y disparar `onScoreChange(0)`, además de `onLivesChange(3)` y `onLevelChange(1)`.
   Olvidarse de esto es exactamente el bug que apareció y se corrigió en las specs 09 y 10, y deja
   el motor trabado después de un game over.
7. Agregar la entrada `abismo` a `GAME_RUNTIMES` en `components/games/registry.ts`. Recién en este
   paso `/juegos/abismo/jugar` deja de mostrar la simulación decorativa.
8. Verificación: `npx tsc --noEmit` y `npm run lint` sin errores nuevos, y una pasada manual con los
   MCP de Playwright guardando las capturas en `.playwright-screenshots/`. La pasada manual tiene
   que cubrir: bajar hasta cruzar al menos a la zona 2 y ver el cambio de nivel en el HUD y la
   aceleración; chocar contra una pared, contra una medusa y contra un erizo, y ver bajar los
   tanques de a uno; recoger una perla y ver el salto de 50 en el score; agotar los tres tanques y
   ver el modal de fin con la puntuación real; `PAUSA` y `REANUDAR` sin salto de tiempo; guardar la
   puntuación logueado y como invitado; `JUGAR DE NUEVO`; y confirmar que las flechas no hacen
   scroll de la página.

## Criterios de aceptación

- [ ] `/juegos/abismo/jugar` carga el motor real en vez de la simulación decorativa `.game-arena`.
- [ ] El batiscafo responde a `←`/`→` moviéndose en horizontal y a `↑`/`↓` frenando o acelerando el
      descenso respecto de la cámara, y se detiene al soltar la tecla sin deriva perceptible.
- [ ] La fosa se genera sin fin, siempre atravesable: en una partida completa hasta la zona 4 no
      aparece ningún tramo por el que el batiscafo no pueda pasar.
- [ ] Chocar contra una pared, contra una medusa o contra un erizo descuenta exactamente un tanque,
      da 1,5 segundos de invulnerabilidad con parpadeo y recoloca el batiscafo en el centro de la
      fosa.
- [ ] El HUD (Jugador/Puntuación/Vidas/Nivel) refleja el estado real del motor: la puntuación sube
      con la profundidad en metros enteros y de a 50 por perla, Vidas muestra los tanques de 3 a 0 y
      Nivel muestra la zona de 1 a 4.
- [ ] Cruzar los 400 m sube el Nivel a 2 en el HUD, la cámara baja visiblemente más rápido y la
      pantalla se oscurece.
- [ ] Agotar el tercer tanque, o presionar `FIN`, abre el modal de "FIN DEL JUEGO" con la puntuación
      real.
- [ ] `PAUSA` congela el descenso de inmediato y `REANUDAR` continúa exactamente donde quedó, sin
      que la fosa avance de golpe.
- [ ] Guardar la puntuación logueado como usuario real inserta una fila en `scores` con
      `game_id = 'abismo'` y aparece en `/juegos/abismo` y en `/salon-de-la-fama`.
- [ ] Guardar la puntuación como invitado se guarda solo en `localStorage["av_scores"]`.
- [ ] `JUGAR DE NUEVO` reinicia el motor a profundidad 0, score 0, zona 1 y tres tanques, sin
      recargar la página.
- [ ] Jugar con las flechas no produce scroll de la página.
- [ ] Los otros once juegos del catálogo no cambian de comportamiento.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Velocidad amortiguada en vez de empuje con inercia** — un batiscafo con inercia newtoniana se
  jugaría como `asteroides`, que ya tiene propulsión y deriva. El arrastre del agua se modela como
  una persecución exponencial de la velocidad objetivo, que se siente a dirección y no a momento, y
  es lo que separa este juego del motor que ya existe.
- **La cámara baja sola y el jugador solo la modula** — descartado dejar que el jugador se detenga
  del todo, porque anularía la presión del descenso y permitiría farmear perlas indefinidamente en
  una zona fácil.
- **Puntuación = metros + 50 por perla** — la profundidad sola sería un score honesto pero pasivo,
  medir tiempo sobrevivido en vez de habilidad; las perlas, que suelen estar pegadas a una pared,
  premian el riesgo. Se descartó puntuar por peligro esquivado porque es imposible de comunicar sin
  HUD extra.
- **Vidas = tres tanques de oxígeno** — es la lectura temática correcta de "Vidas" y evita el
  medidor de oxígeno con cuenta regresiva, que no tiene lugar en el HUD. Se descartó el patrón de
  `tetris` y `snake` (Vidas en `—`) porque acá el choque no tiene por qué ser fatal y tres intentos
  hacen la carrera más larga y más comparable.
- **Nivel = zona de profundidad, no una pantalla que se completa** — sigue el patrón de `snake`
  (nivel como escalón de dificultad) y no el de `arkanoid` (nivel como layout terminado), porque la
  fosa es continua y no tiene pantallas.
- **Partida infinita, sin fondo que alcanzar** — un final fijo le pondría techo al leaderboard y
  todos los buenos jugadores empatarían. Se descartó por eso.
- **Zona 4 como techo de dificultad** — más allá de los 1800 m la fosa deja de angostarse. Sin ese
  techo la generación llegaría a un ancho imposible y la muerte sería inevitable en vez de
  merecida.
- **Generación procedimental en vez de niveles dibujados a mano** — evita el costo de contenido que
  `references/game-proposals.md` le marca a `bodega` y a `flujo`, y hace que dos partidas nunca sean
  iguales. El precio es tener que acotar la pendiente de la pared, que es el riesgo de abajo.
- **480 × 720 vertical** — la fosa necesita altura y el letterboxing lateral de `GameCanvas` ya está
  probado con `tetris`. Se descartó 800 × 600 apaisado porque un descenso ancho y bajo se ve
  desde muy cerca y deja sin tiempo de reacción.
- **Sin puntero** — el juego no necesita mouse; se descartó ofrecer control por puntero como en
  `arkanoid` porque el eje vertical lo volvería ambiguo.
- **Dos tipos de peligro y uno solo de recolectable** — alcanzan para dar variedad sin inflar el
  motor. Se descartó agregar corrientes laterales que empujen al batiscafo: se leen como un bug de
  control antes que como una mecánica, y se pueden agregar después sin tocar nada más.

## Riesgos identificados

| Riesgo                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Es el primer juego del Vault con terreno generado procedimentalmente: una mala combinación de paso aleatorio y semiancho puede producir un tramo que ningún jugador pueda atravesar.   | `MAX_SHIFT` por segmento se deriva de la velocidad lateral máxima del batiscafo y de cuánto tarda la cámara en recorrer un segmento, y el semiancho tiene un piso duro `MIN_HALF_WIDTH` de al menos tres veces el diámetro del sumergible. Se verifica jugando hasta la zona 4. |
| Es también el primero con un mundo que se desplaza: si los segmentos y los peligros fuera de pantalla no se descartan, la partida acumula entidades y el frame rate cae con el tiempo. | La cola de segmentos, los peligros y las perlas se podan en cada `update()` en cuanto quedan por encima de la cámara. Una partida larga hasta la zona 4 se revisa con el frame rate a ojo en la pasada manual.                                                                  |
| El degradado radial de oscuridad se suma a los efectos CRT de `.crt-screen`, y en la zona 4 puede dejar las paredes ilegibles o lavar el contraste del cono de luz.                    | La opacidad máxima se topea en aproximadamente 0,85 y el borde de las paredes se dibuja con `shadowBlur` para que sobreviva a la oscuridad. Se ajusta a ojo en la verificación con capturas de las cuatro zonas en `.playwright-screenshots/`.                                  |
