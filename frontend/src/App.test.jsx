import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock global URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:3000/mock-uuid');
global.URL.revokeObjectURL = vi.fn();

// Mock global clipboard
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
  },
  writable: true,
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});


describe('App Component', () => {
  it('renders the initial layout with offline status and empty state', async () => {
    // Mock health endpoints to return offline (failed fetch)
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<App />);

    expect(screen.getByPlaceholderText(/paste destination url here/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting input/i)).toBeInTheDocument();

    // Check offline badges
    expect(screen.getByText(/Shortener: offline/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics: offline/i)).toBeInTheDocument();
    expect(screen.getByText(/QR Gen: offline/i)).toBeInTheDocument();
  });

  it('updates status badges to online when health checks pass', async () => {
    // Mock fetch to succeed for health checks
    global.fetch = vi.fn((url) => {
      if (url.includes('/health/')) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<App />);

    // Wait for the status badges to update
    await waitFor(() => {
      expect(screen.getByText(/Shortener: online/i)).toBeInTheDocument();
      expect(screen.getByText(/Analytics: online/i)).toBeInTheDocument();
      expect(screen.getByText(/QR Gen: online/i)).toBeInTheDocument();
    });
  });

  it('shortens a URL successfully, updates history, and displays results', async () => {
    // Setup fetch mock responses
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/health/')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/shorten/') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: body.long_url,
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            click_count: 5,
            last_clicked: '2026-08-18T14:00:00.000Z'
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    // Type a URL and click shorten
    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const submitBtn = screen.getByRole('button', { name: /shorten/i });
    fireEvent.click(submitBtn);

    // Wait for result to render
    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });

    expect(screen.getByText('http://localhost:8001/r/abc123/ ↗️')).toBeInTheDocument();
    expect(screen.getByText('Original URL: https://example.com')).toBeInTheDocument();

    // Verify stats are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // click count
    expect(screen.getByText(/Redirect Count/i)).toBeInTheDocument();
    expect(screen.getByText(/Last Click Date/i)).toBeInTheDocument();

    // Verify item is added to history
    expect(screen.getByText('/abc123')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('handles backend validation errors (e.g. invalid URL list)', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/health/')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            long_url: ['Enter a valid URL.']
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'http://invalid-url.com' } });
    
    const submitBtn = screen.getByRole('button', { name: /shorten/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ Invalid URL: Enter a valid URL./i)).toBeInTheDocument();
    });
  });

  it('handles other backend errors during shortening', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/health/')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'Database constraint failed'
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const submitBtn = screen.getByRole('button', { name: /shorten/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ Database constraint failed/i)).toBeInTheDocument();
    });
  });

  it('toggles QR code generation and handles its display and errors', async () => {
    const mockBlob = new Blob(['mock-qr-data'], { type: 'image/png' });
    
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: 'https://example.com',
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 0, last_clicked: null })
        });
      }
      if (url.includes('/api/qr/abc123')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });

    // Click Show QR
    const qrBtn = screen.getByRole('button', { name: /show qr/i });
    fireEvent.click(qrBtn);

    // Verify generated image
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /qr code/i })).toBeInTheDocument();
      expect(screen.getByText(/Hide QR/i)).toBeInTheDocument();
    });

    // Click Hide QR
    fireEvent.click(screen.getByRole('button', { name: /hide qr/i }));
    expect(screen.queryByRole('img', { name: /qr code/i })).not.toBeInTheDocument();

    // Click Show QR again (should use cached blob URL without calling fetch again)
    const originalFetchCount = global.fetch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /show qr/i }));
    expect(screen.getByRole('img', { name: /qr code/i })).toBeInTheDocument();
    expect(global.fetch.mock.calls.length).toBe(originalFetchCount);
  });

  it('handles QR generation failure (e.g. 404 and other)', async () => {
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: 'https://example.com',
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 0, last_clicked: null })
        });
      }
      if (url.includes('/api/qr/abc123')) {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });

    // Click Show QR
    const qrBtn = screen.getByRole('button', { name: /show qr/i });
    fireEvent.click(qrBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ QR error: Short code not found/i)).toBeInTheDocument();
    });
  });

  it('copies the short URL to clipboard', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: 'https://example.com',
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 0, last_clicked: null })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:8001/r/abc123/');
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();

    // Wait for the copy button text to revert back to 'Copy' (reverts after 2 seconds)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('loads history on mount and handles history item selection and clearing', async () => {
    const initialHistory = [
      { shortCode: 'h11111', longUrl: 'https://history1.com', shortUrl: 'http://localhost:8001/r/h11111/' },
      { shortCode: 'h22222', longUrl: 'https://history2.com', shortUrl: 'http://localhost:8001/r/h22222/' }
    ];
    localStorage.setItem('orange_history', JSON.stringify(initialHistory));

    global.fetch = vi.fn((url) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/stats/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 42, last_clicked: '2026-08-18T15:00:00.000Z' })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    // Verify history links are rendered
    expect(screen.getByText('/h11111')).toBeInTheDocument();
    expect(screen.getByText('/h22222')).toBeInTheDocument();

    // Click history item
    fireEvent.click(screen.getByText('/h11111'));

    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });
    expect(screen.getByText('http://localhost:8001/r/h11111/ ↗️')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // Redirect Count

    // Clear history
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText('/h11111')).not.toBeInTheDocument();
    expect(screen.queryByText('/h22222')).not.toBeInTheDocument();
    expect(localStorage.getItem('orange_history')).toBeNull();
  });

  it('handles JSON parsing errors in localStorage on mount gracefully', () => {
    localStorage.setItem('orange_history', 'invalid-json');
    render(<App />);
    expect(screen.getByText(/no previously shortened links recorded/i)).toBeInTheDocument();
  });

  it('handles empty input during shorten bypass', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/paste destination url here/i);
    // bypass HTML required attribute by submitting the form directly
    fireEvent.submit(input.closest('form'));
    expect(screen.getByText(/⚡ Please enter a destination URL/i)).toBeInTheDocument();
  });

  it('handles stats fetch failure and refreshes stats', async () => {
    let statsCallCount = 0;
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: 'https://example.com',
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        statsCallCount++;
        if (statsCallCount === 1) {
          return Promise.resolve({ ok: false }); // Fails first time
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 99, last_clicked: null })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    // Wait for the result screen to appear and verify error banner for stats failure
    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/⚡ Stats error: Failed to retrieve click statistics/i)).toBeInTheDocument();
    });

    // Now click Refresh Stats button to fetch successfully
    const refreshBtn = screen.getByRole('button', { name: /refresh stats/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });

  it('handles generic QR generation failure', async () => {
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/health/')) return Promise.resolve({ ok: true });
      if (url.includes('/api/shorten/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            short_code: 'abc123',
            long_url: 'https://example.com',
            short_url: 'http://localhost:8001/r/abc123/'
          })
        });
      }
      if (url.includes('/api/stats/abc123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ click_count: 0, last_clicked: null })
        });
      }
      if (url.includes('/api/qr/abc123')) {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    const input = screen.getByPlaceholderText(/paste destination url here/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('Short Link Active')).toBeInTheDocument();
    });

    const qrBtn = screen.getByRole('button', { name: /show qr/i });
    fireEvent.click(qrBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ QR error: Failed to generate QR code/i)).toBeInTheDocument();
    });
  });
});