import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Overview } from './Overview';

describe('Overview', () => {
  it('links each area carrying only the shared filters', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/overview?owner=7&days=30']}>
        <Overview />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Open Health/ })).toHaveAttribute('href', '/dashboard/health?owner=7');
  });
});
