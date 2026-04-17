# Constitution

Version: 1.0.0

## Purpose

A browser-playable Space Invaders clone with modern hi-res graphics, smooth animations, and sound effects. Built as a polished showcase piece intended for public release (e.g. itch.io), it prioritizes tight gameplay and visual polish over feature breadth. Non-goals: no multiplayer, no backend services, no monetization, no analytics/telemetry, and no account systems. The game must run fully client-side in modern browsers on both desktop and mobile.

## Principles

- Playability first — tight, responsive controls trump visual polish
- 60fps target on mid-range hardware; profile before adding effects
- Deterministic game logic decoupled from rendering
- Asset pipeline favors small, optimized files (WebP/OGG) over raw fidelity
- No external runtime dependencies for core gameplay; keep the bundle lean
- Progressive enhancement — core game works without audio/gamepad

## Stack

- language: typescript
- package_manager: pnpm
- install: pnpm install
- test: pnpm test
- lint: pnpm lint
- typecheck: pnpm exec tsc --noEmit
- build: pnpm build

## Boundaries

- Will NOT add runtime frameworks (React, Vue, PixiJS, Phaser) — raw Canvas 2D only
- Will NOT add new runtime dependencies without amending this constitution
- Will NOT require a backend server — game runs fully client-side
- Will NOT add multiplayer, networking, or account systems
- Will NOT add monetization, ads, analytics, or telemetry
- Will NOT ship assets larger than 5MB total bundle size
- Will NOT block gameplay on audio/gamepad availability
- Will NOT couple game logic to the rendering layer (must remain separable)

## Quality Standards

- `pnpm exec tsc --strict --noEmit` passes with zero errors
- `pnpm lint` (ESLint) passes with zero warnings
- `pnpm test` (Vitest) passes; core game logic has unit tests
- `pnpm build` (Vite) produces a bundle under 5MB total
- Game maintains 60fps on mid-range hardware (verified via Chrome DevTools performance profile)
- No runtime dependencies in `package.json` (devDependencies only)
- `pnpm exec prettier --check .` passes

## Roadmap

- Player ship moves left/right and fires bullets
- Grid of alien invaders advances and descends
- Collision detection with score tracking
- Destructible bunkers/shields
- Wave progression with increasing difficulty
- Boss/UFO bonus enemy
- Hi-res sprite art and parallax starfield background
- Smooth 60fps animations with particle effects on explosions
- Sound effects (shoot, hit, explosion) and background music
- Start screen, pause, game-over, and high-score persistence (localStorage)
- Keyboard + touch/gamepad controls
- Responsive canvas scaling for desktop and mobile browsers
