import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { trapTab } from '../../../lib/focusTrap';
import { FOCUS } from '../portfolio/styles';

const FIELD = 'input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

/** A modal over the organization page: a panel on the right from `sm`, a
 *  bottom sheet below it (spec §1.11). Focus moves to its first field, or to
 *  Close when it has none; Tab stays inside; the page behind does not
 *  scroll; Escape, Close or the scrim close it and focus goes back to
 *  whatever opened it. */
export function Sheet({
  title,
  description,
  isSm,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  isSm: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // A caller passing a new inline onClose each render must not re-run the
  // mount effect (it would steal focus back to the first field).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    (root?.querySelector<HTMLElement>(FIELD) ?? root?.querySelector<HTMLElement>('button'))?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        const target = event.target as Node | null;
        if (target === document.body || (target && ref.current?.contains(target))) onCloseRef.current();
      }
      if (event.key === 'Tab' && ref.current) trapTab(event, ref.current);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  return (
    <div data-shape={isSm ? 'panel' : 'sheet'} className="fixed inset-0 z-50 flex">
      <div data-scrim="" aria-hidden="true" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={
          isSm
            ? 'relative ml-auto flex h-full w-full max-w-lg flex-col bg-surface shadow-lg'
            : 'relative mt-auto flex max-h-[85dvh] w-full flex-col rounded-t-xl bg-surface pb-[env(safe-area-inset-bottom)]'
        }
      >
        <header className="flex items-start gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="truncate text-[11px] text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink active:bg-line-subtle ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
