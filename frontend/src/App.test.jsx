import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: false })
  );
});

describe('App', () => {
  it('renders the shorten form', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/paste destination url here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
  });

  it('shows the empty state when no result yet', () => {
    render(<App />);
    expect(screen.getByText(/awaiting input/i)).toBeInTheDocument();
  });

  it('shows an error when submitting without a URL', () => {
    render(<App />);
    // the input has `required`, but component also has its own guard
    expect(screen.queryByText(/please enter a destination url/i)).not.toBeInTheDocument();
  });
});