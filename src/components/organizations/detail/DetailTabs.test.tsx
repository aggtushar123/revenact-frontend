import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { detailPanelId, detailTabId, type DetailTab } from '../../../features/organizations/detailParams';
import { DetailTabs } from './DetailTabs';

function Host() {
  const [tab, setTab] = useState<DetailTab>('story');
  return (
    <>
      <DetailTabs idBase="t" active={tab} onChange={setTab} />
      <div role="tabpanel" id={detailPanelId('t', tab)} aria-labelledby={detailTabId('t', tab)}>
        {tab}
      </div>
    </>
  );
}

describe('DetailTabs (spec §1.5)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it('is a tablist of the six tabs with the active one selected and alone in the tab order', () => {
    render(<Host />);
    expect(screen.getByRole('tablist', { name: 'Organization sections' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Story', 'Details', 'People', 'Deals & risks', 'Knowledge', 'Files']);
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1', '-1']);
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveAttribute('aria-controls', 't-panel-story');
    expect(screen.getByRole('tabpanel', { name: 'Story' })).toBeInTheDocument();
  });

  it('moves with the arrows, Home and End, wrapping, and selects as it goes', async () => {
    render(<Host />);
    screen.getByRole('tab', { name: 'Story' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('details');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveAttribute('aria-selected', 'true');
  });

  it('selects on click and scrolls the chosen tab into view', async () => {
    render(<Host />);
    const scroll = vi.mocked(Element.prototype.scrollIntoView);
    scroll.mockClear();
    const knowledge = screen.getByRole('tab', { name: 'Knowledge' });
    await userEvent.click(knowledge);
    expect(screen.getByRole('tabpanel', { name: 'Knowledge' })).toHaveTextContent('knowledge');
    expect(scroll.mock.contexts).toContain(knowledge);
  });
});
