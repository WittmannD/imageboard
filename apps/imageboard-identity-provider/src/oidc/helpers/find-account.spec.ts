import { describe, expect, it, vi } from 'vitest';

import type { UserService } from '../../user/user.service.js';
import createFindAccount from './find-account.js';

const CHANGED_AT = new Date('2026-01-01T12:00:00.500Z');
const CHANGED_SECONDS = Math.floor(CHANGED_AT.getTime() / 1000);

function setup(user: Record<string, unknown> | null) {
  const users = { findOneById: vi.fn().mockResolvedValue(user) };
  const findAccount = createFindAccount(users as unknown as UserService);

  const makeCtx = (loginTs?: number) => {
    const session = { loginTs, accountId: 'u1', destroy: vi.fn() };

    return { session, ctx: { oidc: { session } } as never };
  };

  return { users, findAccount, makeCtx };
}

const user = (passwordChangedAt: Date | null) => ({
  id: 'u1',
  email: 'u@example.test',
  emailVerified: true,
  username: 'u',
  passwordChangedAt,
});

describe('findAccount password-change watermark', () => {
  it('honors everything when the password was never changed', async () => {
    const { findAccount, makeCtx } = setup(user(null));

    const account = await findAccount(makeCtx(1).ctx, 'u1', { iat: 1 } as never);

    expect(account?.accountId).toBe('u1');
  });

  it('rejects a token issued before the change', async () => {
    const { findAccount, makeCtx } = setup(user(CHANGED_AT));

    const account = await findAccount(
      makeCtx().ctx,
      'u1',
      { iat: CHANGED_SECONDS - 10 } as never,
    );

    expect(account).toBeUndefined();
  });

  it('accepts a token issued after the change', async () => {
    const { findAccount, makeCtx } = setup(user(CHANGED_AT));

    const account = await findAccount(
      makeCtx().ctx,
      'u1',
      { iat: CHANGED_SECONDS + 1 } as never,
    );

    expect(account?.accountId).toBe('u1');
  });

  it('accepts a login made in the same second as the change', async () => {
    const { findAccount, makeCtx } = setup(user(CHANGED_AT));

    const account = await findAccount(
      makeCtx().ctx,
      'u1',
      { iat: CHANGED_SECONDS } as never,
    );

    expect(account?.accountId).toBe('u1');
  });

  it('destroys an OP session that predates the change, so the user must log in again', async () => {
    const { findAccount, makeCtx } = setup(user(CHANGED_AT));
    const { ctx, session } = makeCtx(CHANGED_SECONDS - 10);

    const account = await findAccount(ctx, 'u1');

    expect(account).toBeUndefined();
    expect(session.destroy).toHaveBeenCalledOnce();
    expect('accountId' in session).toBe(false);
  });

  it('keeps an OP session created after the change', async () => {
    const { findAccount, makeCtx } = setup(user(CHANGED_AT));
    const { ctx, session } = makeCtx(CHANGED_SECONDS + 5);

    const account = await findAccount(ctx, 'u1');

    expect(account?.accountId).toBe('u1');
    expect(session.destroy).not.toHaveBeenCalled();
  });

  it('has nothing to compare without a token or a session', async () => {
    const { findAccount } = setup(user(CHANGED_AT));

    const account = await findAccount({ oidc: {} } as never, 'u1');

    expect(account?.accountId).toBe('u1');
  });

  it('does not resolve a decoy id, and never queries for it', async () => {
    const { findAccount, makeCtx, users } = setup(null);

    const account = await findAccount(makeCtx().ctx, 'untrusted-abc');

    expect(account).toBeUndefined();
    expect(users.findOneById).not.toHaveBeenCalled();
  });

  it('does not resolve a deleted user', async () => {
    const { findAccount, makeCtx } = setup(null);

    expect(await findAccount(makeCtx().ctx, 'u1')).toBeUndefined();
  });
});
