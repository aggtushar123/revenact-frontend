import { useState, useMemo } from 'react';
import type { HealthStatus } from '../../../../features/health/types';
import { useHealthOverview } from './useHealthOverview';
import { HealthEmpty, HealthError, HealthLoading, HealthTruncatedNotice } from './HealthDataState';
import { CurrentHealthDonut } from './charts/CurrentHealthDonut';
import { HealthByOwnerStackedBar } from './charts/HealthByOwnerStackedBar';
import { CSMPulseBar } from './charts/CSMPulseBar';
import { AIPulseBar } from './charts/AIPulseBar';
import { AccountHealthDetailTable } from './charts/AccountHealthDetailTable';
import { AccountsLastTouchLine } from './charts/AccountsLastTouchLine';
import { AccountHealthByRecruiters } from './charts/AccountHealthByRecruiters';
import { HealthChangeOverTimeStacked } from './charts/HealthChangeOverTimeStacked';
import { AccountsByRenewalDateBar } from './charts/AccountsByRenewalDateBar';

export function ControlsView() {
  const [activeFilter, setActiveFilter] = useState<HealthStatus | null>(null);

  const { rows, error, truncated, isInitialLoad, hasLoaded } = useHealthOverview();

  // Derived filtered dataset for all child charts
  const filteredData = useMemo(() => {
    if (!activeFilter) return rows;
    return rows.filter(row => row.healthStatus === activeFilter);
  }, [rows, activeFilter]);

  if (isInitialLoad) return <HealthLoading />;
  if (error) return <HealthError message={error} />;
  if (hasLoaded && rows.length === 0) return <HealthEmpty />;

  return (
    <div className="w-full h-full flex flex-col gap-4 pb-12">
      {truncated && <HealthTruncatedNotice />}
      <div className="flex items-center justify-end px-2 h-[24px]">
        {activeFilter && (
          <button 
            onClick={() => setActiveFilter(null)}
            className="text-xs bg-danger-dim hover:opacity-80 text-danger font-bold py-1 px-3 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-danger" />
            Clear active filter: {activeFilter}
          </button>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="flex flex-col lg:flex-row gap-4 h-auto">
        
        {/* LEFT COLUMN */}
        <div className="flex-[2] flex flex-col gap-4">
          
          {/* Top Row inside Left Column */}
          <div className="flex flex-col xl:flex-row gap-4 h-[280px]">
             {/* Column 1: Donut */}
            <div className="xl:w-[40%] bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0 flex flex-col">
              <CurrentHealthDonut 
                data={rows} 
                activeFilter={activeFilter}
                onSegmentClick={setActiveFilter}
                filteredCount={filteredData.length}
              />
            </div>

            {/* Column 2: Health by Owner */}
            <div className="flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden flex flex-col">
              <HealthByOwnerStackedBar data={filteredData} />
            </div>
          </div>

          {/* Bottom Row inside Left Column (Accounts by Last Touch) */}
          <div className="bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden h-[280px]">
            <AccountsLastTouchLine data={filteredData} />
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-[1] flex flex-col gap-4">
           {/* CSM Pulse */}
           <div className="flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden min-h-[280px]">
            <CSMPulseBar data={filteredData} />
          </div>
           {/* AI Pulse */}
           <div className="flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden min-h-[280px]">
            <AIPulseBar data={filteredData} />
          </div>
        </div>

      </div>

      {/* Full Width Renewal Graph */}
      <div className="w-full bg-surface border border-line-subtle shadow-sm rounded-lg flex flex-col overflow-hidden min-h-[300px]">
        <AccountsByRenewalDateBar data={filteredData} />
      </div>

      {/* Analytics Insights Row */}
      <div className="flex flex-col xl:flex-row gap-4 h-[320px]">
        {/* Recruiter Stats */}
        <div className="xl:w-[32%] bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0">
          <AccountHealthByRecruiters data={filteredData} />
        </div>
        {/* Time Tracking */}
        <div className="xl:flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden">
          <HealthChangeOverTimeStacked data={filteredData} />
        </div>
      </div>

      {/* Detail Table */}
      <div className="w-full bg-surface border border-line-subtle shadow-sm rounded-lg flex flex-col overflow-hidden min-h-[400px]">
        <AccountHealthDetailTable data={filteredData} />
      </div>
    </div>
  );
}
