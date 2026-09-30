import { Link, useLocation } from 'react-router-dom';
import { PIPELINE_KINDS } from '../../../features/pipelines/pipelineKinds';
import { parsePipelineParams, withKind } from '../../../features/pipelines/pipelineParams';
import type { PipelineKindKey } from '../../../features/pipelines/pipelineTypes';
import { FOCUS } from '../../organizations/portfolio/styles';

const KEYS: PipelineKindKey[] = ['opportunities', 'risks'];

/** Opportunities | Risks (spec §1): in the top bar from `sm` (`bar`), and
 *  as the page's first row below `sm` (`page`; plan Decision 5). Each link
 *  keeps the view and the shared filters (`withKind`). */
export function PipelineKindSwitch({ variant }: { variant: 'bar' | 'page' }) {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const current = parsePipelineParams(search).kind;
  return (
    <nav
      aria-label="Opportunities or risks"
      className={variant === 'bar' ? 'flex rounded-lg border border-line p-0.5' : 'grid grid-cols-2 gap-1 rounded-lg border border-line p-0.5'}
    >
      {KEYS.map((key) => {
        const next = withKind(search, key).toString();
        const active = current === key;
        return (
          <Link
            key={key}
            to={{ pathname: location.pathname, search: next ? `?${next}` : '' }}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex ${variant === 'bar' ? 'min-h-9' : 'min-h-11'} items-center justify-center rounded-md px-3 text-[13px] font-semibold ${FOCUS} ${
              active ? 'bg-subtle text-ink' : 'text-ink-muted hover:bg-subtle hover:text-ink active:bg-line-subtle'
            }`}
          >
            {PIPELINE_KINDS[key].title}
          </Link>
        );
      })}
    </nav>
  );
}
