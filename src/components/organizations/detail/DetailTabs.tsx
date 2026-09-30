import { useEffect, useRef, type KeyboardEvent } from 'react';
import { DETAIL_TABS, detailPanelId, detailTabId, type DetailTab } from '../../../features/organizations/detailParams';
import { FOCUS } from '../portfolio/styles';

/** A detail page's tabs (organisation spec §1.5; account spec §2.4): a real
 *  tablist whose selection lives in the URL. Arrows, Home and End move and
 *  select (automatic activation); only the selected tab is in the tab order.
 *  On phones the row scrolls sideways and the selected tab scrolls into view.
 *  The organization page's tabs unless `tabs` is given. */
export function DetailTabs<K extends string = DetailTab>({
  idBase,
  active,
  onChange,
  tabs,
  label = 'Organization sections',
}: {
  idBase: string;
  active: K;
  onChange: (tab: K) => void;
  tabs?: readonly { key: K; label: string }[];
  /** The tablist's accessible name. */
  label?: string;
}) {
  const list = tabs ?? (DETAIL_TABS as unknown as readonly { key: K; label: string }[]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  const onKey = (event: KeyboardEvent, index: number) => {
    const last = list.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    const tab = list[next].key;
    onChange(tab);
    document.getElementById(detailTabId(idBase, tab))?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className="-mx-4 flex gap-4 overflow-x-auto border-b border-line-subtle px-4 sm:mx-0 sm:px-0"
    >
      {list.map((tab, index) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            id={detailTabId(idBase, tab.key)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={detailPanelId(idBase, tab.key)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => onKey(event, index)}
            className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 text-[13px] font-semibold sm:min-h-9 ${FOCUS} ${
              selected ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
