import { X } from 'lucide-react';
import { FOCUS } from './styles';

const DISMISS = `inline-flex w-11 h-11 sm:w-8 sm:h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`;

/** A portfolio page's failure line (an export, a move) with its Dismiss
 *  button: Accounts' List and Board, and the Pipelines List. */
export function DismissibleAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
      {message}
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className={DISMISS}>
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </p>
  );
}
