import { CheckCircle, ExternalLink, MoreHorizontal, Sparkles, Eye, Link2 } from 'lucide-react';
import { ACTIVITIES_DATA, type ActivityItem } from '../activityData';

export function ActivitiesTab({ entityId, healthColor = 'bg-teal-400' }: { entityId: number | string; healthColor?: string }) {
  const activities = ACTIVITIES_DATA.filter(a => a.orgId == entityId);

  const grouped = activities.reduce<Record<string, ActivityItem[]>>((acc, act) => {
    if (!acc[act.group]) acc[act.group] = [];
    acc[act.group].push(act);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <CheckCircle className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No activities found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/20">
      <div className="flex flex-col gap-8 relative">
        <div className="absolute left-[13px] top-10 bottom-4 w-0.5 bg-indigo-100" />
        {sortedGroups.map(([group, items]) => (
          <div key={group} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-[28px] h-[28px] rounded-full bg-white border border-indigo-50 flex items-center justify-center shrink-0 z-10">
                <div className="w-3 h-3 border-2 border-indigo-200 rounded-md" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group}</span>
            </div>
            <div className="flex flex-col gap-4 ml-[13px] pl-[15px]">
              {items.map(activity => (
                <ActivityCard key={activity.id} activity={activity} healthColor={healthColor} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity, healthColor }: { activity: ActivityItem; healthColor: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col gap-4 relative group cursor-pointer hover:border-indigo-100 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-[14px] group-hover:text-indigo-700 transition-colors">{activity.type}</h4>
            <ExternalLink className="w-3 h-3 text-gray-300" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-bold text-gray-400 pr-5">{activity.date}</span>
          <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
      </div>
      <div className="flex items-center gap-4 pl-9">
        <div className={`w-3 h-3 rounded-full ${healthColor}`} />
        <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100">
          <Sparkles className="w-3 h-3" />
          Pulse
        </div>
        {activity.watchers > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{activity.watchers}</span>
          </div>
        )}
        {activity.links > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-400">
            <Link2 className="w-3 h-3" />
            <span>{activity.links} Links</span>
          </div>
        )}
      </div>
    </div>
  );
}
