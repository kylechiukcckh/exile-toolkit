# Exile Toolkit

Exile Toolkit is a shared workspace for Path of Exile trade-league research. The current implementation is the deployable foundation for the maps and map-mod regex milestone.

## Requirements

- Node.js 22 or newer
- pnpm 10.17 or newer

## Local development

Install dependencies:

```sh
pnpm install
```

Run the Worker in one terminal:

```sh
pnpm dev:api
```

Run the web app in another:

```sh
pnpm dev
```

The web app runs at `http://127.0.0.1:4173` and proxies `/api` requests to the Worker at `http://127.0.0.1:8787`.

## Checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm check` runs the non-browser checks together. Browser tests start both local services automatically.

## Keyboard shortcuts

- `Ctrl` or `Cmd` + `K`: open global Tool search.
- `Ctrl` or `Cmd` + `Shift` + `1`: open the Workspace home.
- `Ctrl` or `Cmd` + `Shift` + `2`: open the Regex Tool.
- `/`: focus search inside the Regex Tool.
- `Ctrl` or `Cmd` + `Shift` + `C`: copy the focused Regex part, or the first part when none has focus.

Shortcuts do not run while typing in an input or editable control.

## Cloudflare preview

Create a Cloudflare Pages project named `exile-toolkit`, authenticate Wrangler, set `VITE_API_BASE_URL` to the preview Worker's public origin, then run:

```sh
pnpm deploy:preview
```

Pull requests use the dedicated preview workflow to deploy both a numbered Worker and a matching Pages branch. Configure the `preview` GitHub environment with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets plus a `CLOUDFLARE_WORKERS_SUBDOMAIN` variable. Production deployment remains separate and is not performed by project checks.

## Project boundaries

Read [CONTEXT.md](./CONTEXT.md) for domain language, [the product specification](./docs/PRODUCT.md), and [the accepted ADRs](./docs/adr/) before changing architecture or data-source behavior.
