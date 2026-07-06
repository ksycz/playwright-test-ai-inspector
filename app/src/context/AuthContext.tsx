import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession } from '@/types/auth';
import { validateCredentials } from '@/utils/auth';
import { loadAuthFromStorage, saveAuthToStorage } from '@/utils/authStorage';

interface AuthContextValue {
  user: AuthSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(() => loadAuthFromStorage());

  useEffect(() => {
    saveAuthToStorage(user);
  }, [user]);

  const login = useCallback((username: string, password: string) => {
    const authenticatedUser = validateCredentials(username, password);

    if (!authenticatedUser) {
      return false;
    }

    setUser({ username: authenticatedUser.username });
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
