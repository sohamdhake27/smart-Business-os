import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('renders loading state copy', () => {
    render(<LoadingState title="Loading page" description="Preparing data" />);

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    expect(screen.getByText('Preparing data')).toBeInTheDocument();
  });
});
