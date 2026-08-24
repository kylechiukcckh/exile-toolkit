# Use a client-first Cloudflare workspace

Exile Toolkit will use a pnpm workspace with a React, TypeScript, and Vite web app, a Cloudflare Worker API, and framework-independent domain and data packages. Most parsing and calculation stays in the browser, while the Worker centralizes upstream access and caching; this avoids an unnecessary application server now while preserving a clear boundary for price sources and future persistence.

## Consequences

Cloudflare Pages and Workers become deployment dependencies. Domain code must remain free of React and Cloudflare types so it can be tested locally and moved later if needed.

