import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchOpportunitiesForCustomer, fetchRisksForCustomer } from '../../../features/customers/customersSlice';
import { PipelinesTab } from '../../shared/PipelinesTab';

/** Deals & risks: today's Pipelines tab inside the new frame (spec §4,
 *  delivery 1). It reads opportunities and risks when first opened. */
export function DealsTab({ customerId }: { customerId: number }) {
  const dispatch = useAppDispatch();
  const {
    pipelineOpportunities,
    pipelineOpportunitiesLoading,
    pipelineOpportunitiesError,
    pipelineRisks,
    pipelineRisksLoading,
    pipelineRisksError,
  } = useAppSelector((state) => state.customers);
  useEffect(() => {
    dispatch(fetchOpportunitiesForCustomer(customerId));
    dispatch(fetchRisksForCustomer(customerId));
  }, [dispatch, customerId]);
  return (
    <PipelinesTab
      opportunities={pipelineOpportunities}
      opportunitiesLoading={pipelineOpportunitiesLoading}
      opportunitiesError={pipelineOpportunitiesError}
      risks={pipelineRisks}
      risksLoading={pipelineRisksLoading}
      risksError={pipelineRisksError}
      customerId={customerId}
      embedded
    />
  );
}
