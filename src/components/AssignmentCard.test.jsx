import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AssignmentCard from './AssignmentCard.jsx';

afterEach(cleanup);

describe('AssignmentCard', () => {
  it('renders assignment details and progress', () => {
    render(
      <AssignmentCard
        assignment={{
          title: 'Research paper',
          course: 'Biology 101',
          priority: 'HIGH',
          progress: 75,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Research paper' })).toBeTruthy();
    expect(screen.getByText('Biology 101')).toBeTruthy();
    expect(screen.getByText('HIGH')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });
});
