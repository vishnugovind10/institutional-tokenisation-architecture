import { afterEach, describe, expect, it, vi } from 'vitest';
import { needsPasswordSetup, sessionFromAuthCallback, updatePassword } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('sessionFromAuthCallback', () => {
  it('ignores URLs that do not contain an auth session', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await expect(sessionFromAuthCallback('#overview')).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('surfaces incomplete invitation callbacks and clears their fragment', async () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      history: { replaceState },
      location: { pathname: '/invite', search: '' },
    });

    await expect(sessionFromAuthCallback('#type=invite')).rejects.toThrow('incomplete');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/invite');
  });

  it('restores and stores a verified invite session, then removes the auth fragment', async () => {
    const values = new Map<string, string>();
    const replaceState = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('window', {
      history: { replaceState },
      location: { pathname: '/workbench', search: '?invite=accepted' },
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'user-1', email: 'reviewer@example.test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const session = await sessionFromAuthCallback('#access_token=access-1&refresh_token=refresh-1&expires_in=600&type=invite');

    expect(session).toMatchObject({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user: { id: 'user-1', email: 'reviewer@example.test' },
    });
    expect(values.get('ita-saas-session-v1')).toContain('access-1');
    expect(needsPasswordSetup()).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/workbench?invite=accepted');
  });

  it('requires an authenticated password update before clearing invite setup', async () => {
    const values = new Map<string, string>([['ita-saas-password-setup-v1', 'true']]);
    const fetch = vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }));
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('fetch', fetch);

    await updatePassword('access-1', 'correct-horse-battery');

    expect(fetch).toHaveBeenCalledWith('/auth/v1/user', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ Authorization: 'Bearer access-1' }),
    }));
    expect(needsPasswordSetup()).toBe(false);
  });

  it('rejects passwords shorter than the app policy', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await expect(updatePassword('access-1', 'short')).rejects.toThrow('at least 10 characters');
    expect(fetch).not.toHaveBeenCalled();
  });
});
