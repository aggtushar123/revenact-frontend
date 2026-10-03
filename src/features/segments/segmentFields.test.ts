import { describe, expect, it } from 'vitest';
import type { AIAttribute } from '../attributes/types';
import { OPERATORS, fieldsFor, findField, operatorsOf, recordHref } from './segmentFields';

const attribute = (over: Partial<AIAttribute>): AIAttribute => ({
  id: 1,
  name: 'Tier',
  api_name: 'tier',
  prompt: '',
  value_type: 'picklist',
  picklist_options: ['SMB', 'Enterprise'],
  applies_to_customer: true,
  applies_to_account: false,
  refresh: 'manual',
  created_at: '',
  updated_at: '',
  ...over,
});

const keys = (kind: 'customer' | 'account' | 'contact', attributes: AIAttribute[] = []) => fieldsFor(kind, attributes).map((f) => f.key);

// Pinned to revenact-backend services/segments/registry.py and
// docs/API_CONTRACTS.md `segments` (PR #84): a field added there fails here
// until the mirror learns it.
describe('segment fields mirror the backend registry', () => {
  it('lists exactly the organisation fields, in the registry order', () => {
    expect(keys('customer')).toEqual([
      'lifecycle_stage', 'health_score', 'health_category', 'csat_score', 'nps_score', 'nps_band', 'arr',
      'renewal_date', 'owner', 'open_tickets', 'last_touch', 'ai_pulse', 'csm_pulse', 'created',
      'ces_percentage', 'product', 'seat_use', 'churned', 'archived',
    ]);
  });

  it('gives accounts the shared fields plus organisation, and none of CES, product, seat use, churned or archived', () => {
    expect(keys('account')).toEqual([
      'lifecycle_stage', 'health_score', 'health_category', 'csat_score', 'nps_score', 'nps_band', 'arr',
      'renewal_date', 'owner', 'open_tickets', 'last_touch', 'ai_pulse', 'csm_pulse', 'created', 'organisation',
    ]);
  });

  it('gives contacts their seven fields, then parent.<every organisation field>, never parent.organisation', () => {
    const contact = keys('contact');
    expect(contact.slice(0, 7)).toEqual(['role', 'sentiment', 'status', 'language', 'last_contacted', 'organisation', 'account']);
    expect(contact.slice(7)).toEqual(keys('customer').map((key) => `parent.${key}`));
    expect(contact).not.toContain('parent.organisation');
  });

  it('takes each type\'s operators as the contract lists them', () => {
    expect(OPERATORS).toEqual({
      number: ['gt', 'lt', 'between', 'is_empty', 'is_not_empty'],
      percent: ['gt', 'lt', 'between', 'is_empty', 'is_not_empty'],
      days: ['gt', 'lt', 'between', 'is_empty'],
      date: ['within_next', 'within_last', 'gt', 'lt', 'between', 'is_empty', 'is_not_empty'],
      choice: ['is', 'is_not', 'in'],
      text: ['is', 'is_not', 'in', 'is_empty', 'is_not_empty'],
      boolean: ['is'],
      owner: ['is', 'is_not', 'in'],
      record: ['is', 'is_not', 'in'],
    });
  });

  it('adds an AI attribute only where it applies, with its options and "not answered yet"', () => {
    const tier = attribute({});
    const seats = attribute({ id: 2, name: 'Seats band', api_name: 'seats', value_type: 'number', picklist_options: [], applies_to_customer: false, applies_to_account: true });
    expect(keys('customer', [tier, seats])).toContain('attr:tier');
    expect(keys('customer', [tier, seats])).not.toContain('attr:seats');
    expect(keys('account', [tier, seats])).toContain('attr:seats');
    expect(keys('account', [tier, seats])).not.toContain('attr:tier');
    expect(keys('contact', [tier, seats])).toEqual(expect.arrayContaining(['parent.attr:tier', 'parent.attr:seats']));
    expect(keys('contact', [tier, seats])).not.toContain('attr:tier');
    const field = findField('customer', 'attr:tier', [tier])!;
    expect(field.label).toBe('Tier');
    expect(field.choices.map((c) => c.value)).toEqual(['SMB', 'Enterprise']);
    expect(operatorsOf(field)).toEqual(['is', 'is_not', 'in', 'is_empty', 'is_not_empty']);
    expect(operatorsOf(findField('account', 'attr:seats', [seats])!)).toEqual(['gt', 'lt', 'between', 'is_empty', 'is_not_empty']);
  });

  it('labels a contact\'s parent field for what it reads, and finds nothing for a key the kind lacks', () => {
    expect(findField('contact', 'parent.csat_score', [])?.label).toBe('CSAT % of their organisation or account');
    expect(findField('contact', 'parent.csat_score', [])?.section).toBe('parent');
    expect(findField('customer', 'mood', [])).toBeNull();
    expect(findField('account', 'churned', [])).toBeNull();
  });

  it('links a record to its own page by kind', () => {
    expect([recordHref('customer', 7), recordHref('account', 12), recordHref('contact', 41)]).toEqual([
      '/organizations/7',
      '/accounts/12',
      '/contacts/41',
    ]);
  });
});
