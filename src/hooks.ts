import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import type { Capability, CurrencyCode } from './features/auth/authSlice';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Same '?? USD' fallback CurrencyPage.tsx itself uses — the org's billing
// currency for anything rendering money (see formatMoney/formatCompactMoney
// in features/customers/formatters.ts, which every caller of this hook
// feeds into).
export const useOrgCurrency = (): CurrencyCode =>
  useAppSelector((state) => state.auth.user?.organisation.currency ?? 'USD');

// Does the logged-in user hold this capability? The single question
// every gated bit of UI asks, mirroring the backend's own
// `User.has_capability` (see services/accounts/permissions.py — the
// server enforces this independently, so this hook only decides what to
// *show*, never what's actually allowed).
//
// Replaced a scattering of `user.role === 'admin'` checks: roles are
// org-defined now, so which role you hold says nothing on its own —
// what it grants is the real question.
export const useCapability = (capability: Capability): boolean =>
  useAppSelector((state) => state.auth.user?.permissions?.includes(capability) ?? false);
