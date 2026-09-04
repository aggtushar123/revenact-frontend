import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import type { CurrencyCode } from './features/auth/authSlice';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Same '?? USD' fallback CurrencyPage.tsx itself uses — the org's billing
// currency for anything rendering money (see formatMoney/formatCompactMoney
// in features/customers/formatters.ts, which every caller of this hook
// feeds into).
export const useOrgCurrency = (): CurrencyCode =>
  useAppSelector((state) => state.auth.user?.organisation.currency ?? 'USD');
