# Bingo

A client/server US 75-ball bingo game. The host creates a room and shares its QR code; players join with a display name and receive a server-generated 5x5 card.

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

## Production

```sh
npm run build
npm run server
```

The Node server serves `dist/`, exposes `/health`, and hosts the WebSocket endpoint. Active rooms are held in memory and disappear when the process stops.

## DigitalOcean Deployment

The `Deploy Bingo` workflow deploys pushes to `main` and can also be started manually. It expects the droplet to have:

- Node.js and npm installed
- The repository cloned at the path in the `DO_APP_DIR` Actions variable
- A deploy user that can run `sudo systemctl restart <service>` without a password
- A systemd service running `npm run server` from the application directory
- GitHub as an allowed Git remote

Use [deploy/bingo.service.example](deploy/bingo.service.example) as the starting point for `/etc/systemd/system/bingo.service`; update `User` and `WorkingDirectory` for the droplet, then run `sudo systemctl daemon-reload` and `sudo systemctl enable --now bingo`.

Configure these production environment values in GitHub:

- Secrets: `DO_HOST`, `DO_USER`, `DO_SSH_KEY`, `DO_KNOWN_HOSTS`
- Variables: `DO_APP_DIR`, `DO_SYSTEMD_SERVICE`, optional `DO_APP_PORT` (defaults to `3001`)

`DO_KNOWN_HOSTS` should contain the pinned output of `ssh-keyscan` for the droplet. The workflow checks out and deploys the exact commit that triggered it, installs from the public npm registry, builds, restarts systemd, and verifies `/health`.

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
