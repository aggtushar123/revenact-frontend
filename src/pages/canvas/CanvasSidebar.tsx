import { Users, User } from 'lucide-react';
import type { Contact } from '../../features/customers/customersSlice';

interface ContactSidebarItemProps {
  contact: Contact;
}

// Draggable via the exact same dataTransfer keys CreateScenario.tsx's
// own onDrop already reads ('application/reactflow' for the node type,
// 'application/reactflow/label' for a display label) — the type here
// is always 'contact', the label its own name so a dropped node can
// show something before the real Contact resolves.
function ContactSidebarItem({ contact }: ContactSidebarItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', 'contact');
    event.dataTransfer.setData('application/reactflow/label', contact.name);
    event.dataTransfer.setData('application/reactflow/contact-id', String(contact.id));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-surface border border-line-subtle rounded-lg shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
      onDragStart={onDragStart}
      draggable
    >
      <div className="p-1.5 rounded flex items-center justify-center bg-accent-dim text-accent">
        <User className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-medium text-ink-muted group-hover:text-ink truncate">
          {contact.name}
        </span>
        <span className="text-[10.5px] font-semibold text-ink-faint uppercase tracking-wide truncate">
          {contact.role_display}
        </span>
      </div>
    </div>
  );
}

interface CanvasSidebarProps {
  /** Every real Contact for this Canvas's own parent Customer/Account
   * — already fetched by CanvasEditor.tsx. */
  contacts: Contact[];
  /** Contact ids already placed as nodes — filtered out so the same
   * Contact can't be dragged on twice. */
  placedContactIds: Set<number>;
}

export function CanvasSidebar({ contacts, placedContactIds }: CanvasSidebarProps) {
  const available = contacts.filter((c) => !placedContactIds.has(c.id));

  return (
    <div className="w-[280px] h-full bg-surface border-r border-line flex flex-col p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 text-accent mb-6">
        <Users className="w-5 h-5" />
        <h2 className="text-[16px] font-bold tracking-tight text-ink">Contacts</h2>
      </div>

      {contacts.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No contacts logged for this company yet.</p>
      ) : available.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">Every contact is already on this canvas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {available.map((contact) => (
            <ContactSidebarItem key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
