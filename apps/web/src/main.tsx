import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { AppErrorBoundary } from './components/app-error-boundary';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Exile Toolkit root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
