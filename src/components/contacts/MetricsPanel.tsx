import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserCheck, Smile, Frown } from 'lucide-react';
import { fetchContactStats } from '../../features/customers/customersSlice';
import type { AppDispatch, RootState } from '../../store';

// Every number here used to be hardcoded regardless of how many
// contacts actually existed — now backed by GET /api/v1/contacts/stats/
// (ContactStatsView), same "spans every contact, not just the current
// page" reasoning as the Organizations page's own MetricsPanel and its
// GET /api/v1/customers/stats/.
export function MetricsPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { contactStats, contactStatsLoading, contactStatsError } = useSelector(
    (state: RootState) => state.customers
  );

  useEffect(() => {
    dispatch(fetchContactStats());
  }, [dispatch]);

  const total = contactStats?.total ?? 0;
  const active = contactStats?.active ?? 0;
  const sentimentPct = contactStats?.sentiment_pct ?? { positive: 0, neutral: 0, negative: 0 };
  const growth = contactStats?.growth_30d_pct ?? null;

  return (
    <div className="flex items-start justify-between w-full font-sans">

      {/* Total Contacts Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Total Contacts</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-info-dim flex items-center justify-center text-info">
             <Users className="w-5 h-5" />
          </div>
          <span className="text-3xl font-bold text-ink leading-tight">
            {contactStatsLoading ? '—' : total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="w-px h-16 bg-line mx-4 mt-2"></div>

      {/* Active Contacts Section */}
      <div className="flex flex-col flex-1">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">Active Contacts</div>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-success-dim flex items-center justify-center text-success">
               <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-3xl font-light text-ink leading-none tracking-tight">
              {contactStatsLoading ? '—' : active.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="w-px h-16 bg-line mx-4 mt-2"></div>

      {/* Sentiment Overview Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Sentiment Overview</span>
        </div>
        <div className="flex items-center justify-between w-[80%] pr-4 mt-1">
           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-0.5">
                <Smile className="w-3.5 h-3.5 text-success" /> Positive
              </div>
              <span className="text-xl font-bold text-ink leading-tight">{sentimentPct.positive}%</span>
           </div>

           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-warning"></span> Neutral
              </div>
              <span className="text-xl font-bold text-ink leading-tight">{sentimentPct.neutral}%</span>
           </div>

           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-0.5">
                <Frown className="w-3.5 h-3.5 text-danger" /> Negative
              </div>
              <span className="text-xl font-bold text-ink leading-tight">{sentimentPct.negative}%</span>
           </div>
        </div>
      </div>

      <div className="w-px h-16 bg-line mx-4 mt-2"></div>

      {/* Growth — compares today's total against the total as of 30
          days ago (ContactStatsView's own growth_30d_pct); null when
          there were no contacts yet 30 days ago, since a percentage
          change off a zero base is undefined, not zero. */}
      <div className="flex flex-col pr-4">
        <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold text-ink tracking-wide">
          Growth (30d)
        </div>
        <div className="flex flex-col mt-2">
          {growth === null ? (
            <span className="text-xl font-bold text-ink-faint leading-tight">New</span>
          ) : (
            <span className={`text-xl font-bold leading-tight ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
              {growth >= 0 ? '+' : ''}{growth}%
            </span>
          )}
          <span className="text-[11px] font-medium text-ink-faint mt-0.5 whitespace-nowrap">vs 30 days ago</span>
        </div>
      </div>

      {contactStatsError && (
        <span className="sr-only" role="alert">{contactStatsError}</span>
      )}
    </div>
  );
}
