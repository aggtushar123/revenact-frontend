import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchSegments } from '../../features/segments/segmentApi';
import { parseListParams, SCOPES, toListSearch, type ListParams } from '../../features/segments/segmentParams';
import type { SegmentListRow } from '../../features/segments/segmentTypes';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import { EmptyState, ErrorBlock, ItemSkeleton } from '../../components/organizations/portfolio/PortfolioSections';
import { PRIMARY, QUIET } from '../../components/organizations/portfolio/styles';
import { Switch } from '../../components/organizations/portfolio/tileParts';
import { ToolbarSearch } from '../../components/organizations/portfolio/toolbarParts';
import { errorMessage } from '../../components/organizations/portfolio/usePagedRead';
import { useSearchText } from '../../components/organizations/portfolio/useSearchText';
import { SegmentRow } from '../../components/segments/SegmentRow';
import { OrganizationsFrame } from '../organizations/OrganizationsFrame';

type Answer = { key: string; rows: SegmentListRow[] } | { key: string; error: string };

/** /segments (spec §3): Mine, Shared with me and All, a search box and
 *  + New segment, then a row per segment. Scope and search live in the URL. */
export function SegmentsList() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseListParams(search), [search]);
  const update = useCallback((patch: Partial<ListParams>) => setSearch(toListSearch({ ...params, ...patch }), { replace: true }), [params, setSearch]);
  const commitSearch = useCallback((text: string) => update({ search: text }), [update]);
  const [text, setText] = useSearchText(params.search, commitSearch);
  const searchRef = useRef<HTMLInputElement>(null);
  const isSm = useMediaQuery(SM);

  const [attempt, setAttempt] = useState(0);
  const key = `${params.scope}#${params.search}#${attempt}`;
  const [answer, setAnswer] = useState<Answer | null>(null);
  useEffect(() => {
    let alive = true;
    fetchSegments(params.scope, params.search).then(
      (rows) => {
        if (alive) setAnswer({ key, rows });
      },
      (err: unknown) => {
        if (alive) setAnswer({ key, error: errorMessage(err, 'Could not load segments.') });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, params.scope, params.search]);

  // The last list stays while a new scope or search loads.
  const rows = answer && 'rows' in answer ? answer.rows : null;
  const error = answer && 'error' in answer && answer.key === key ? answer.error : null;
  const loading = answer?.key !== key;

  let body;
  if (error && !rows) {
    body = <ErrorBlock message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  } else if (!rows) {
    body = <ItemSkeleton count={4} label="Loading segments" avatar={false} />;
  } else if (rows.length === 0 && params.search) {
    body = (
      <EmptyState
        title={`No segments match "${params.search}"`}
        detail="Try another name, or clear the search."
        action={
          <button type="button" onClick={() => update({ search: '' })} className={`${QUIET} border border-line`}>
            Clear search
          </button>
        }
      />
    );
  } else if (rows.length === 0 && params.scope === 'shared') {
    body = <EmptyState title="Nothing is shared with you yet" detail="When a teammate shares a segment with you or the workspace, it shows here." action={null} />;
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        title="No segments yet"
        detail="A segment is a saved group of organisations, accounts or contacts that match your rules. It updates itself as they change, and can tell you each day who entered and who left."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/segments/new" className={PRIMARY}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New segment
            </Link>
            <Link to="/organizations/list" className={`${QUIET} border border-line`}>
              Filter Organizations, then Save as segment
            </Link>
          </div>
        }
      />
    );
  } else {
    body = (
      <ul aria-label="Segments" aria-busy={loading} className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <SegmentRow key={row.id} row={row} />
        ))}
      </ul>
    );
  }

  return (
    <OrganizationsFrame>
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Switch label="Show" options={SCOPES} value={params.scope} onChange={(scope) => update({ scope })} />
          <ToolbarSearch label="Search segments by name" searchRef={searchRef} value={text} onChange={setText} isSm={isSm} />
          <Link to="/segments/new" className={`${PRIMARY} sm:ml-auto`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New segment
          </Link>
        </div>
        {error && rows ? (
          <p role="alert" className="text-[13px] text-danger">
            {error} Showing the last result.
          </p>
        ) : null}
        {body}
      </div>
    </OrganizationsFrame>
  );
}
