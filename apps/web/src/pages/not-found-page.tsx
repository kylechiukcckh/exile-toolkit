import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
        Unknown route
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50">
        Page not found
      </h1>
      <p className="mt-4 text-stone-500">
        This workspace page does not exist or has moved.
      </p>
      <Link
        className="mt-8 inline-flex text-sm font-medium text-amber-300 hover:text-amber-200"
        to="/"
      >
        Return to workspace
      </Link>
    </section>
  );
}
