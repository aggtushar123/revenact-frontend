import { ActivityTypeDonut } from '../../../../components/dashboard/charts/ActivityTypeDonut';
import { ActivitySentimentDonut } from '../../../../components/dashboard/charts/ActivitySentimentDonut';
import { ActivityDetailedTable } from '../../../../components/dashboard/charts/ActivityDetailedTable';
import { SentimentOverTimeLine } from '../../../../components/dashboard/charts/SentimentOverTimeLine';
import { ActivitiesByAIAreaDonut } from '../../../../components/dashboard/charts/ActivitiesByAIAreaDonut';
import { ActivitiesByAICategoryBar } from '../../../../components/dashboard/charts/ActivitiesByAICategoryBar';
import { ActivitiesByAISubCategoryBar } from '../../../../components/dashboard/charts/ActivitiesByAISubCategoryBar';

export function ControlsView() {
  return (
    <div className="w-full h-full flex flex-col gap-4 pb-12">
      {/* Top Row: Type Donut (1/3) + Detailed Table (2/3) */}
      <div className="flex flex-col xl:flex-row gap-4 h-full min-h-[500px]">
        {/* Top Left: Activity Type Donut */}
        <div className="xl:w-[32%] bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0">
          <ActivityTypeDonut />
        </div>
        {/* Top Right: Detailed Activity Breakdown Table */}
        <div className="xl:flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden flex flex-col">
          <ActivityDetailedTable />
        </div>
      </div>

      {/* Bottom Row: Sentiment Donut (1/3) + Sentiment Line Chart (2/3) */}
      <div className="flex flex-col xl:flex-row gap-4 h-full min-h-[380px]">
        {/* Bottom Left: Activity Sentiment Donut */}
        <div className="xl:w-[32%] bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0">
          <ActivitySentimentDonut />
        </div>
        {/* Bottom Right: Sentiment Over Time Line Chart */}
        <div className="xl:flex-1 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden flex flex-col">
          <SentimentOverTimeLine />
        </div>
      </div>

      {/* Third Row: AI Area Donut (1/3) + AI Category Bar (1/3) + AI Sub Category Bar (1/3) */}
      <div className="flex flex-col xl:flex-row gap-4 h-full min-h-[380px]">
        {/* Left: Activities By AI Area Donut */}
        <div className="xl:w-1/3 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0 border-t-4 border-t-accent">
          <ActivitiesByAIAreaDonut />
        </div>
        {/* Middle: Activities By AI Category Bar */}
        <div className="xl:w-1/3 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0 border-t-4 border-t-accent">
          <ActivitiesByAICategoryBar />
        </div>
        {/* Right: Activities By AI Sub Category Bar */}
        <div className="xl:w-1/3 bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden shrink-0 border-t-4 border-t-accent">
          <ActivitiesByAISubCategoryBar />
        </div>
      </div>
    </div>
  );
}
