import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AccountDetails } from './Details';
import type { AccountRow } from '../../components/organizations/accountsData';

// Real-shaped AccountRow, the kind organizations/Details.tsx's AccountsTab
// passes through navigate()'s state when a row is clicked — see that
// file and mapToAccountRow.test.ts for the full field list.
const apacDivision: AccountRow = {
  orgId: 9,
  id: '17',
  name: 'APAC Division',
  orgName: 'Kraft Heinz',
  logo: 'https://logo.clearbit.com/kraftheinz.com',
  revenactId: 17,
  pulse: [],
  aiPulseScore: '—',
  aiPulseReason: '-',
  owner: 'Unassigned',
  avatar: '—',
  health: { val: 6.2, clr: 'bg-[var(--warning)]' },
  healthCategory: 'average',
  nps: '-20',
  npsValue: -20,
  csat: '45%',
  csatValue: 45,
  lifecycleStage: 'Onboarding',
  mrr: 2833,
  arr: 34000,
  renewal: '-',
};

function renderAccountDetails(state?: { account: AccountRow }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/accounts/17', state }]}>
      <Routes>
        <Route path="/accounts/:id" element={<AccountDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AccountDetails page (/accounts/:id)', () => {
  it('renders every metric from the real AccountRow passed via navigation state, not hardcoded placeholders', () => {
    // These used to be hardcoded regardless of which account was passed
    // in (9.3/100/100, "Very Satisfied", Promoters 10/Passives 0/
    // Detractors 0) — this pins them down as actually derived.
    renderAccountDetails({ account: apacDivision });

    expect(screen.getByText('APAC Division')).toBeInTheDocument();
    expect(screen.getByText('6.2')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument(); // CSM Pulse: health 4-6.9
    expect(screen.getByText('-20')).toBeInTheDocument(); // NPS, no leading '+'
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('$34K')).toBeInTheDocument();

    // A negative NPS is a detractor, not a promoter — the mock's old
    // hardcoded "Promoters 10" would fail this.
    const detractorsRow = screen.getByText('Detractors').closest('div')!.parentElement!;
    expect(detractorsRow).toHaveTextContent('1');
  });

  it('shows a real $0 ARR as $0, not the old hardcoded "$1.2M" fallback', () => {
    // A freshly-Added account (Add Account) genuinely has arr=0 — the old
    // `account.arr ? ... : '1.2M'` treated that falsy-but-real 0 as
    // "missing" and substituted a made-up placeholder instead.
    renderAccountDetails({ account: { ...apacDivision, arr: 0 } });

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.queryByText('$1.2M')).not.toBeInTheDocument();
  });

  it('falls back to the mock data when reached without navigation state (a direct URL visit or refresh)', () => {
    renderAccountDetails();

    expect(screen.queryByText('APAC Division')).not.toBeInTheDocument();
    // ACCOUNTS_DATA[0]'s own real mock health (9.5), not the old
    // hardcoded 9.3 that didn't even match it.
    expect(screen.getByText('9.5')).toBeInTheDocument();
  });
});
