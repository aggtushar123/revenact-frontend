import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeDetailStore } from '../../pages/organizations/testDetail';
import { CanvasListTab } from './CanvasListTab';

// Unit tier: CanvasListTab is presentational (its data comes from a caller's
// own fetch/store), so this only needs a real store for useAppDispatch (the
// delete confirm's dispatch) and a router for the Link/navigate calls — no
// fetch stubbing, no network involved.

function renderTab(props: Partial<React.ComponentProps<typeof CanvasListTab>> = {}) {
  render(
    <Provider store={makeDetailStore()}>
      <MemoryRouter>
        <CanvasListTab canvases={[]} isLoading={false} error="Could not load canvases." {...props} />
      </MemoryRouter>
    </Provider>,
  );
}

describe('CanvasListTab error state', () => {
  it('renders the error with no Try again button when onRetry is not given', () => {
    renderTab();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load canvases.');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('renders Try again when onRetry is given, and clicking it calls onRetry', async () => {
    const onRetry = vi.fn();
    renderTab({ onRetry });
    const button = screen.getByRole('button', { name: 'Try again' });
    await userEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
