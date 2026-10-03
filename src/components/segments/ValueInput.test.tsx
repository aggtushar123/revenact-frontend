import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DraftCondition, DraftValue } from '../../features/segments/ruleDraft';
import { findField } from '../../features/segments/segmentFields';
import { NO_LABELS, type Operator, type RuleLabels } from '../../features/segments/segmentTypes';
import { CARL, DANA, stubSegments } from '../../features/segments/testSegments';
import { ValueInput, type ValueOptions } from './ValueInput';

function Harness({ kind = 'customer', field, op, initial, labels = NO_LABELS, onNamed = vi.fn() }: {
  kind?: 'customer' | 'account' | 'contact';
  field: string;
  op: Operator;
  initial: DraftValue;
  labels?: RuleLabels;
  onNamed?: ValueOptions['onNamed'];
}) {
  const [value, setValue] = useState<DraftValue>(initial);
  const condition: DraftCondition = { uid: 'c1', field, op, value };
  const options: ValueOptions = { people: [CARL, DANA], products: [{ id: 3, name: 'Analytics' }], labels, onNamed };
  return (
    <>
      <ValueInput field={findField(kind, field, [])!} condition={condition} options={options} label="Condition 1 value" invalid={false} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value ?? 'unset')}</output>
    </>
  );
}

const value = () => screen.getByTestId('value').textContent;

const page = (rows: { id: number; name: string }[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ count: rows.length, next: null, previous: null, results: rows }),
});

describe('ValueInput (plan Decision 2)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('takes a number range as two boxes, in DM Mono, with "%" for a percent', async () => {
    render(<Harness field="csat_score" op="between" initial={[undefined, undefined]} />);
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Condition 1 value from' }), '60');
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Condition 1 value to' }), '80');
    expect(value()).toBe('[60,80]');
    expect(screen.getByRole('spinbutton', { name: 'Condition 1 value from' })).toHaveClass('font-mono-brand');
    expect(screen.getAllByText('%')).toHaveLength(2);
  });

  it('takes a date window as a number of days, and a date as a date', async () => {
    const { unmount } = render(<Harness field="renewal_date" op="within_next" initial={undefined} />);
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Condition 1 value' }), '90');
    expect(value()).toBe('90');
    expect(screen.getByText('days')).toBeInTheDocument();
    unmount();
    render(<Harness field="renewal_date" op="lt" initial={undefined} />);
    const date = screen.getByLabelText('Condition 1 value');
    expect(date).toHaveAttribute('type', 'date');
  });

  it('keeps a date window to whole days from 1 to 3650 (ruling G15)', async () => {
    render(<Harness field="renewal_date" op="within_last" initial={undefined} />);
    const box = screen.getByRole('spinbutton', { name: 'Condition 1 value' });
    expect(box).toHaveAttribute('min', '1');
    expect(box).toHaveAttribute('max', '3650');
    expect(box).toHaveAttribute('step', '1');
    await userEvent.type(box, '0');
    expect(value()).toBe('"unset"');
    await userEvent.type(box, '4000');
    expect(value()).toBe('3650');
  });

  it('takes "is any of" a choice list as checkboxes', async () => {
    render(<Harness field="lifecycle_stage" op="in" initial={[]} />);
    const group = screen.getByRole('group', { name: 'Condition 1 value' });
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Live' }));
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Renewal' }));
    expect(value()).toBe('["live","renewal"]');
  });

  it('offers an owner as Unassigned or an active teammate, and names a hidden one as such', async () => {
    const { unmount } = render(<Harness field="owner" op="is" initial={undefined} />);
    const select = screen.getByRole('combobox', { name: 'Condition 1 value' });
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Choose…', 'Unassigned', 'Carl CSM', 'Dana CSM']);
    await userEvent.selectOptions(select, 'Carl CSM');
    expect(value()).toBe('4');
    await userEvent.selectOptions(select, 'Unassigned');
    expect(value()).toBe('"unassigned"');
    unmount();
    render(<Harness field="owner" op="is" initial={null} />);
    expect(screen.getByRole('combobox', { name: 'Condition 1 value' })).toHaveDisplayValue("an owner you can't open");
  });

  it('adds owners to "is any of" as chips, and removes them', async () => {
    render(<Harness field="owner" op="in" initial={[]} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Condition 1 value: add' }), 'Dana CSM');
    expect(value()).toBe('[5]');
    await userEvent.click(within(screen.getByRole('list', { name: 'Condition 1 value' })).getByRole('button', { name: 'Remove Dana CSM' }));
    expect(value()).toBe('[]');
  });

  it('searches organisations on the server, picks one by name, and shows a hidden one as such', async () => {
    const spy = stubSegments();
    const onNamed = vi.fn();
    const { unmount } = render(<Harness kind="account" field="organisation" op="is" initial={undefined} onNamed={onNamed} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Condition 1 value: search' }), 'piz');
    const matches = await screen.findByRole('list', { name: 'Condition 1 value: matches' });
    await userEvent.click(within(matches).getByRole('button', { name: 'Pizza Hut' }));
    expect(value()).toBe('7');
    expect(onNamed).toHaveBeenCalledWith('organisations', 7, 'Pizza Hut');
    expect(spy.mock.calls.map(([input]) => new URL(String(input)).search)).toContain('?search=piz');
    unmount();
    render(<Harness kind="account" field="organisation" op="in" initial={[7, null]} labels={{ ...NO_LABELS, organisations: { '7': 'Pizza Hut' } }} />);
    const chosen = screen.getByRole('list', { name: 'Condition 1 value' });
    expect(within(chosen).getByText('Pizza Hut')).toBeInTheDocument();
    expect(within(chosen).getByText("an organisation you can't open").tagName).toBe('EM');
  });

  it("drops an organisation search's answer once a newer search has answered", async () => {
    let answerOld: () => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const search = new URL(String(input)).searchParams.get('search');
        if (search === 'pi') return new Promise((resolve) => (answerOld = () => resolve(page([{ id: 70, name: 'Pita Place' }]))));
        return Promise.resolve(page([{ id: 7, name: 'Pizza Hut' }]));
      }),
    );
    render(<Harness kind="account" field="organisation" op="is" initial={undefined} />);
    const box = screen.getByRole('searchbox', { name: 'Condition 1 value: search' });
    await userEvent.type(box, 'pi');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await userEvent.type(box, 'z');
    const matches = await screen.findByRole('list', { name: 'Condition 1 value: matches' });
    expect(within(matches).getByRole('button', { name: 'Pizza Hut' })).toBeInTheDocument();
    answerOld();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('button', { name: 'Pita Place' })).toBeNull();
    expect(within(screen.getByRole('list', { name: 'Condition 1 value: matches' })).getByRole('button', { name: 'Pizza Hut' })).toBeInTheDocument();
  });

  it('asks nothing for "is empty"', () => {
    const { container } = render(<Harness field="arr" op="is_empty" initial={undefined} />);
    expect(container.querySelectorAll('input, select')).toHaveLength(0);
  });
});
