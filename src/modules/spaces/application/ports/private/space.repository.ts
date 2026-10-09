import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { MemberId } from '../../../domain/member/member-id.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';
import { Space } from '../../../domain/space/space.js';

export const SPACE_REPOSITORY = Symbol('SPACE_REPOSITORY');

export type NewInvitationPersistence = {
    invitationId: InvitationId;
    tokenHash: Uint8Array;
};

export type InvitationResponseTarget = {
    space: Space;
    invitationId: InvitationId;
};

export type InvitationResponsePersistence = {
    invitationId: InvitationId;
    memberId: MemberId | null;
};

export interface SpaceRepository {
    save(space: Space): Promise<void>;

    findById(space: SpaceId): Promise<Space | null>;

    findByInvitationTokenHash(
        tokenHash: Uint8Array,
    ): Promise<InvitationResponseTarget | null>;

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

    saveInvitationResponse(
        space: Space,
        expectedVersion: number,
        response: InvitationResponsePersistence,
    ): Promise<void>;
}
