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

## Cloudflare preview

Create a Cloudflare Pages project named `exile-toolkit`, authenticate Wrangler, then run:

```sh
pnpm deploy:preview
```

Set `VITE_API_BASE_URL` to the deployed Worker origin in the Pages build environment. Pull-request previews can use the same build command through Cloudflare Pages Git integration. Production deployment remains a separate Cloudflare configuration and is not performed by project checks.

## Project boundaries

Read [CONTEXT.md](./CONTEXT.md) for domain language, [the product specification](./docs/PRODUCT.md), and [the accepted ADRs](./docs/adr/) before changing architecture or data-source behavior.

