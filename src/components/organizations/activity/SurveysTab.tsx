import { useState } from 'react';
import { ClipboardList, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAppDispatch } from '../../../hooks';
import {
  createSurveyForCustomer,
  createSurveyForAccount,
  fetchSurveysForCustomer,
  fetchSurveysForAccount,
  updateSurvey,
  deleteSurvey,
} from '../../../features/customers/customersSlice';
import type { Survey } from '../../../features/customers/customersSlice';
import { ApiError } from '../../../lib/apiClient';
import { ConfirmDialog } from '../../organizations/ConfirmDialog';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const STATUS_STYLES: Record<Survey['status'], { text: string; bg: string; icon: typeof CheckCircle2 }> = {
  sent: { text: 'text-info', bg: 'bg-info-dim', icon: Clock },
  responded: { text: 'text-success', bg: 'bg-success-dim', icon: CheckCircle2 },
  expired: { text: 'text-ink-faint', bg: 'bg-subtle', icon: XCircle },
};

const TYPE_LABELS: Record<Survey['survey_type'], string> = { nps: 'NPS', csat: 'CSAT', ces: 'CES' };

export interface SurveysTabProps {
  surveys: Survey[];
  isLoading: boolean;
  error: string | null;
  entityType: 'organization' | 'account';
  /** The org itself (entityType 'organization') or its numeric entity
   * id (entityType 'account') — same convention as ActivityFeedProps'
   * own `entityId`. */
  entityId: number | string;
  /** The parent Customer id — needed for an account-level "Log
   * Survey" the same way ActivityFeedProps' own `customerId` is.
   * Omitted (no real parent to create against) disables "Log Survey"
   * rather than posting somewhere meaningless. */
  customerId?: number;
}

// The first ActivityFeed filter that's genuinely writable — every
// sibling tab (Activities/Emails/Tasks/Notes/Tickets/Calendar Events)
// is read-only. "Log Survey" records that one was sent (no real email
// delivery — see Survey model's own backend docstring on why); "Log
// Response" is a small inline score entry per still-`sent` row, not a
// second modal, since it's just one number.
export function SurveysTab({ surveys, isLoading, error, entityType, entityId, customerId }: SurveysTabProps) {
  const dispatch = useAppDispatch();
  const [showLogForm, setShowLogForm] = useState(false);
  const [newType, setNewType] = useState<Survey['survey_type']>('nps');
  const [newSentAt, setNewSentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseScore, setResponseScore] = useState('');
  const [responseError, setResponseError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState<Survey['survey_type']>('nps');
  const [editSentAt, setEditSentAt] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  // Organisation-level: entityId IS the customer id. Account-level:
  // customerId is the parent, entityId the account itself — same
  // resolvability rule ActivityFeed.tsx's own nested fetch effects use.
  const canLog = entityType === 'organization' || customerId !== undefined;

  async function refetch() {
    if (entityType === 'organization') {
      dispatch(fetchSurveysForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchSurveysForAccount({ customerId, accountId: Number(entityId) }));
    }
  }

  async function handleLogSurvey() {
    setLogError(null);
    setIsLogging(true);
    try {
      if (entityType === 'organization') {
        await dispatch(
          createSurveyForCustomer({ customerId: Number(entityId), survey_type: newType, sent_at: newSentAt })
        ).unwrap();
      } else if (customerId !== undefined) {
        await dispatch(
          createSurveyForAccount({
            customerId,
            accountId: Number(entityId),
            survey_type: newType,
            sent_at: newSentAt,
          })
        ).unwrap();
      }
      await refetch();
      setShowLogForm(false);
    } catch (err) {
      setLogError(err instanceof ApiError ? err.message : 'Could not log that survey.');
    } finally {
      setIsLogging(false);
    }
  }

  async function handleLogResponse(survey: Survey) {
    const score = Number(responseScore);
    if (!responseScore.trim() || Number.isNaN(score)) return;
    setResponseError(null);
    try {
      await dispatch(updateSurvey({ id: survey.id, status: 'responded', score })).unwrap();
      setRespondingId(null);
      setResponseScore('');
    } catch (err) {
      setResponseError(err instanceof ApiError ? err.message : 'Could not log that response.');
    }
  }

  function startEdit(survey: Survey) {
    setEditingId(survey.id);
    setEditType(survey.survey_type);
    setEditSentAt(survey.sent_at);
    setEditScore(survey.score != null ? String(survey.score) : '');
    setEditError(null);
  }

  async function handleSaveEdit(survey: Survey) {
    setEditError(null);
    setIsSavingEdit(true);
    try {
      await dispatch(
        updateSurvey({
          id: survey.id,
          survey_type: editType,
          sent_at: editSentAt,
          ...(survey.status === 'responded' && { score: Number(editScore) }),
        })
      ).unwrap();
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Could not save those changes.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  // One-way, no confirm — same "Log Response" convention: an immediate
  // status move, no undo built for either.
  function handleMarkExpired(survey: Survey) {
    dispatch(updateSurvey({ id: survey.id, status: 'expired' }));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading surveys…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-sm font-semibold text-danger">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 bg-subtle/40 font-sans flex flex-col gap-4">
      {canLog && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowLogForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[12px] font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Survey
          </button>
        </div>
      )}

      {showLogForm && (
        <div className="flex items-end gap-2 p-3 bg-surface rounded-xl border border-line-subtle shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as Survey['survey_type'])}
              className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            >
              <option value="nps">NPS</option>
              <option value="csat">CSAT</option>
              {entityType === 'organization' && <option value="ces">CES</option>}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Sent</label>
            <input
              type="date"
              value={newSentAt}
              onChange={(e) => setNewSentAt(e.target.value)}
              className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleLogSurvey}
            disabled={isLogging}
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogging ? 'Logging…' : 'Log'}
          </button>
          <button
            onClick={() => { setShowLogForm(false); setLogError(null); }}
            className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}
      {logError && <p className="text-[12.5px] text-danger">{logError}</p>}

      {surveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <ClipboardList className="w-10 h-10 text-ink-faint mb-2" />
          <span className="text-sm font-semibold text-ink-faint">No surveys logged yet</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {surveys.map((survey) => {
            const statusStyle = STATUS_STYLES[survey.status];
            const StatusIcon = statusStyle.icon;

            if (editingId === survey.id) {
              return (
                <div key={survey.id} className="bg-surface border border-accent/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Type</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as Survey['survey_type'])}
                        className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                      >
                        <option value="nps">NPS</option>
                        <option value="csat">CSAT</option>
                        {entityType === 'organization' && <option value="ces">CES</option>}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Sent</label>
                      <input
                        type="date"
                        value={editSentAt}
                        onChange={(e) => setEditSentAt(e.target.value)}
                        className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                      />
                    </div>
                    {survey.status === 'responded' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Score</label>
                        <input
                          type="number"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          className="w-20 px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleSaveEdit(survey)}
                      disabled={isSavingEdit}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingEdit ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                  {editError && <p className="text-[12.5px] text-danger mt-2">{editError}</p>}
                </div>
              );
            }

            return (
              <div
                key={survey.id}
                className="bg-surface border border-line/80 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg ${statusStyle.bg} ${statusStyle.text} flex items-center justify-center shrink-0`}>
                    <StatusIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold text-ink">{TYPE_LABELS[survey.survey_type]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                        {survey.status_display}
                      </span>
                    </div>
                    <span className="text-[12px] text-ink-faint font-medium">Sent {formatDate(survey.sent_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {survey.status === 'responded' ? (
                    <span className="text-[15px] font-extrabold text-ink">{survey.score}</span>
                  ) : survey.status === 'sent' ? (
                    respondingId === survey.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={responseScore}
                          onChange={(e) => setResponseScore(e.target.value)}
                          placeholder="Score"
                          autoFocus
                          className="w-20 px-2 py-1 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => handleLogResponse(survey)}
                          className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[11.5px] font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setRespondingId(null); setResponseError(null); }}
                          className="px-1.5 py-1 text-[11.5px] font-semibold text-ink-muted hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setRespondingId(survey.id); setResponseScore(''); }}
                          className="text-[12px] font-bold text-accent hover:underline"
                        >
                          Log Response
                        </button>
                        <button
                          onClick={() => handleMarkExpired(survey)}
                          className="text-[12px] font-semibold text-ink-faint hover:text-ink hover:underline"
                        >
                          Mark Expired
                        </button>
                      </>
                    )
                  ) : null}
                  <button
                    onClick={() => startEdit(survey)}
                    className="text-[12px] font-semibold text-ink-faint hover:text-ink hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingSurvey(survey)}
                    className="text-[12px] font-semibold text-ink-faint hover:text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {responseError && <p className="text-[12.5px] text-danger">{responseError}</p>}

          {deletingSurvey && (
            <ConfirmDialog
              title={`Delete this ${TYPE_LABELS[deletingSurvey.survey_type]} survey?`}
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
      )}
    </div>
  );
}
