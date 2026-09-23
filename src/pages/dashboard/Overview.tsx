import { Link } from 'react-router-dom';
import { AREAS } from './areas';
import { Panel } from './shared/Panel';

/** Placeholder landing until the attention list lands (PR 3). Links each area
 *  so /dashboard is never a dead end in the meantime. */
export function Overview() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {AREAS.map((area) => (
        <Panel key={area.key} title={area.label}>
          <Link to={`/dashboard/${area.key}`} className="text-[13px] font-semibold text-ink hover:underline">
            Open {area.label} →
          </Link>
        </Panel>
      ))}
    </div>
  );
}
