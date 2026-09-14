import type { PersonId } from '../../../../spaces/domain/person/person-id.js';
import { AuthCredential } from '../../models/auth-creadential.js';

export const CREDENTIAL_REPOSITORY = Symbol(
  'CREDENTIAL_REPOSITORY',
);

export interface CredentialRepository {
  save(credential: AuthCredential): Promise<void>;

  findByEmail(
    email: string,
  ): Promise<AuthCredential | null>;

  findByPersonId(
    personId: PersonId,
  ): Promise<AuthCredential | null>;
}