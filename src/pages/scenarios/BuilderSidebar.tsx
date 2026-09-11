import React, { useState } from 'react';
import { 
  Play, Calendar, Zap, Hourglass, Split, Filter, List, 
  Mail, MessageCircle, FileText, CheckSquare, 
  Settings, ChevronDown, Clock, ChevronRight, Binary, 
  Users, Share2, AlertCircle
} from 'lucide-react';

interface SidebarItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SidebarItem = ({ type, label, icon, color }: SidebarItemProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-surface border border-line-subtle rounded-lg shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={`p-1.5 rounded flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-[13px] font-medium text-ink-muted group-hover:text-ink">{label}</span>
    </div>
  );
};

const Section = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1.5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[12px] font-bold text-ink-faint/80 uppercase tracking-widest px-1 py-2 hover:text-ink-muted transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title}
      </button>
      {isOpen && (
        <div className="flex flex-col gap-2 pl-1 mb-4">
          {children}
        </div>
      )}
    </div>
  );
};

export function BuilderSidebar() {
  return (
    <div className="w-[280px] h-full bg-surface border-r border-line flex flex-col p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 text-accent mb-6">
        <Binary className="w-5 h-5" />
        <h2 className="text-[16px] font-bold tracking-tight text-ink">Builder</h2>
      </div>

      <Section title="Triggers">
        <SidebarItem type="entry" label="Run Now" icon={<Play className="w-3.5 h-3.5" />} color="bg-success-dim text-success" />
        <SidebarItem type="entry" label="Schedule" icon={<Calendar className="w-3.5 h-3.5" />} color="bg-success-dim text-success" />
        <SidebarItem type="entry" label="On Event" icon={<Zap className="w-3.5 h-3.5" />} color="bg-success-dim text-success" />
      </Section>

      <Section title="Operators">
        <SidebarItem type="operator" label="Wait" icon={<Clock className="w-3.5 h-3.5" />} color="bg-accent-dim text-accent" />
        <SidebarItem type="operator" label="Conditional Wait" icon={<Hourglass className="w-3.5 h-3.5" />} color="bg-accent-dim text-accent" />
        <SidebarItem type="operator" label="Condition" icon={<Split className="w-3.5 h-3.5" />} color="bg-accent-dim text-accent" />
        <SidebarItem type="operator" label="Filter" icon={<Filter className="w-3.5 h-3.5" />} color="bg-accent-dim text-accent" />
        <SidebarItem type="operator" label="End" icon={<List className="w-3.5 h-3.5" />} color="bg-accent-dim text-accent" />
      </Section>

      <Section title="Actions">
        <SidebarItem type="action" label="Assign Playbook" icon={<FileText className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Create Task" icon={<CheckSquare className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Set Attribute" icon={<Settings className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Send Email" icon={<Mail className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Slack Message" icon={<MessageCircle className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Create Pipeline" icon={<Share2 className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="MS Teams" icon={<Users className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Send Survey" icon={<List className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
        <SidebarItem type="action" label="Churn Entity" icon={<AlertCircle className="w-3.5 h-3.5" />} color="bg-info-dim text-info" />
      </Section>
    </div>
  );
}
