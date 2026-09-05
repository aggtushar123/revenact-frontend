import { useEffect, useMemo, useState } from 'react';
import { Search, X, User } from 'lucide-react';
import { fetchAllPages, ApiError } from '../../lib/apiClient';
import type { Contact } from '../../features/customers/customersSlice';
import type { CampaignRecipient } from './types';

interface RecipientPickerProps {
  selected: CampaignRecipient[];
  onChange: (recipients: CampaignRecipient[]) => void;
  disabled?: boolean;
}

// Loads every real Contact once (fetchAllPages — the same helper
// RunNowModal.tsx already uses for its own Customer picker) rather
// than a live-search paginated widget — this data set is small enough
// tenant-wide that a client-side search + checkbox multi-select is
// simpler and just as fast.
export function RecipientPicker({ selected, onChange, disabled }: RecipientPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setContacts(await fetchAllPages<Contact>('/contacts/'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load contacts.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((r) => r.id)), [selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? contacts.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      : contacts;
    return matches.filter((c) => !selectedIds.has(c.id)).slice(0, 20);
  }, [contacts, query, selectedIds]);

  function addContact(contact: Contact) {
    onChange([...selected, { id: contact.id, name: contact.name, email: contact.email }]);
    setQuery('');
  }

  function removeContact(id: number) {
    onChange(selected.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      {!disabled && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isLoading ? 'Loading contacts…' : 'Search contacts by name or email…'}
            disabled={isLoading}
            className="w-full pl-9 pr-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
          />
          {query && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-surface border border-line rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {results.map((contact) => (
                <button
                  type="button"
                  key={contact.id}
                  onClick={() => addContact(contact)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-subtle transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                  <span className="text-[13px] font-semibold text-ink truncate">{contact.name}</span>
                  <span className="text-[12px] text-ink-faint truncate">{contact.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[12px] text-danger">{error}</p>}

      {selected.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No recipients yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((recipient) => (
            <span
              key={recipient.id}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-accent-dim text-accent rounded-full text-[12px] font-semibold"
            >
              {recipient.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeContact(recipient.id)}
                  className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
