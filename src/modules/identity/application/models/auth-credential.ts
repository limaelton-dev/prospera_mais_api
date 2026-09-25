import type { PersonId } from '../../../spaces/domain/person/person-id.js';

export type AuthCredential = {
    personId: PersonId;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
};
