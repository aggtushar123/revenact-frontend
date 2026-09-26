import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Account } from '../../features/customers/customersSlice';
import { pizzaHut } from '../../features/organizations/testPortfolio';
import {
  ACCOUNTS,
  manyItems,
  portfolioRequests,
  postBodies,
  requestPaths,
  storyQueries,
  stubOrganizationPage,
} from '../../features/organizations/testStory';
import { resetViewport } from '../../test/viewport';
import { renderOrganizationPage } from './testDetail';

// Integration tier: the real page, store and router; only fetch is stubbed,
// with bodies in the shapes of spec 2026-09-26 §2 (stubOrganizationPage).
const where = () => new URL(`http://x${screen.getByTestId('where').textContent}`);
const itemKeys = () => [...document.querySelectorAll('[data-story-item]')].map((el) => el.getAttribute('data-story-item'));
const landed = () => screen.findByRole('heading', { level: 1, name: 'Pizza Hut' });
/** stubOrganizationPage plus the account saves it does not serve: POST adds
 *  an account, PATCH replaces one, and GET /customers/7/accounts/ reads the
 *  saved list. Each read is a fresh array: the store freezes what it keeps. */
function stubAccountSaves() {
  let accounts: Account[] = [...ACCOUNTS];
  const spy = stubOrganizationPage();
  const saves: { method: string; path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname.replace(/^\/api\/v1/, '');
      const method = init?.method ?? 'GET';
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      if (path === '/customers/7/accounts/' && method === 'GET') {
        spy(input, init); // counted with the page's other reads
        return { ok: true, status: 200, json: async () => accounts.map((account) => ({ ...account })) };
      }
      if (method === 'POST' && path === '/customers/7/accounts/') {
        saves.push({ method, path, body });
        const created = { ...ACCOUNTS[1], id: 33, name: String(body.name), domain: String(body.domain ?? '') };
        accounts = [...accounts, created];
        return { ok: true, status: 201, json: async () => created };
      }
      const edit = /^\/customers\/7\/accounts\/(\d+)\/$/.exec(path);
      if (method === 'PATCH' && edit) {
        saves.push({ method, path, body });
        const id = Number(edit[1]);
        accounts = accounts.map((account) => (account.id === id ? ({ ...account, ...body } as Account) : account));
        const saved = accounts.find((account) => account.id === id);
        return { ok: true, status: 200, json: async () => ({ ...saved }) };
      }
      return spy(input, init);
    }),
  );
  return { spy, saves };
}

const lastStory = (spy: Parameters<typeof storyQueries>[0]) => {
  const all = storyQueries(spy);
  return all[all.length - 1];
};

describe('the organization page (/organizations/:id)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
    document.body.style.overflow = '';
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it('lands in four requests: the name row, the tiles, the account chips and the story', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    expect(within(header).getByText('Carl CSM').closest('p')).toHaveTextContent('Carl CSM · Live · Touched 33d ago');
    expect(within(header).getByText('Renewal overdue')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'ARR $69.6K. Show commercial details' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'EMEA 1' })).toBeInTheDocument();
    // The Show filters have an "All 5" too: the account chips are their own group.
    const chips = screen.getByRole('group', { name: 'Filter by account' });
    expect(within(chips).getByRole('button', { name: 'All 5' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(chips).getByRole('button', { name: 'Organization 3' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Needs attention' })).toBeInTheDocument();
    expect(itemKeys()).toEqual(['email:41', 'call:12', 'ticket:88', 'task:5', 'health:3']);
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveAttribute('aria-selected', 'true');
    expect([...requestPaths(spy)].sort()).toEqual([
      'GET /customers/7/',
      'GET /customers/7/accounts/',
      'GET /organizations/7/story/',
      'GET /organizations/portfolio/',
    ]);
    expect(Object.fromEntries(portfolioRequests(spy)[0])).toEqual({ ids: '7', include_churned: '1', limit: '1' });
    expect(storyQueries(spy)[0].toString()).toBe('limit=30');
  });

  it('has none of the removed parts (spec §1.10)', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    await screen.findByRole('button', { name: 'EMEA 1' });
    for (const gone of [
      /Enable new 360 UI/,
      /Ask Copilot/,
      /coming soon/i,
      /^Slack$/,
      /^Sessions$/,
      /Success Plans/,
      /Custom Objects/,
      /Canvas List/,
      /All attributes/i,
      /Pinned attributes/i,
      /Account Pulse/,
      /Promoters/,
    ]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
    expect(document.querySelector('img')).toBeNull();
  });

  it('filters the story by account in the URL, and shows the chips on the Story tab only', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await userEvent.click(await screen.findByRole('button', { name: 'EMEA 1' }));
    expect(where().searchParams.get('account')).toBe('31');
    await waitFor(() => expect(itemKeys()).toEqual(['email:41']));
    expect(lastStory(spy).get('account')).toBe('31');
    expect(screen.getByRole('button', { name: 'EMEA 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Edit EMEA' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'People' }));
    expect(where().searchParams.get('tab')).toBe('people');
    expect(screen.queryByRole('group', { name: 'Filter by account' })).not.toBeInTheDocument();
    expect(where().searchParams.get('account')).toBe('31');
  });

  it('opens a deep link on its tab, and reads the story only on Story', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage('/organizations/7?tab=details');
    await landed();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel', { name: 'Details' });
    expect(within(panel).getByText('Total contract value')).toBeInTheDocument();
    const facts = within(panel).getByRole('region', { name: 'Contact and CSAT' });
    expect(await within(facts).findByText('No CSAT survey has been answered yet.')).toBeInTheDocument();
    expect(within(panel).getByRole('region', { name: 'AI attributes' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter by account' })).not.toBeInTheDocument();
    expect(storyQueries(spy)).toHaveLength(0);
    await userEvent.click(screen.getByRole('tab', { name: 'Story' }));
    await waitFor(() => expect(storyQueries(spy)).toHaveLength(1));
  });

  it('shows a skeleton on Details and Knowledge until the organization lands', async () => {
    stubOrganizationPage();
    renderOrganizationPage('/organizations/7?tab=details');
    expect(screen.getByRole('status', { name: 'Loading details' })).toBeInTheDocument();
    await landed();
    expect(screen.queryByRole('status', { name: 'Loading details' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Knowledge' }));
    expect(await screen.findByRole('region', { name: 'Headlines' })).toBeInTheDocument();
  });

  it('shows the Knowledge skeleton on a deep link until the organization lands', async () => {
    stubOrganizationPage();
    renderOrganizationPage('/organizations/7?tab=knowledge');
    expect(screen.getByRole('status', { name: 'Loading knowledge' })).toBeInTheDocument();
    await landed();
    expect(await screen.findByRole('region', { name: 'Headlines' })).toBeInTheDocument();
  });

  it('jumps from a tile to its Details panel, and opens the health breakdown', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    const scroll = vi.mocked(Element.prototype.scrollIntoView);
    scroll.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /^ARR/ }));
    expect(where().searchParams.get('tab')).toBe('details');
    const commercial = document.querySelector('[data-panel="commercial"]');
    await waitFor(() => expect(commercial).toHaveFocus());
    // The panel itself scrolled into view, not only the tab row.
    expect(scroll.mock.contexts).toContain(commercial);
    await userEvent.click(screen.getByRole('button', { name: /^Pulse/ }));
    await waitFor(() => expect(document.querySelector('[data-panel="voice"]')).toHaveFocus());
    await userEvent.click(screen.getByRole('button', { name: /^Health 4\.9/ }));
    const breakdown = await screen.findByRole('region', { name: 'Health breakdown' });
    expect(within(breakdown).getByText('Product usage')).toBeInTheDocument();
  });

  it('moves between the tabs from the keyboard, each reading its data when opened', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    screen.getByRole('tab', { name: 'Story' }).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'People' })).toHaveFocus();
    expect(where().searchParams.get('tab')).toBe('people');
    await waitFor(() => expect(requestPaths(spy)).toContain('GET /customers/7/contacts/'));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(requestPaths(spy)).toContain('GET /customers/7/opportunities/'));
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByRole('region', { name: 'Headlines' })).toBeInTheDocument();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('region', { name: 'Calls' })).toBeInTheDocument();
    expect(where().searchParams.get('tab')).toBe('files');
  });

  it('filters by kind, source and search, all kept in the URL', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Tickets 1' }));
    expect(where().searchParams.get('group')).toBe('tickets');
    await waitFor(() => expect(itemKeys()).toEqual(['ticket:88']));
    await userEvent.click(screen.getByRole('button', { name: /^Sources/ }));
    expect(screen.getAllByRole('checkbox').map((box) => box.closest('label')?.textContent)).toEqual(['Tickets']);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: /^All/ }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the story' }), 'retraining');
    await waitFor(() => expect(where().searchParams.get('q')).toBe('retraining'));
    await waitFor(() => expect(itemKeys()).toEqual(['call:12']));
    expect(lastStory(spy).get('q')).toBe('retraining');
    expect(where().searchParams.has('group')).toBe(false);
  });

  it('takes Needs attention rows to what needs attention', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await userEvent.click(await screen.findByRole('button', { name: /^1 overdue task/ }));
    expect(where().searchParams.get('group')).toBe('tasks');
    await waitFor(() => expect(itemKeys()).toEqual(['task:5']));
    await userEvent.click(screen.getByRole('button', { name: '3 unanswered questions' }));
    expect(where().searchParams.get('tab')).toBe('knowledge');
  });

  it('opens an email as its real thread (?thread= on the story), and gives focus back to it', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    const title = await screen.findByRole('button', { name: 'Re: Renewal pricing' });
    await userEvent.click(title);
    const dialog = screen.getByRole('dialog', { name: 'Re: Renewal pricing' });
    expect(await within(dialog).findByText('Can we see the quote before the board meets on Friday?')).toBeInTheDocument();
    expect(within(dialog).getByText('Sharing the renewal quote ahead of your board meeting.')).toBeInTheDocument();
    expect(lastStory(spy).get('thread')).toBe('t-1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(title).toHaveFocus();
  });

  it('adds a task on the chosen account and shows it in the story', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage('/organizations/7?account=31');
    await screen.findByRole('button', { name: 'EMEA 1' });
    await userEvent.click(screen.getByRole('button', { name: 'Add to the story' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    expect(dialog).toHaveAccessibleDescription('On EMEA');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Task title' }), 'Book the retraining');
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2026-10-01' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save task' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(postBodies(spy, '/customers/7/accounts/31/tasks/')).toEqual([
      { title: 'Book the retraining', due_date: '2026-10-01', priority: 'medium', assignee_id: null },
    ]);
    expect(await screen.findByRole('button', { name: 'Book the retraining' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'EMEA 2' })).toBeInTheDocument();
    expect(screen.getByText('Added to the story.')).toBeInTheDocument();
  });

  it('edits, archives and churns from the name row', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    const edit = screen.getByRole('button', { name: 'Edit' });
    await waitFor(() => expect(edit).toBeEnabled());
    await userEvent.click(edit);
    expect(await screen.findByRole('heading', { name: 'Edit Pizza Hut' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(screen.getByText('Archive Pizza Hut?')).toBeInTheDocument();
    // The confirm dims the page with the scrim token, which darkens in both themes.
    expect(screen.getByText('Archive Pizza Hut?').closest('.fixed')).toHaveClass('bg-scrim');
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(postBodies(spy, '/organizations/bulk/')).toEqual([{ ids: [7], action: 'archive', value: null }]));
    expect(await screen.findByText('Archived')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Churn']);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Churn' }));
    expect(screen.getByText('Churn Pizza Hut?')).toBeInTheDocument();
  });

  it('lists every connected account on Details, each linking to its page and editable, at 375px too', async () => {
    stubOrganizationPage();
    renderOrganizationPage('/organizations/7?tab=details', { width: 375 });
    const section = await screen.findByRole('region', { name: 'Accounts' });
    await waitFor(() => expect(within(section).getAllByRole('listitem')).toHaveLength(2));
    expect(within(section).getByRole('link', { name: 'EMEA' })).toHaveAttribute('href', '/accounts/31');
    expect(within(section).getByText('Usage is steady and the renewal talks are friendly.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter by account' })).not.toBeInTheDocument();
    await userEvent.click(within(section).getByRole('button', { name: 'Edit EMEA' }));
    expect(screen.getByRole('heading', { name: 'Edit EMEA' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(within(section).getByRole('button', { name: 'Add account' }));
    expect(screen.getByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
  });

  it('adds an account from the chip row, and edits the chosen one', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Add account' }));
    expect(screen.getByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'EMEA 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit EMEA' }));
    expect(screen.getByRole('heading', { name: 'Edit EMEA' })).toBeInTheDocument();
  });

  it('keeps the page and says so when a reload fails, with Try again', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    // The next header read fails: archive, then the reload after it.
    stubOrganizationPage({ failPortfolio: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not refresh this organization: Try later.');
    expect(screen.getByRole('heading', { level: 1, name: 'Pizza Hut' })).toBeInTheDocument();
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByText('Archived')).toBeInTheDocument();
  });

  it('says why Edit is off when the record did not load, and Try again brings it back', async () => {
    stubOrganizationPage({ failCustomer: 1 });
    renderOrganizationPage();
    await landed();
    expect(await screen.findByText('Edit is unavailable: Try later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    await userEvent.click(within(header).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled());
    expect(screen.queryByText('Edit is unavailable: Try later.')).not.toBeInTheDocument();
  });

  it('says an organization this viewer cannot see is not found', async () => {
    stubOrganizationPage({ row: null });
    renderOrganizationPage('/organizations/99');
    expect(await screen.findByText('Organization not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to organizations' })).toHaveAttribute('href', '/organizations/list');
  });

  it('asks for nothing when the id is not a number', () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage('/organizations/abc');
    expect(screen.getByText('Organization not found')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows a failed header read with Try again', async () => {
    stubOrganizationPage({ failPortfolio: 1 });
    renderOrganizationPage();
    expect(await screen.findByText('Try later.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await landed();
  });

  it('shows a failed story with Try again, then pages the rest', async () => {
    const spy = stubOrganizationPage({ items: manyItems(35), failStory: 1 });
    renderOrganizationPage();
    await landed();
    expect(await screen.findByText('Try later.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(itemKeys()).toHaveLength(30));
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    await waitFor(() => expect(itemKeys()).toHaveLength(35));
    expect(lastStory(spy).get('cursor')).toBe('30');
  });

  it('lays the tiles out as a grid from sm', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    expect(screen.getByRole('button', { name: /^ARR/ }).parentElement).toHaveClass('grid', 'grid-cols-4');
  });

  it('on phones: a tile strip, scrolling tabs, and sheets from the bottom', async () => {
    stubOrganizationPage();
    renderOrganizationPage('/organizations/7', { width: 375 });
    await landed();
    const strip = screen.getByRole('button', { name: /^ARR/ }).parentElement;
    expect(strip).toHaveClass('overflow-x-auto', 'snap-x');
    expect(strip).not.toHaveClass('grid');
    expect(screen.getByRole('tablist')).toHaveClass('overflow-x-auto');
    await userEvent.click(await screen.findByRole('button', { name: 'Add to the story' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'New note' }));
    expect(screen.getByRole('dialog', { name: 'New note' }).closest('[data-shape]')).toHaveAttribute('data-shape', 'sheet');
  });

  it('keeps a visited tab mounted: People, Story, People reads the contacts once and never blanks them', async () => {
    const spy = stubOrganizationPage();
    // One real contact, so a blanked list would show.
    const contactReads: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (new URL(String(input)).pathname.endsWith('/customers/7/contacts/')) {
          contactReads.push(String(input));
          return {
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                name: 'Sarah Chen',
                role: 'executive_sponsor',
                role_display: 'Executive Sponsor',
                email: 'sarah.chen@pizzahut.example',
                phone: '+1 (408) 555-0123',
                status: 'active',
                sentiment: 'positive',
                last_contacted_at: '2026-08-31T00:00:00Z',
                companies: [{ id: 7, name: 'Pizza Hut' }],
                account_name: null,
                sentiment_source: 'manual',
                sentiment_evidence: {},
                sentiment_computed_at: null,
              },
            ],
          };
        }
        return spy(input, init);
      }),
    );
    renderOrganizationPage();
    await landed();
    await userEvent.click(screen.getByRole('tab', { name: 'People' }));
    const people = screen.getByRole('tabpanel', { name: 'People' });
    expect(await within(people).findByText('Sarah Chen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Story' }));
    expect(people).not.toBeVisible();
    expect(screen.getByRole('tabpanel', { name: 'Story' })).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'People' }));
    expect(screen.getByRole('tabpanel', { name: 'People' })).toBe(people);
    expect(within(people).getByText('Sarah Chen')).toBeVisible();
    expect(contactReads).toHaveLength(1);
    // Story stayed mounted too: going back to it did not read it again.
    expect(storyQueries(spy)).toHaveLength(1);
  });

  it('shows the header skeleton until the organization lands', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    expect(screen.getByRole('status', { name: 'Loading organization' })).toBeInTheDocument();
    await landed();
    expect(screen.queryByRole('status', { name: 'Loading organization' })).not.toBeInTheDocument();
  });

  it('saves a new account, which then shows in the chips and in Details, read again from the server', async () => {
    const { spy, saves } = stubAccountSaves();
    renderOrganizationPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Add account' }));
    await userEvent.type(screen.getByLabelText(/^Name/), 'APAC');
    await userEvent.type(screen.getByLabelText(/^Domain/), 'apac.pizzahut.example');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Add Account' })).not.toBeInTheDocument());
    expect(saves).toEqual([
      expect.objectContaining({ method: 'POST', path: '/customers/7/accounts/', body: expect.objectContaining({ name: 'APAC' }) }),
    ]);
    const chips = screen.getByRole('group', { name: 'Filter by account' });
    expect(await within(chips).findByRole('button', { name: /^APAC/ })).toBeInTheDocument();
    // The accounts were read again (onSaved), not patched in by the create.
    expect(requestPaths(spy).filter((path) => path === 'GET /customers/7/accounts/')).toHaveLength(2);
    await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    const section = await screen.findByRole('region', { name: 'Accounts' });
    await waitFor(() => expect(within(section).getAllByRole('listitem')).toHaveLength(3));
    expect(within(section).getByRole('link', { name: 'APAC' })).toHaveAttribute('href', '/accounts/33');
  });

  it('saves an edited account and shows the new name in the chips and in Details', async () => {
    const { saves } = stubAccountSaves();
    renderOrganizationPage('/organizations/7?account=31');
    await userEvent.click(await screen.findByRole('button', { name: 'Edit EMEA' }));
    const name = screen.getByLabelText(/^Name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'EMEA North');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Edit EMEA' })).not.toBeInTheDocument());
    expect(saves).toEqual([
      expect.objectContaining({ method: 'PATCH', path: '/customers/7/accounts/31/', body: expect.objectContaining({ name: 'EMEA North' }) }),
    ]);
    expect(await screen.findByRole('button', { name: 'EMEA North 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Edit EMEA North' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    const section = await screen.findByRole('region', { name: 'Accounts' });
    expect(within(section).getByRole('link', { name: 'EMEA North' })).toHaveAttribute('href', '/accounts/31');
  });

  it('churns from the name row: the change goes out, then the header reads it back', async () => {
    const spy = stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    const reads = portfolioRequests(spy).length;
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Churn' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Churn' }));
    await waitFor(() => expect(screen.queryByText('Churn Pizza Hut?')).not.toBeInTheDocument());
    const patches = spy.mock.calls.filter(
      ([input, init]) => new URL(String(input)).pathname === '/api/v1/customers/7/' && init?.method === 'PATCH',
    );
    expect(patches).toHaveLength(1);
    expect(JSON.parse(String(patches[0][1]?.body))).toEqual(expect.objectContaining({ lifecycle_stage: 'churn' }));
    expect(await screen.findByText('Churned')).toBeInTheDocument();
    expect(portfolioRequests(spy).length).toBeGreaterThan(reads);
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Archive']);
  });

  it('lands on an archived organization, offering only Churn', async () => {
    stubOrganizationPage({ row: { ...pizzaHut, is_archived: true } });
    renderOrganizationPage();
    await landed();
    expect(screen.getByText('Archived')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Churn']);
  });

  it('lands on a churned organization, offering only Archive, and none when it is archived too', async () => {
    const churned = { ...pizzaHut, churned: true, lifecycle: { value: 'churn' as const, label: 'Churn' }, signal: null };
    stubOrganizationPage({ row: churned });
    renderOrganizationPage();
    await landed();
    expect(screen.getByText('Churned')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Archive']);
  });

  it('hides the actions menu for an organization both churned and archived', async () => {
    const both = { ...pizzaHut, is_archived: true, churned: true, lifecycle: { value: 'churn' as const, label: 'Churn' }, signal: null };
    stubOrganizationPage({ row: both });
    renderOrganizationPage();
    await landed();
    expect(screen.queryByRole('button', { name: 'More actions for Pizza Hut' })).not.toBeInTheDocument();
  });

  it('links Feedback to the Surveys page, where surveys are edited, expired and deleted', async () => {
    stubOrganizationPage();
    renderOrganizationPage();
    await landed();
    expect(screen.queryByRole('link', { name: 'Manage surveys' })).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: /^Feedback/ }));
    expect(await screen.findByRole('link', { name: 'Manage surveys' })).toHaveAttribute('href', '/surveys');
  });
});
