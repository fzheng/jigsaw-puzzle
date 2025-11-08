# Arcade Jigsaw · K-pop Demon Hunters

Interactive sliding jigsaw built with Node.js + Vite + React. Spin up random neon “K-pop demon hunter” portraits, change puzzle difficulty, and compete on a local leaderboard that records your fastest clears.

## Requirements covered

- `Random Demon Hunter` button seeds the board with a fresh shuffle and a random hunter illustration.
- Difficulty selector switches between 3×3, 4×4, and 5×5 grids.
- Play with mouse clicks (tap tiles next to the empty slot) or keyboard controls (Arrow/WASD to slide, Space/Enter to restart).
- When the board returns to its solved state, the move counter is recorded and the ranking list updates (persisted via `localStorage`).

## Getting started

```bash
npm install
npm run dev
```

The development server prints a local URL (default `http://localhost:5173`). Open it to play.

### Production build

```bash
npm run build
npm run preview
```

## Controls

- **Mouse / touch**: click or tap any tile adjacent to the empty space to slide it.
- **Keyboard**: focus the board (click it once) and use Arrow keys or WASD. Press `Space` or `Enter` to reshuffle quickly.

Clear runs are ranked by the fewest moves; the list is stored in your browser so you can keep chasing better times.
