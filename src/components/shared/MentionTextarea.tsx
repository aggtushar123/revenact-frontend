import { useMemo, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';
import { useMembers } from '../../features/knowledge/useMembers';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  /** Called for Enter without Shift when no suggestion is open. */
  onSubmit?: () => void;
};

/**
 * A textarea that completes @mentions from the organisation's members.
 * Typing "@" and a few letters opens a list; Enter, Tab or a click
 * inserts the full name (so the backend's resolver never has to guess
 * between two people who share a first name). Enter with nothing open
 * submits, when the caller wants that.
 */
export function MentionTextarea({ value, onChange, onSubmit, onKeyDown, ...rest }: Props) {
  const members = useMembers();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);

  // The "@query" the caret is currently inside, if any.
  const token = useMemo(() => {
    const before = value.slice(0, caret);
    const match = /(^|\s)@([A-Za-z][A-Za-z'\- ]{0,30})$/.exec(before);
    if (!match) return null;
    const query = match[2];
    if (query.endsWith(' ') && query.trim().split(' ').length >= 2) return null;
    return { start: caret - query.length - 1, query };
  }, [value, caret]);

  const options = useMemo(() => {
    if (!token) return [];
    const q = token.query.trim().toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [members, token]);

  function choose(index: number) {
    if (!token || !options[index]) return;
    const name = options[index].name;
    const next = `${value.slice(0, token.start)}@${name} ${value.slice(caret)}`;
    onChange(next);
    const position = token.start + name.length + 2;
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(position, position);
      setCaret(position);
    });
    setActive(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => (a + 1) % options.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => (a - 1 + options.length) % options.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        choose(active);
        return;
      }
      if (e.key === 'Escape') {
        setCaret(-1);
        return;
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    onKeyDown?.(e);
  }

  return (
    <div className="relative w-full">
      <textarea
        {...rest}
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onSelect={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
        onKeyDown={handleKeyDown}
      />
      {options.length > 0 && (
        <ul role="listbox" aria-label="People to mention" className="absolute left-3 bottom-full mb-1 z-20 min-w-[240px] bg-surface border border-line rounded-lg shadow-lg overflow-hidden">
          {options.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(i);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] flex items-baseline gap-2 ${i === active ? 'bg-accent-dim text-ink' : 'text-ink hover:bg-subtle'}`}
              >
                <span className="font-semibold">{m.name}</span>
                {m.function && <span className="text-[11px] text-ink-faint">{FUNCTION_LABELS[m.function]}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
