// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './app-error-boundary';

function BrokenView(): never {
  throw new Error('private render details');
}

describe('AppErrorBoundary', () => {
  it('shows usable recovery actions after a client rendering failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenView />
      </AppErrorBoundary>
    );

    expect(
      screen.getByRole('heading', { name: 'The workspace hit a problem' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Reload workspace' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Return home' }).getAttribute('href')
    ).toBe('/');
    expect(document.body.textContent).not.toContain('private render details');
  });
});
