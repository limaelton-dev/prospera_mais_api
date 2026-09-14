import type { PersonId } from '../../../spaces/domain/person/person-id.js';

export type AuthSession = {
  id: string;
  personId: PersonId;
  tokenHash: Buffer;
  expiresAt: Date;
  createdAt: Date;
};