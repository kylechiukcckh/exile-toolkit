import { PatchNotesSection } from '@/components/home/patch-notes-section';
import { RetentionDashboard } from '@/components/home/retention-dashboard';
import {
  serviceLabels,
  type WorkspaceOutletContext
} from '@/components/workspace-shell';
import { useHomeFeed } from '@/hooks/use-home-feed';
import { useOutletContext } from 'react-router-dom';

export function HomePage() {
  const { serviceState } = useOutletContext<WorkspaceOutletContext>();
  const { snapshot, unavailable } = useHomeFeed();

  if (!snapshot) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <span role="status" className="sr-only">
          {serviceLabels[serviceState]}
        </span>
        <p className="text-sm text-stone-500">
          {unavailable
            ? 'Homepage data is temporarily unavailable.'
            : 'Loading latest league data...'}
        </p>
      </section>
    );
  }

  return (
    <>
      <span role="status" className="sr-only">
        {serviceLabels[serviceState]}
      </span>
      <PatchNotesSection patch={snapshot.patch} />
      <RetentionDashboard
        retention={snapshot.retention}
        retrievedAt={snapshot.retrievedAt}
      />
    </>
  );
}
