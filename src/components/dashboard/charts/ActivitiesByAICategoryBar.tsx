import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';

const data = [
  { name: 'Onboarding', value: 20 },
  { name: 'Bug Report', value: 17 },
  { name: 'Workflow Automation', value: 16 },
  { name: 'Integration Support', value: 15 },
  { name: 'System Notification', value: 14 },
  { name: 'Account Management', value: 13 },
  { name: 'Feature Request', value: 12 },
  { name: 'Customer Feedback', value: 11 },
  { name: 'Reporting & Analytics', value: 10 },
  { name: 'Security & Compliance', value: 10 },
].reverse(); // Reverse so highest is at the top when rendering vertically

export function ActivitiesByAICategoryBar() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activities By AI Category</h3>
      
      <div className="flex-1 w-full min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-strong)" />
            <XAxis 
              type="number" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              width={140}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={16}>
              <LabelList dataKey="value" position="right" fill="var(--text-secondary)" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
