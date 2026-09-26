import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { portfolioRequests, stubOrganizationPage } from '../../../features/organizations/testStory';
import { useOrganization } from './useOrganization';

describe('useOrganization', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the portfolio row by id (churned and archived included) and the customer beside it', async () => {
    const spy = stubOrganizationPage();
    const { result } = renderHook(() => useOrganization(7, 0));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.row?.name).toBe('Pizza Hut'));
    await waitFor(() => expect(result.current.customer?.health_breakdown).toHaveLength(5));
    expect(Object.fromEntries(portfolioRequests(spy)[0])).toEqual({ ids: '7', include_churned: '1', limit: '1' });
    expect(result.current.notFound).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('is not found when the portfolio has no row for this viewer', async () => {
    stubOrganizationPage({ row: null });
    const { result } = renderHook(() => useOrganization(99, 0));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.row).toBeNull();
  });

  it('is not found for an id that is not a number, with no request', () => {
    const spy = stubOrganizationPage();
    const { result } = renderHook(() => useOrganization(null, 0));
    expect(result.current.notFound).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps the row on screen while a new version reloads', async () => {
    const spy = stubOrganizationPage();
    const { result, rerender } = renderHook(({ version }) => useOrganization(7, version), { initialProps: { version: 0 } });
    await waitFor(() => expect(result.current.row).not.toBeNull());
    rerender({ version: 1 });
    expect(result.current.loading).toBe(true);
    expect(result.current.row?.id).toBe(7);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(portfolioRequests(spy)).toHaveLength(2);
  });

  it('reports a failed read, and Try again reads again', async () => {
    stubOrganizationPage({ failPortfolio: 1 });
    const { result } = renderHook(() => useOrganization(7, 0));
    await waitFor(() => expect(result.current.error).toBe('Try later.'));
    expect(result.current.row).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.row?.name).toBe('Pizza Hut'));
    expect(result.current.error).toBeNull();
  });

  it('keeps the row on screen and reports the error when a reload fails', async () => {
    stubOrganizationPage();
    const { result, rerender } = renderHook(({ version }) => useOrganization(7, version), { initialProps: { version: 0 } });
    await waitFor(() => expect(result.current.row?.name).toBe('Pizza Hut'));
    stubOrganizationPage({ failPortfolio: 1 });
    rerender({ version: 1 });
    await waitFor(() => expect(result.current.error).toBe('Try later.'));
    expect(result.current.row?.name).toBe('Pizza Hut');
    expect(result.current.loading).toBe(false);
    expect(result.current.notFound).toBe(false);
  });
});
