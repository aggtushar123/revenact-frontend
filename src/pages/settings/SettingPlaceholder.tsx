import { Construction } from 'lucide-react';

export function SettingPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-100 rounded-3xl m-8">
      <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
        <Construction className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 font-medium max-w-xs text-center leading-relaxed">
        The {title} settings module is currently under construction. Please check back soon!
      </p>
    </div>
  );
}
