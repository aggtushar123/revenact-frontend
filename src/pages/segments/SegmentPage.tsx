import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { detailPanelId, detailTabId } from '../../features/organizations/detailParams';
import { ruleSentence } from '../../features/segments/ruleSentence';
import { fetchMembers } from '../../features/segments/segmentApi';
import { membersQuery, parseSegmentPage, toSegmentPageSearch, type SegmentPageParams, type SegmentTab } from '../../features/segments/segmentParams';
import type { Segment, SegmentMembersPage } from '../../features/segments/segmentTypes';
import { DetailTabs } from '../../components/organizations/detail/DetailTabs';
import { DismissibleAlert } from '../../components/organizations/portfolio/DismissibleAlert';
import { MONO } from '../../components/organizations/portfolio/styles';
import { ChangesTab } from '../../components/segments/ChangesTab';
import { MembersTab } from '../../components/segments/MembersTab';
import { SegmentHeader } from '../../components/segments/SegmentHeader';
import { SegmentFailed, SegmentLoading, SegmentMissing } from '../../components/segments/SegmentStates';
import { SegmentTiles } from '../../components/segments/SegmentTiles';
import { useAttributes } from '../../components/segments/useBuilderOptions';
import { useSegment } from '../../components/segments/useSegment';
import { OrganizationsFrame } from '../organizations/OrganizationsFrame';

const TABS: readonly { key: SegmentTab; label: string }[] = [
  { key: 'members', label: 'Members' },
  { key: 'changes', label: 'Changes' },
];

/** /segments/:id (spec §3): the header, the tiles, "N more members you
 *  can't open" for a shared reader, then Members or Changes (`?tab=`). */
export function SegmentPage() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    return (
      <OrganizationsFrame>
        <SegmentMissing />
      </OrganizationsFrame>
    );
  }
  return <LoadedSegment key={id} id={Number(id)} />;
}

function LoadedSegment({ id }: { id: number }) {
  const [load, replace, retry] = useSegment(id);
  if (load.status === 'ready') return <SegmentView segment={load.segment} onReplace={replace} />;
  return (
    <OrganizationsFrame>
      {load.status === 'loading' ? <SegmentLoading /> : null}
      {load.status === 'missing' ? <SegmentMissing /> : null}
      {load.status === 'failed' ? <SegmentFailed message={load.message} onRetry={retry} /> : null}
    </OrganizationsFrame>
  );
}

/** The tiles and hidden count: one `limit=1` read of the members, over all
 *  of them whatever the tab's search (plan Decision 7). The last totals stay
 *  while a reload after a pin is in flight. */
function useTotals(id: number, version: number) {
  const key = `${id}#${version}`;
  const [answer, setAnswer] = useState<{ key: string; page: SegmentMembersPage<unknown> | null } | null>(null);
  useEffect(() => {
    let alive = true;
    fetchMembers<unknown>(id, 'limit=1').then(
      (page) => {
        if (alive) setAnswer({ key, page });
      },
      () => {
        if (alive) setAnswer({ key, page: null });
      },
    );
    return () => {
      alive = false;
    };
  }, [id, key]);
  return { page: answer?.page ?? null, failed: answer?.key === key && answer.page === null };
}

function SegmentView({ segment, onReplace }: { segment: Segment; onReplace: (segment: Segment) => void }) {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseSegmentPage(search, segment.kind), [search, segment.kind]);
  const update = useCallback(
    (patch: Partial<SegmentPageParams>) => setSearch(toSegmentPageSearch({ ...params, ...patch }), { replace: true }),
    [params, setSearch],
  );
  const idBase = useId();
  const attributes = useAttributes();
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const totals = useTotals(segment.id, version);
  const parts = useMemo(() => ruleSentence(segment.rules, segment.kind, segment.labels, attributes), [segment, attributes]);
  const hidden = totals.page?.hidden_count ?? 0;
  // The tab components draw their own role="tabpanel"; DetailTabs' ids make
  // it this tab's panel, so there is never a tabpanel inside a tabpanel.
  const panel = { id: detailPanelId(idBase, params.tab), labelledBy: detailTabId(idBase, params.tab) };

  return (
    <OrganizationsFrame>
      <div className="flex flex-col gap-4 pb-6">
        <SegmentHeader segment={segment} parts={parts} exportQuery={membersQuery(params, segment.kind)} onNotice={setNotice} />
        {notice ? <DismissibleAlert message={notice} onDismiss={() => setNotice(null)} /> : null}
        <div className="@container">
          <SegmentTiles summary={totals.page?.summary ?? null} kind={segment.kind} failed={totals.failed} />
        </div>
        {hidden > 0 ? (
          <p data-part="hidden-members" className="text-[13px] text-ink-muted">
            <span className={MONO}>{hidden}</span> more {hidden === 1 ? 'member' : 'members'} you can't open.
          </p>
        ) : null}
        <DetailTabs idBase={idBase} active={params.tab} tabs={TABS} label="Segment views" onChange={(tab) => update({ tab })} />
        {params.tab === 'members' ? (
          <MembersTab
            segment={segment}
            params={params}
            update={update}
            version={version}
            onChanged={(state) => {
              onReplace({ ...segment, ...state });
              setVersion((v) => v + 1);
            }}
            onNotice={setNotice}
            panel={panel}
          />
        ) : (
          <ChangesTab segment={segment} days={params.days} onDays={(days) => update({ days })} attributes={attributes} panel={panel} />
        )}
      </div>
    </OrganizationsFrame>
  );
}
