# 01: Bootstrap a deployable workspace

**What to build:** Create the smallest running Exile Toolkit path from browser to Worker and preview deployment. A visitor can open the original dark shell, see that the service is available, and distinguish a healthy response from a visible failure. The workspace establishes the shared domain and data boundaries, supported shadcn setup, and automated checks needed by every later slice.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A developer can install dependencies and run the web application and Worker through documented pnpm commands.
- [ ] The browser displays an original Exile Toolkit shell built with React, TypeScript, Vite, Tailwind CSS, and individually added shadcn components.
- [ ] The shell reports the public Worker health state without exposing an implementation error or blank screen when the Worker is unavailable.
- [ ] Shared domain and data code can be imported by the web app and Worker without depending on React or Cloudflare runtime types.
- [ ] Formatting, linting, type checking, unit tests, build, and a browser smoke test run through project commands.
- [ ] Pull requests can produce a Cloudflare preview deployment, with production deployment kept separate.
- [ ] The shadcn audit checklist has been run and any applicable findings resolved.

