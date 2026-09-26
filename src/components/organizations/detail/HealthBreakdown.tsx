import type { Customer, HealthComponent } from '../../../features/customers/customersSlice';

/** A component's share of its weight, in the rubric's own bands and in words. */
function band(ratio: number): { word: string; bar: string } {
  if (ratio >= 0.7) return { word: 'Good', bar: 'bg-success' };
  if (ratio >= 0.4) return { word: 'Average', bar: 'bg-warning' };
  return { word: 'Poor', bar: 'bg-danger' };
}

const ROW = 'grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-[13px]';

function Row({ component }: { component: HealthComponent }) {
  if (!component.available || component.ratio == null) {
    return (
      <li className={`${ROW} text-ink-muted`}>
        <span className="truncate">{component.label}</span>
        <span aria-hidden="true" className="h-1.5 rounded-full bg-line" />
        <span>No data</span>
      </li>
    );
  }
  const tone = band(component.ratio);
  return (
    <li className={ROW}>
      <span className="truncate text-ink">{component.label}</span>
      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line">
        <span className={`block h-full ${tone.bar}`} style={{ width: `${component.ratio * 100}%` }} />
      </span>
      <span className="text-ink-muted">
        <span className="font-mono-brand tabular-nums text-ink">
          {component.points}/{component.weight}
        </span>{' '}
        · {tone.word}
      </span>
    </li>
  );
}

/** What the health score is made of: the five rubric components from
 *  `/customers/{id}/`'s `health_breakdown`, each as points of its weight. */
export function HealthBreakdown({ id, customer, error }: { id: string; customer: Customer | null; error: string | null }) {
  return (
    <section id={id} aria-label="Health breakdown" className="rounded-xl bg-surface p-3">
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : !customer ? (
        <div role="status" aria-label="Loading the health breakdown" className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} aria-hidden="true" className="block h-3 w-full animate-pulse rounded bg-subtle" />
          ))}
        </div>
      ) : (
        <Components customer={customer} />
      )}
    </section>
  );
}

function Components({ customer }: { customer: Customer }) {
  const rows = customer.health_breakdown;
  const measured = rows.filter((c) => c.available).length;
  const unmeasured = rows.length - measured;
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {rows.map((component) => (
          <Row key={component.key} component={component} />
        ))}
      </ul>
      {customer.health_score_is_overridden ? (
        <p className="mt-2 text-[11px] text-ink-muted">
          This score was set by hand. The components are what the calculation would have given.
        </p>
      ) : unmeasured > 0 ? (
        <p className="mt-2 text-[11px] text-ink-muted">
          Scored on the {measured} components with data; {unmeasured === 1 ? 'the other is' : `the other ${unmeasured} are`} left
          out rather than counted as zero.
        </p>
      ) : null}
    </>
  );
}
