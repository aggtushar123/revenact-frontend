import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, ThumbsUp, Smile, Gauge, Pencil, Trash2, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchSurveys, fetchCustomers, updateSurvey, deleteSurvey } from '../../features/customers/customersSlice';
import type { Survey } from '../../features/customers/customersSlice';
import { SurveyFormModal } from '../../components/pipelines/SurveyFormModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { SurveyTrendChart } from './SurveyTrendChart';
import { EntityAvatar } from '../../components/shared';
import { companyLabel } from '../../features/customers/formatters';
import { formatDate } from '../../features/customers/formatters';


const TYPE_CARDS: { type: Survey['survey_type']; label: string; icon: typeof ThumbsUp }[] = [
  { type: 'nps', label: 'NPS', icon: ThumbsUp },
  { type: 'csat', label: 'CSAT', icon: Smile },
  { type: 'ces', label: 'CES', icon: Gauge },
];

const STATUS_LABEL_COLOR: Record<Survey['status'], string> = {
  sent: 'text-info bg-info-dim',
  responded: 'text-success bg-success-dim',
  expired: 'text-ink-faint bg-subtle',
};

// Structurally lighter than Health/Lifecycle — no currency dimension,
// so no COUNT/MRR-style toggle needed. Rollup cards are computed
// client-side from the same unpaginated `surveys` list PipelinesPage's
// own "Pipelines Overview" banner uses for its totals — no separate
// stats endpoint (see SurveyListView's own docstring on the backend).
export function SurveysPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { surveys, surveysLoading, surveysError, customers } = useAppSelector((state) => state.customers);
  const [selectedType, setSelectedType] = useState<Survey['survey_type'] | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  // ?customer=<id> narrows the page to one organization (spec 2026-09-27
  // §5); the organization page's "Manage surveys" links here with it.
  const [search, setSearch] = useSearchParams();
  const pickerId = useId();
  const customerParam = search.get('customer') ?? '';
  const customerId = /^[1-9]\d*$/.test(customerParam) ? Number(customerParam) : null;

  useEffect(() => {
    dispatch(fetchSurveys(customerId ?? undefined));
  }, [dispatch, customerId]);
  useEffect(() => {
    // The company pickers (Log Survey, and the organization filter) — same
    // source as PipelinesPage's own Add Opportunity/Add Risk.
    dispatch(fetchCustomers());
  }, [dispatch]);

  const companies = useMemo(() => customers.map((c) => ({ id: c.id, name: c.name })), [customers]);
  // The picker lists the first page of organizations; one not on it is
  // named from its surveys, or by its id.
  const filteredName =
    customerId === null
      ? null
      : (companies.find((c) => c.id === customerId)?.name ??
        surveys.flatMap((s) => s.companies).find((c) => c.id === customerId)?.name ??
        `Organization ${customerId}`);

  const rollup = useMemo(() => {
    const buckets: Record<Survey['survey_type'], { sent: number; responded: number; scoreSum: number }> = {
      nps: { sent: 0, responded: 0, scoreSum: 0 },
      csat: { sent: 0, responded: 0, scoreSum: 0 },
      ces: { sent: 0, responded: 0, scoreSum: 0 },
    };
    for (const survey of surveys) {
      const bucket = buckets[survey.survey_type];
      bucket.sent += 1;
      if (survey.status === 'responded' && survey.score !== null) {
        bucket.responded += 1;
        bucket.scoreSum += survey.score;
      }
    }
    return buckets;
  }, [surveys]);

  const rows = useMemo(
    () => (selectedType ? surveys.filter((s) => s.survey_type === selectedType) : surveys),
    [surveys, selectedType]
  );

  function handleRowClick(survey: Survey) {
    // Every Survey resolves to at least one ultimate parent Customer
    // via `companies` (org-level: itself; account-level: its own
    // Account's parent) — same property Opportunity/Risk already use.
    // Landing on that Customer's own Details page is also *more*
    // complete than a specific Account's own page would be for an
    // account-level survey: CustomerSurveyListView already rolls up
    // both organisation-level and every Account's own surveys there,
    // so the one just clicked shows up either way, without needing a
    // second live fetch just to build a real AccountRow for
    // accounts/Details.tsx's own nav-state requirement (see that
    // page's own docstring on why it needs one to show real data).
    const customerId = survey.companies[0]?.id;
    if (customerId === undefined) return;
    // The organization page's Story, filtered to Feedback (surveys).
    navigate(`/organizations/${customerId}?group=feedback`);
  }

  // One-way, no confirm — same "Log Response" convention: an immediate
  // status move, no undo built for either.
  function handleMarkExpired(survey: Survey) {
    dispatch(updateSurvey({ id: survey.id, status: 'expired' }));
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Surveys</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            {filteredName ? `Every NPS/CSAT/CES survey logged for ${filteredName} and its accounts.` : 'Every NPS/CSAT/CES survey logged across every Organization and Account.'}
          </p>
        </div>
        <button
          onClick={() => setIsLogging(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Survey
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={pickerId} className="text-[13px] font-semibold text-ink">
          Organization
        </label>
        <select
          id={pickerId}
          value={customerId === null ? '' : String(customerId)}
          onChange={(e) => setSearch(e.target.value ? { customer: e.target.value } : {})}
          className="min-h-11 w-full max-w-xs rounded-lg border border-line bg-surface px-3 text-[13px] text-ink sm:min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <option value="">All organizations</option>
          {customerId !== null && !companies.some((c) => c.id === customerId) ? (
            <option value={String(customerId)}>{filteredName}</option>
          ) : null}
          {companies.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {surveysError && <p className="text-[12.5px] text-danger">{surveysError}</p>}

      <div className="grid grid-cols-3 gap-4">
        {TYPE_CARDS.map(({ type, label, icon: Icon }) => {
          const bucket = rollup[type];
          const responseRate = bucket.sent > 0 ? Math.round((bucket.responded / bucket.sent) * 100) : null;
          const avgScore = bucket.responded > 0 ? Math.round(bucket.scoreSum / bucket.responded) : null;
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(isActive ? null : type)}
              aria-pressed={isActive}
              className={`text-left p-4 rounded-xl border shadow-sm transition-all ${
                isActive ? 'border-accent bg-accent-dim/30' : 'border-line-subtle bg-surface hover:bg-subtle/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-bold text-ink">{label}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[24px] font-bold text-ink leading-none">{bucket.sent}</span>
                <span className="text-[11.5px] text-ink-faint font-medium">sent</span>
              </div>
              <div className="text-[12px] text-ink-muted font-medium">
                {responseRate === null ? 'No responses yet' : `${responseRate}% responded`}
                {avgScore !== null && ` · avg ${avgScore}`}
              </div>
            </button>
          );
        })}
      </div>

      <SurveyTrendChart surveys={surveys} />

      <div className="flex-1 bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-line-subtle flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-ink">
            {selectedType ? TYPE_CARDS.find((c) => c.type === selectedType)?.label : 'All'} Surveys — {rows.length}
          </h2>
          {selectedType && (
            <button
              onClick={() => setSelectedType(null)}
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {surveysLoading ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-ink-faint">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-center">
            <ClipboardList className="w-8 h-8 text-ink-faint mb-1" />
            <p className="text-[13px] font-semibold text-ink-muted">{filteredName ? `No surveys logged for ${filteredName} yet.` : 'No surveys logged yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle/40 border-b border-line-subtle">
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Company</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Type</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Sent</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Status</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Score</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {rows.map((survey) => (
                  <tr
                    key={survey.id}
                    onClick={() => handleRowClick(survey)}
                    className="hover:bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <EntityAvatar name={companyLabel(survey.companies)} className="w-6 h-6 rounded-full text-[10px]" />
                        <span className="text-[13px] font-semibold text-ink truncate">
                          {companyLabel(survey.companies)}
                          {survey.account_name ? ` • ${survey.account_name}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">
                      {survey.survey_type_display}
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{formatDate(survey.sent_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${STATUS_LABEL_COLOR[survey.status]}`}>
                        {survey.status_display}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-bold text-ink">
                      {survey.score ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {survey.status === 'sent' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkExpired(survey);
                            }}
                            title="Mark Expired"
                            className="p-1.5 text-ink-faint hover:text-ink hover:bg-subtle rounded-md transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSurvey(survey);
                          }}
                          title="Edit"
                          className="p-1.5 text-ink-faint hover:text-ink hover:bg-subtle rounded-md transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSurvey(survey);
                          }}
                          title="Delete"
                          className="p-1.5 text-ink-faint hover:text-danger hover:bg-danger-dim rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isLogging && <SurveyFormModal companies={companies} onClose={() => setIsLogging(false)} />}

      {editingSurvey && (
        <SurveyFormModal
          survey={editingSurvey}
          onClose={() => setEditingSurvey(null)}
          onDeleteRequest={() => {
            setDeletingSurvey(editingSurvey);
            setEditingSurvey(null);
          }}
        />
      )}

      {deletingSurvey && (
        <ConfirmDialog
          title={`Delete this ${TYPE_CARDS.find((c) => c.type === deletingSurvey.survey_type)?.label} survey?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteSurvey(deletingSurvey.id)).unwrap();
          }}
          onClose={() => setDeletingSurvey(null)}
        />
      )}
    </div>
  );
}
