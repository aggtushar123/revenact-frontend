import { KPIGrid } from './charts/KPIGrid';
import { PriorityDonut } from './charts/PriorityDonut';
import { StatusDonut } from './charts/StatusDonut';
import { OriginBar } from './charts/OriginBar';
import { AssigneesStackedBar } from './charts/AssigneesStackedBar';
import { SentimentLineChart } from './charts/SentimentLineChart';

export function ControlsView() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Row: KPI Grid, Priority Donut, Status Donut, Origin Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[300px]">
        {/* KPI Grid */}
        <div className="lg:col-span-1">
          <KPIGrid />
        </div>

        {/* Priority Donut */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <PriorityDonut />
        </div>

        {/* Status Donut */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <StatusDonut />
        </div>

        {/* Origin Bar */}
        <div className="w-full lg:w-[240px] shrink-0">
          <OriginBar />
        </div>
      </div>

      {/* Bottom Row: Assignees & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
        {/* Assignees Stacked Bar */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <AssigneesStackedBar />
        </div>

        {/* Sentiment Line Chart */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <SentimentLineChart />
        </div>
      </div>
    </div>
  );
}
