import users from '@/data/users.json';
import type { User } from '@/types/auth';

const registeredUsers = users as User[];

export function validateCredentials(username: string, password: string): User | null {
  return (
    registeredUsers.find(
      (user) => user.username === username && user.password === password,
    ) ?? null
  );
}

export function sanitizeRedirectPath(redirectPath: string | null): string {
  if (!redirectPath || !redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    return '/products';
  }

  return redirectPath;
}
