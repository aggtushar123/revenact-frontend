import { ActivityTypeDonut } from '../../../../components/dashboard/charts/ActivityTypeDonut';
import { ActivitySentimentDonut } from '../../../../components/dashboard/charts/ActivitySentimentDonut';
import { ActivityDetailedTable } from '../../../../components/dashboard/charts/ActivityDetailedTable';
import { SentimentOverTimeLine } from '../../../../components/dashboard/charts/SentimentOverTimeLine';

export function ControlsView() {
  return (
    <div className="w-full h-full flex flex-col gap-4 pb-12">
      {/* Top Row: Type Donut (1/3) + Detailed Table (2/3) */}
      <div className="flex flex-col xl:flex-row gap-4 h-full min-h-[500px]">
        {/* Top Left: Activity Type Donut */}
        <div className="xl:w-[32%] bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden shrink-0">
          <ActivityTypeDonut />
        </div>
        {/* Top Right: Detailed Activity Breakdown Table */}
        <div className="xl:flex-1 bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <ActivityDetailedTable />
        </div>
      </div>

      {/* Bottom Row: Sentiment Donut (1/3) + Sentiment Line Chart (2/3) */}
      <div className="flex flex-col xl:flex-row gap-4 h-full min-h-[380px]">
        {/* Bottom Left: Activity Sentiment Donut */}
        <div className="xl:w-[32%] bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden shrink-0">
          <ActivitySentimentDonut />
        </div>
        {/* Bottom Right: Sentiment Over Time Line Chart */}
        <div className="xl:flex-1 bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <SentimentOverTimeLine />
        </div>
      </div>
    </div>
  );
}
