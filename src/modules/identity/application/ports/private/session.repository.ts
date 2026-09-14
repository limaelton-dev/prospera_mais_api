import type { AuthSession } from '../../models/auth-session.js';

export const SESSION_REPOSITORY = Symbol(
  'SESSION_REPOSITORY',
);

export interface SessionRepository {
  save(session: AuthSession): Promise<void>;

  findByTokenHash(
    tokenHash: Buffer,
  ): Promise<AuthSession | null>;

  deleteById(id: string): Promise<void>;
}