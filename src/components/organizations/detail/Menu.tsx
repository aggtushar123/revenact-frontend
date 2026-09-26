import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useDismiss } from '../portfolio/useDismiss';
import { FOCUS } from '../portfolio/styles';

export interface MenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  /** A destructive action, in the danger tone. */
  danger?: boolean;
}

/** A menu button (WAI-ARIA): opening focuses the first item; arrows, Home
 *  and End move and wrap; Escape or choosing closes it and returns focus to
 *  the button; Tab or a press outside just closes it. */
export function Menu({
  label,
  trigger,
  triggerClassName,
  items,
  align = 'end',
}: {
  /** The button's and the menu's accessible name. */
  label: string;
  /** What the button shows: an icon, or an icon and a word. */
  trigger: ReactNode;
  triggerClassName: string;
  items: MenuItem[];
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  useDismiss(
    [buttonRef, menuRef],
    (reason) => {
      setOpen(false);
      if (reason === 'escape') buttonRef.current?.focus();
    },
    open,
  );

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const onMenuKey = (event: KeyboardEvent<HTMLUListElement>) => {
    const all = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (index: number) => {
      event.preventDefault();
      all[(index + all.length) % all.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(at + 1);
    else if (event.key === 'ArrowUp') go(at - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(all.length - 1);
    else if (event.key === 'Tab') setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={`absolute top-full z-30 mt-1 min-w-44 rounded-lg border border-line bg-surface py-1 shadow-md ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <li key={item.key} role="none">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                  item.onSelect();
                }}
                className={`flex min-h-11 w-full items-center px-3 text-left text-[13px] hover:bg-subtle active:bg-line-subtle sm:min-h-9 ${FOCUS} ${
                  item.danger ? 'text-danger' : 'text-ink'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
