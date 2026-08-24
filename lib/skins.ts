// Skins de los juegos reales del Vault.
//
// Todos los campos de SkinPalette son opcionales a propósito: cada motor lee
// `this.palette.<rol> ?? "<su literal de siempre>"`, y SKINS.clasico no define ningún color. Así
// el skin por defecto queda idéntico al código original por construcción, y no por revisión
// visual. Ese detalle también evita pisar los cuatro fondos distintos que ya usan los motores
// (#000 en Asteroides y Arkanoid, #0a0a12 en Tetris, #04140c en Snake).
//
// Este archivo se limita a sintaxis TypeScript borrable — uniones y `as const`, nunca `enum` ni
// `namespace` — para que `node --experimental-strip-types` pueda importarlo tal cual desde
// scripts/check-skins.mjs sin sumar dependencias de build.

export type SkinId = "clasico" | "neon" | "retro";

export const SKIN_IDS = ["clasico", "neon", "retro"] as const;

export const DEFAULT_SKIN: SkinId = "clasico";

/** Clave de localStorage donde vive la preferencia de skin. */
export const SKIN_STORAGE_KEY = "av_skin";

export type SkinPalette = {
  /** Fondo del canvas. */
  bg?: string;
  /** Lo que controla el jugador: la nave, la cabeza de la serpiente, la paleta. */
  primary?: string;
  /** El obstáculo o el campo principal: los asteroides, los muros. */
  secondary?: string;
  /** Objetivos y recolectables: power-ups, comida. */
  accent?: string;
  /** Detalles brillantes y pequeños: balas, partículas, texto dibujado en el canvas. */
  ink?: string;
  /** Líneas estructurales tenues. Deliberadamente de bajo contraste. */
  grid?: string;
  /** El fuego del propulsor. */
  thrust?: string;
  /**
   * Ocho colores indexados. Tetris los usa para sus piezas y los indexa de 1 a 8 incluyendo la
   * tuerca, así que ocho es el largo exacto, no una aproximación.
   */
  ramp?: readonly string[];
  /** Multiplicador de los `shadowBlur` que ya existen en cada motor. 1 deja el brillo como está. */
  glow?: number;
  /** Filtro CSS con el que se tiñe un spritesheet una sola vez, fuera de pantalla. */
  spriteTint?: string;
};

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

export const SKINS: Record<SkinId, SkinPalette> = {
  // Vacío salvo el multiplicador neutro de brillo: cada motor cae a sus propios literales.
  clasico: {
    glow: 1,
  },

  neon: {
    bg: "#05010d",
    primary: "#5cfbff",
    secondary: "#c98bff",
    accent: "#ff4fae",
    ink: "#eafcff",
    grid: "rgba(124, 92, 255, 0.16)",
    thrust: "#ffa63d",
    ramp: ["#5cfbff", "#ffe14d", "#e07bff", "#5cff9e", "#ff5c8a", "#7ba9ff", "#ffab4d", "#cfd6ff"],
    glow: 2.2,
    spriteTint: "saturate(1.7) brightness(1.12) contrast(1.06)",
  },

  retro: {
    bg: "#0c0803",
    primary: "#ffc247",
    secondary: "#d1892a",
    accent: "#fff0c2",
    ink: "#ffdc94",
    grid: "rgba(255, 176, 0, 0.10)",
    thrust: "#ff7a1f",
    // Paleta de gabinete ochentero: pocos tonos, poco saturados y sin brillo. El rango de
    // matiz es angosto a propósito, así que la separación entre piezas la carga la luminosidad.
    ramp: ["#ffd76b", "#fff4d2", "#e0702a", "#9fbb52", "#d9453a", "#7fb9b0", "#b98cc4", "#9b9384"],
    glow: 0,
    spriteTint: "saturate(0.55) sepia(0.55) hue-rotate(-14deg) brightness(1.08)",
  },
};

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value);
}

/**
 * Convierte un color de paleta a sus componentes RGB. Acepta `#rgb`, `#rrggbb` y `rgb()`/`rgba()`,
 * que es todo lo que las paletas usan. Devuelve null si no lo reconoce, para que quien llame
 * decida — el verificador de contraste lo reporta como error y `alpha()` cae al color original.
 */
export function toRgb(color: string): [number, number, number] | null {
  const hex = color.trim();

  if (hex.startsWith("#")) {
    const body = hex.slice(1);
    if (body.length === 3) {
      const r = body[0] as string;
      const g = body[1] as string;
      const b = body[2] as string;
      return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
    }
    if (body.length === 6) {
      return [
        parseInt(body.slice(0, 2), 16),
        parseInt(body.slice(2, 4), 16),
        parseInt(body.slice(4, 6), 16),
      ];
    }
    return null;
  }

  const match = hex.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return null;
  const parts = (match[1] as string).split(",").map((p) => Number(p.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return [parts[0] as number, parts[1] as number, parts[2] as number];
}

/**
 * Devuelve `color` con opacidad `a`. Los motores lo necesitan donde el alfa varía por frame —
 * las partículas de Asteroides se desvanecen, la grilla de Tetris es un blanco muy tenue — y un
 * string hexadecimal plano no da eso.
 */
export function alpha(color: string, a: number): string {
  const rgb = toRgb(color);
  if (!rgb) return color;
  const clamped = Math.max(0, Math.min(1, a));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Number(clamped.toFixed(3))})`;
}
