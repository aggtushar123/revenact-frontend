import type { To } from 'react-router-dom';
import type { Contact } from '../../features/customers/customersSlice';
import { ListSkeleton } from '../organizations/detail/ListParts';
import { LIST } from '../organizations/detail/listStyles';
import { EmptyState, ErrorBlock, MoreButton } from '../organizations/portfolio/PortfolioSections';
import { QUIET } from '../organizations/portfolio/styles';
import { ContactListItem } from './ContactListItem';

/** The Contacts list (spec 2026-09-28 §3): an item per person, "Load more"
 *  at the end, and designed loading, error and empty states. */
export function ContactList({
  rows,
  count,
  loading,
  error,
  filtered,
  next,
  loadingMore,
  moreError,
  selectedId,
  linkFor,
  onRetry,
  onClear,
  onMore,
}: {
  rows: Contact[];
  count: number;
  loading: boolean;
  error: string | null;
  /** Whether a search or filter narrows the list (the empty state offers to clear them). */
  filtered: boolean;
  next: string | null;
  loadingMore: boolean;
  moreError: string | null;
  selectedId: number | null;
  linkFor: (id: number) => To;
  onRetry: () => void;
  onClear: () => void;
  onMore: () => void;
}) {
  if (error) return <ErrorBlock message={error} onRetry={onRetry} />;
  if (loading) return <ListSkeleton label="Loading people" rows={6} />;
  if (rows.length === 0) {
    return filtered ? (
      <EmptyState
        title="Nobody matches"
        detail="Try another word or filter, or clear them."
        action={
          <button type="button" onClick={onClear} className={`${QUIET} border border-line`}>
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title="No people yet"
        detail="People appear here when they are added to an organisation or an account."
        action={null}
      />
    );
  }
  return (
    <div>
      <ul aria-label="People" className={LIST}>
        {rows.map((contact) => (
          <ContactListItem key={contact.id} contact={contact} to={linkFor(contact.id)} selected={contact.id === selectedId} />
        ))}
      </ul>
      <MoreButton next={next} loading={loadingMore} error={moreError} label={`Load more (${rows.length} of ${count})`} onClick={onMore} />
    </div>
  );
}
