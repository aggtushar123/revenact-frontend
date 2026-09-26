import { useEffect, useId } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchHeadlinesForCustomer, regenerateHeadlines } from '../../../features/customers/customersSlice';
import { HeadlinesTab } from '../activity/HeadlinesTab';
import { CompanyViewTab } from '../CompanyViewTab';

/** Knowledge (spec §1.9): today's Company View (the brief, who answers, and
 *  questions), then the AI headlines that used to be a feed sub-tab.
 *  Delivery 2 restyles it. */
export function KnowledgeTab({ customerId, customerName }: { customerId: number; customerName: string }) {
  const dispatch = useAppDispatch();
  const headingId = useId();
  const { headlines, headlinesLoading, headlinesError, headlinesGenerating, headlinesGenerateError } = useAppSelector(
    (state) => state.customers,
  );
  useEffect(() => {
    dispatch(fetchHeadlinesForCustomer(customerId));
  }, [dispatch, customerId]);
  return (
    <div className="flex flex-col gap-6">
      <CompanyViewTab customerId={customerId} customerName={customerName} />
      <section aria-labelledby={headingId} className="flex flex-col gap-2">
        <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Headlines
        </h2>
        <HeadlinesTab
          headlines={headlines}
          isLoading={headlinesLoading}
          error={headlinesError}
          onRegenerate={async () => {
            await dispatch(regenerateHeadlines({ customerId }));
          }}
          isRegenerating={headlinesGenerating}
          regenerateError={headlinesGenerateError}
        />
      </section>
    </div>
  );
}
