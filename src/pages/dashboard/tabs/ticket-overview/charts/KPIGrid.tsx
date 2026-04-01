import { KPI_METRICS } from '../mockData';

export function KPIGrid() {
  const getTextColor = (colorType?: string) => {
    switch (colorType) {
      case 'green': return 'text-green-600';
      case 'red': return 'text-red-500';
      case 'orange': return 'text-orange-500';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-0 min-h-[280px] bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden h-full">
      {KPI_METRICS.map((kpi, idx) => {
        // Add borders to create the internal grid layout
        const borderClasses = `
          ${idx % 2 === 0 ? 'border-r border-gray-100' : ''}
          ${idx < 4 ? 'border-b border-gray-100' : ''}
        `;

        return (
          <div key={idx} className={`p-4 flex flex-col justify-center ${borderClasses}`}>
            <div className="flex flex-col gap-0.5 mb-1.5">
              <span className="text-[12px] font-medium text-gray-500">{kpi.label}</span>
              {kpi.subValue && <span className="text-[10px] text-gray-400">{kpi.subValue}</span>}
            </div>
            <span className={`text-3xl font-semibold tracking-tight ${getTextColor(kpi.textColor)}`}>
              {kpi.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
