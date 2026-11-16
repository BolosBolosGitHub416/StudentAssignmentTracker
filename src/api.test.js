import { afterEach, describe, expect, it, vi } from 'vitest';
import { API, apiFetch } from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('sends authenticated JSON requests and returns the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 'assignment-1' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const body = await apiFetch('/api/assignments', {
      token: 'test-token',
      method: 'POST',
      body: { title: 'Lab report' },
    });

    expect(body).toEqual({ id: 'assignment-1' });
    expect(fetch).toHaveBeenCalledWith(`${API}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ title: 'Lab report' }),
    });
  });

  it('includes field validation details when the API rejects a request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: { title: 'Title is required' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    await expect(apiFetch('/api/assignments')).rejects.toMatchObject({
      message: 'Validation failed: title: Title is required',
      status: 400,
    });
  });

  it('explains how to start the API when the network is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(apiFetch('/api/assignments')).rejects.toThrow(
      `Cannot reach the API at ${API}. Start the backend in another terminal with "npm run server".`,
    );
  });
});
