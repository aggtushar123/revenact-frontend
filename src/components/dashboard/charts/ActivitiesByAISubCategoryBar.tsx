import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';

const data = [
  { name: 'Setup Assistance', value: 9 },
  { name: 'Performance Issue', value: 7 },
  { name: 'Rule Misfire', value: 7 },
  { name: 'API Issue', value: 6 },
  { name: 'Third-party Connector', value: 6 },
  { name: 'Training Request', value: 6 },
  { name: 'UI Bug', value: 6 },
  { name: 'UI Enhancement', value: 6 },
  { name: 'Alert Fatigue', value: 5 },
  { name: 'Data Import', value: 5 },
  { name: 'Email Delivery', value: 5 },
].reverse(); // Reverse so highest is at the top when rendering vertically

export function ActivitiesByAISubCategoryBar() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Activities By AI Sub Category</h3>
      
      <div className="flex-1 w-full min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#4b5563', fontSize: 11 }}
              width={140}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
              <LabelList dataKey="value" position="right" fill="#6b7280" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
