# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for the highest score. Currently a fresh `create-next-app` scaffold (Next.js 16, App Router, TypeScript, Tailwind v4, ESLint 9) with no custom features implemented yet.

This project follows Spec Driven Design using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (installed via `npx skills@latest add Klerith/fernando-skills`). Check for these skills/commands before starting new feature work — plan specs first, then implement against them.

## Commands

- `npm run dev` — start the dev server (Turbopack, per Next.js 16 default)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

No test runner is configured yet.

## Skills

Usa siempre /frontend-desing para hacer interfaces de usuario.

## Architecture

- App Router lives in `app/`. `app/layout.tsx` is the root layout, `app/page.tsx` is the home route.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Styling is Tailwind CSS v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`), with global styles in `app/globals.css`.
- Before writing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` — this project pins a Next.js version with breaking changes/conventions that differ from typical training data (see AGENTS.md).
