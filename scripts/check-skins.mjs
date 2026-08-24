// Verificador de skins. Corre con `npm run skins:check`.
//
// Importa lib/skins.ts de verdad (Node lo despoja de tipos al vuelo) en vez de reimplementar las
// paletas, así que no puede quedar desincronizado con lo que la app usa. Comprueba tres cosas:
//
//   1. Contraste. Cada rol debe separarse del fondo sobre el que realmente se dibuja.
//   2. Deriva. Los bloques [data-skin=...] de app/globals.css deben coincidir con SKINS.
//   3. Forma. `ramp` tiene ocho entradas, y sus ocho colores son distinguibles entre sí.
//
// `clasico` queda exento del umbral de contraste: es el estado actual del juego, no una paleta
// nueva que estemos proponiendo.
//
// La matemática de color vive acá y no en lib/skins.ts a propósito: la app solo necesita las
// paletas y alpha(), así que nada de esto tiene por qué entrar al bundle.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { SKINS, SKIN_IDS, toRgb } from "../lib/skins.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 4:1 y no el 3:1 de WCAG 1.4.11: .crt-screen superpone scanlines con mix-blend-mode: multiply y
// un viñeteo del 65 %, así que al ojo llega menos contraste del que se calcula sobre el color plano.
const MIN_CONTRAST = 4.0;

// Distancia perceptual mínima entre dos colores del ramp. La razón de contraste no sirve acá:
// solo mide luminancia, y daría "iguales" a un cian y un amarillo del mismo brillo.
const MIN_RAMP_DELTA_E = 18;

const RAMP_LENGTH = 8;

// `grid` es tenue a propósito y `bg` es la referencia contra la que se mide todo lo demás.
const EXEMPT_FROM_CONTRAST = new Set(["bg", "grid"]);

const COLOR_ROLES = ["bg", "primary", "secondary", "accent", "ink", "grid", "thrust"];

// --- matemática de color ----------------------------------------------------------------------

const toLinear = (channel) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function relativeLuminance(color) {
  const rgb = toRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB -> CIE L*a*b* con blanco de referencia D65. */
function toLab(color) {
  const rgb = toRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(toLinear);

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Distancia CIE76. Por encima de ~10 la diferencia se nota de un vistazo. */
function deltaE(a, b) {
  const la = toLab(a);
  const lb = toLab(b);
  if (!la || !lb) return null;
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

// --- 1 y 3: contraste y forma de cada paleta ---------------------------------------------------

const errors = [];
const notes = [];
const fail = (msg) => errors.push(msg);

for (const id of SKIN_IDS) {
  const palette = SKINS[id];
  if (!palette) {
    fail(`SKINS no tiene la entrada "${id}".`);
    continue;
  }

  for (const role of COLOR_ROLES) {
    const value = palette[role];
    if (value !== undefined && toRgb(value) === null) {
      fail(`${id}.${role}: "${value}" no es un color que toRgb() reconozca.`);
    }
  }

  const ramp = palette.ramp;
  if (ramp !== undefined && ramp.length !== RAMP_LENGTH) {
    fail(
      `${id}.ramp tiene ${ramp.length} entradas y necesita ${RAMP_LENGTH} — ` +
        `Tetris indexa COLORS[1..8] e incluye la tuerca.`,
    );
  }

  // Todos los pares, no solo los vecinos: dos piezas cualesquiera pueden terminar lado a lado.
  if (ramp) {
    let worst = { d: Infinity, a: null, b: null, i: -1, j: -1 };
    for (let i = 0; i < ramp.length; i++) {
      for (let j = i + 1; j < ramp.length; j++) {
        const d = deltaE(ramp[i], ramp[j]);
        if (d !== null && d < worst.d) worst = { d, a: ramp[i], b: ramp[j], i, j };
      }
    }
    if (worst.d < MIN_RAMP_DELTA_E) {
      fail(
        `${id}.ramp[${worst.i}] y ramp[${worst.j}] (${worst.a} / ${worst.b}) distan ` +
          `ΔE ${worst.d.toFixed(1)}, por debajo de ${MIN_RAMP_DELTA_E}: dos piezas se confundirían.`,
      );
    } else if (Number.isFinite(worst.d)) {
      notes.push(`${id}: ramp de ${ramp.length}, par más parecido ΔE ${worst.d.toFixed(1)}.`);
    }
  }

  if (id === "clasico") {
    notes.push(`${id}: exento del umbral de contraste (es el statu quo).`);
    continue;
  }

  const bg = palette.bg;
  if (!bg) {
    fail(`${id}.bg no está definido, así que no hay contra qué medir el contraste.`);
    continue;
  }

  let lowest = { ratio: Infinity, role: null };
  for (const role of COLOR_ROLES) {
    if (EXEMPT_FROM_CONTRAST.has(role)) continue;
    const value = palette[role];
    if (value === undefined) continue;
    const ratio = contrastRatio(value, bg);
    if (ratio === null) continue;
    if (ratio < lowest.ratio) lowest = { ratio, role };
    if (ratio < MIN_CONTRAST) {
      fail(
        `${id}.${role} (${value}) contrasta ${ratio.toFixed(2)}:1 con ${bg}, ` +
          `y el mínimo es ${MIN_CONTRAST}:1.`,
      );
    }
  }

  for (const [i, color] of (ramp ?? []).entries()) {
    const ratio = contrastRatio(color, bg);
    if (ratio !== null && ratio < MIN_CONTRAST) {
      fail(
        `${id}.ramp[${i}] (${color}) contrasta ${ratio.toFixed(2)}:1 con ${bg}, ` +
          `y el mínimo es ${MIN_CONTRAST}:1.`,
      );
    }
  }

  if (lowest.role) {
    notes.push(`${id}: rol más flojo "${lowest.role}" a ${lowest.ratio.toFixed(2)}:1 sobre ${bg}.`);
  }
}

// --- 2: deriva entre app/globals.css y SKINS ---------------------------------------------------

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");

for (const id of SKIN_IDS) {
  if (id === "clasico") continue; // clasico vive en :root, no en un bloque [data-skin].

  const block = css.match(new RegExp(`\\[data-skin=["']${id}["']\\]\\s*\\{([^}]*)\\}`));
  if (!block) {
    fail(
      `app/globals.css no tiene un bloque [data-skin="${id}"]; los covers no cambiarían de skin.`,
    );
    continue;
  }

  const declared = new Map();
  for (const line of block[1].split(";")) {
    const m = line.match(/--skin-([a-z0-9-]+)\s*:\s*(.+)$/i);
    if (m) declared.set(m[1].trim(), m[2].trim());
  }

  if (declared.size === 0) {
    fail(`El bloque [data-skin="${id}"] no declara ningún token --skin-*.`);
    continue;
  }

  for (const [token, cssValue] of declared) {
    const paletteValue = SKINS[id][token];
    if (paletteValue === undefined) {
      fail(`--skin-${token} está en [data-skin="${id}"] pero SKINS.${id}.${token} no existe.`);
      continue;
    }
    const same =
      cssValue.toLowerCase() === String(paletteValue).toLowerCase() ||
      JSON.stringify(toRgb(cssValue)) === JSON.stringify(toRgb(String(paletteValue)));
    if (!same) {
      fail(
        `--skin-${token} vale "${cssValue}" en CSS y "${paletteValue}" en SKINS.${id}: derivaron.`,
      );
    }
  }

  notes.push(`${id}: ${declared.size} tokens --skin-* verificados contra SKINS.`);
}

// --- salida ------------------------------------------------------------------------------------

for (const note of notes) console.log(`  · ${note}`);

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} problema(s) de skins:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("\n✓ skins: contraste, forma y coherencia CSS↔TS en orden.");
