import users from '@/data/users.json';
import type { User } from '@/types/auth';

const registeredUsers = users as User[];

export { sanitizeRedirectPath } from '@/utils/redirectPath';

export function validateCredentials(username: string, password: string): User | null {
  return (
    registeredUsers.find(
      (user) => user.username === username && user.password === password,
    ) ?? null
  );
}
