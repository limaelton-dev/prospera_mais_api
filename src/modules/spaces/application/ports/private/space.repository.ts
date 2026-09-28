import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { Space } from '../../../domain/space/space.js';

export const SPACE_REPOSITORY = Symbol('SPACE_REPOSITORY');

export type NewInvitationPersistence = {
    invitationId: InvitationId;
    tokenHash: Uint8Array;
};

export interface SpaceRepository {
    save(space: Space): Promise<void>;

    findPersonalByOwnerPersonId(personId: PersonId): Promise<Space | null>;

    createShared(
        space: Space,
        invitation: NewInvitationPersistence,
    ): Promise<void>;

    saveInvitationChange(
        space: Space,
        expectedVersion: number,
        invitation: NewInvitationPersistence,
    ): Promise<void>;
}
