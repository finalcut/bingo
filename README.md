# Bingo

A real-time US 75-ball bingo game for hosting a shared game with friends. The host creates a room and shares its QR code; players join with a display name and receive a server-generated 5x5 card.

## Features

- Create a game room and share its QR code with players
- Join with a display name from any connected browser
- Generate a unique 5x5 bingo card for each player
- Run a shared game over WebSockets with server-controlled room state
- Support standard bingo play with configurable game modes
- Keep active rooms in memory for lightweight, fast-paced sessions

### Game modes

The host chooses a mode when creating a room and can choose a new mode between games:

| Mode | Winning pattern |
| --- | --- |
| Standard | Complete any row, column, or diagonal. |
| 7 | Complete the top-left corner shape and center column. |
| Plus | Complete the center row and center column. |
| Blackout | Mark every space on the card. |
| Checkerboard | Mark the alternating checkerboard spaces. |
| Four Corners | Mark all four corner spaces. |
| Letter H | Complete both outside columns and the center row. |
| Letter T | Complete the top row and center column. |
| Letter X | Complete both diagonals. |
| Letter Z | Complete the top row, bottom row, and reverse diagonal. |
| Large Picture Frame | Complete the outside edge of the card. |
| Tic Tac Toe | Complete the nine spaces at the intersections of a 3x3 grid. |

## Development

Install from the public npm registry when the machine default points elsewhere:

```sh
npm --registry=https://registry.npmjs.org/ install
```

Run the browser and server in separate terminals:

```sh
npm run dev
npm run server
```

The Vite client runs on `http://localhost:5173`; the WebSocket server runs on `http://localhost:3001`. Set `VITE_WS_URL` when the server is hosted at another origin.

## Server

```sh
npm run build
npm run server
```

The Node server serves `dist/`, exposes `/health`, and hosts the WebSocket endpoint. Active rooms are held in memory and disappear when the process stops.

## Checks

```sh
npm test
npm run typecheck
npm run lint
```# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
