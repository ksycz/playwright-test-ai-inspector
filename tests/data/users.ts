export const validUser = {
  username: 'standard_user',
  password: 'secret123',
} as const;

export const invalidUser = {
  username: 'standard_user',
  password: 'wrong-password',
} as const;

export const demoUsers = {
  valid: validUser,
  invalid: invalidUser,
} as const;

