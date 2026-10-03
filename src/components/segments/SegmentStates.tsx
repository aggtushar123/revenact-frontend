import { Link } from 'react-router-dom';
import { EmptyState, ErrorBlock, ItemSkeleton } from '../organizations/portfolio/PortfolioSections';
import { QUIET } from '../organizations/portfolio/styles';

export function SegmentLoading() {
  return <ItemSkeleton count={3} label="Loading segment" avatar={false} />;
}

/** A 404: missing and not-shared read the same (backend Access rule). */
export function SegmentMissing() {
  return (
    <EmptyState
      title="Segment not found"
      detail="It may have been deleted, or it isn't shared with you."
      action={
        <Link to="/segments" className={`${QUIET} border border-line`}>
          All segments
        </Link>
      }
    />
  );
}

export function SegmentFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorBlock message={message} onRetry={onRetry} />;
}
