import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { WorkspaceShell } from '@/components/workspace-shell';
import { HomePage } from '@/pages/home-page';
import { MapRegexPage } from '@/pages/map-regex-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { TrustPage } from '@/pages/trust-page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WorkspaceShell />}>
          <Route index element={<HomePage />} />
          <Route path="tools/regex" element={<MapRegexPage />} />
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
