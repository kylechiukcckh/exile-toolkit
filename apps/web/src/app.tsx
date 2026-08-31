import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { WorkspaceShell } from '@/components/workspace-shell';
import { HomePage } from '@/pages/home-page';
import { MapRegexPage } from '@/pages/map-regex-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { TrustPage } from '@/pages/trust-page';

const DisenchantPage = lazy(() =>
  import('@/pages/disenchant-page').then(module => ({
    default: module.DisenchantPage
  }))
);

const CropRotationPage = lazy(() =>
  import('@/pages/crop-rotation-page').then(module => ({
    default: module.CropRotationPage
  }))
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WorkspaceShell />}>
          <Route index element={<HomePage />} />
          <Route path="tools/regex" element={<MapRegexPage />} />
          <Route
            path="tools/disenchant"
            element={
              <Suspense fallback={<ToolLoadingState />}>
                <DisenchantPage />
              </Suspense>
            }
          />
          <Route
            path="tools/crop-rotation"
            element={
              <Suspense fallback={<ToolLoadingState />}>
                <CropRotationPage />
              </Suspense>
            }
          />
          <Route path="about" element={<TrustPage page="about" />} />
          <Route
            path="data-sources"
            element={<TrustPage page="data-sources" />}
          />
          <Route path="privacy" element={<TrustPage page="privacy" />} />
          <Route path="licenses" element={<TrustPage page="licenses" />} />
          <Route
            path="non-affiliation"
            element={<TrustPage page="non-affiliation" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ToolLoadingState() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 text-sm text-stone-500 sm:px-8 lg:px-12">
      Loading Tool...
    </div>
  );
}
