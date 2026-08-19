// ===== data.ts — shared UI constants =====

export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

export const GAME_CATEGORIES: GameCategory[] = ["ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export const GAME_COLORS: Game["color"][] = ["cyan", "magenta", "yellow", "green"];

export const GAME_COVERS = [
  "cover-asteroides",
  "cover-bricks",
  "cover-duelo",
  "cover-glot",
  "cover-invaders",
  "cover-rana",
  "cover-rocas",
  "cover-snake",
  "cover-tetris",
  "cover-tetro",
] as const;
