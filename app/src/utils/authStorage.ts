import type { AuthSession } from '@/types/auth';

export const AUTH_STORAGE_KEY = 'auth';

function clearCorruptAuthStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function loadAuthFromStorage(): AuthSession | null {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      typeof parsedValue === 'object' &&
      parsedValue !== null &&
      'username' in parsedValue &&
      typeof parsedValue.username === 'string' &&
      parsedValue.username.trim().length > 0
    ) {
      return { username: parsedValue.username };
    }

    clearCorruptAuthStorage();
    return null;
  } catch {
    clearCorruptAuthStorage();
    return null;
  }
}

export function saveAuthToStorage(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}
