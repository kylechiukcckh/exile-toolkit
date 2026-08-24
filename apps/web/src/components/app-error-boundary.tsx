import { Component, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<
  { readonly children: ReactNode },
  { readonly failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    // Rendering details stay in the browser and are not sent to analytics.
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-stone-950 p-7 shadow-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-300">
            Client error
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-50">
            The workspace hit a problem
          </h1>
          <p className="mt-4 leading-7 text-stone-300">
            Your browser could not render this view. Reload the workspace, or
            return home and try another route. Local data has not been cleared.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-amber-300 px-4 py-2 text-sm font-medium text-stone-950 focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Reload workspace
            </button>
            <a
              href="/"
              className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-stone-100 focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Return home
            </a>
          </div>
        </section>
      </main>
    );
  }
}
