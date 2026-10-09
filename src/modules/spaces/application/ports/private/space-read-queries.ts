import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';
import type {
    InvitationPreviewData,
    InvitationResponseView,
    SpaceDetailsView,
    SpaceInvitationView,
    SpaceSummaryView,
} from '../../models/space-views.js';
import type {
    RespondToInvitationCommand,
    SpaceCommandReceipt,
} from './space-command-receipts.js';

export const SPACE_READ_QUERIES = Symbol('SPACE_READ_QUERIES');

export interface SpaceReadQueries {
    findInvitationPreview(
        actorId: PersonId,
        tokenHash: Uint8Array,
    ): Promise<InvitationPreviewData | null>;

    findInvitationResponseResult(
        command: RespondToInvitationCommand,
        receipt: SpaceCommandReceipt,
    ): Promise<InvitationResponseView | null>;

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
