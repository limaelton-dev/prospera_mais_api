import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';
import type {
    SpaceDetailsView,
    SpaceInvitationView,
    SpaceSummaryView,
} from '../../models/space-views.js';

export const SPACE_READ_QUERIES = Symbol('SPACE_READ_QUERIES');

export interface SpaceReadQueries {
    listAccessible(actorId: PersonId): Promise<SpaceSummaryView[]>;

    findDetails(
        actorId: PersonId,
        spaceId: SpaceId,
        now: Date,
    ): Promise<SpaceDetailsView | null>;

    findInvitationResult(
        actorId: PersonId,
        spaceId: SpaceId,
        invitationId: InvitationId,
        now: Date,
    ): Promise<SpaceInvitationView | null>;
}
