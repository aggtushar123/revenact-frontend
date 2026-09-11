import { Construction } from 'lucide-react';

export function SettingPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm border-2 border-dashed border-line-subtle rounded-3xl m-8">
      <div className="p-4 bg-accent-dim rounded-2xl mb-4">
        <Construction className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">{title}</h2>
      <p className="text-ink-muted font-medium max-w-xs text-center leading-relaxed">
        The {title} settings module is currently under construction. Please check back soon!
      </p>
    </div>
  );
}
