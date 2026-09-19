import { randomBytes } from 'node:crypto';

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

/**
 * A user nobody else in the run can collide with. The feed and the mailbox are
 * global, so unique names are what keep parallel tests from seeing each
 * other's data. The identity provider caps usernames at 20 characters.
 */
export function createTestUser(prefix = 'e2e'): TestUser {
  const id = randomBytes(4).toString('hex');

  return {
    username: `${prefix}_${id}`.slice(0, 20),
    email: `${prefix}.${id}@example.test`,
    password: `Pw-${randomBytes(9).toString('base64url')}`,
  };
}
