---
description: Formatea todo el proyecto con Prettier y corre ESLint --fix sobre el código fuente
---

Corre estos comandos, en orden, y luego reporta un resumen breve de lo que cambió y de cualquier
error que ESLint no haya podido autocorregir:

1. `npm run format` — aplica Prettier a todo el repo (respeta `.prettierignore`, así que no
   toca `.agents/`, `references/`, `node_modules/`, etc.).
2. `npx eslint --fix app components lib hooks demos` — aplica los autofixes de ESLint sobre el
   código fuente real de la app (excluye `references/`, que tiene errores conocidos y no forma
   parte de la app).

Si `$ARGUMENTS` no está vacío, trátalo como una ruta o lista de rutas específicas y corre ambos
comandos solo sobre esas rutas en lugar de todo el repo.

Al final, si quedaron errores de ESLint sin autocorregir, muéstralos y ofrece arreglarlos.
