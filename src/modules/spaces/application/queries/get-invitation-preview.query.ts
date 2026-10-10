import { Inject, Injectable } from '@nestjs/common';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import { PersonId } from '../../domain/person/person-id.js';
import type { InvitationPreviewView } from '../models/space-views.js';
import {
    SPACE_READ_QUERIES,
    type SpaceReadQueries,
} from '../ports/private/space-read-queries.js';
import {
    INVITATION_TOKEN_GENERATOR,
    type InvitationTokenGenerator,
} from '../ports/private/invitation-token-generator.js';

@Injectable()
export class GetInvitationPreviewQuery {
    constructor(
        @Inject(SPACE_READ_QUERIES)
        private readonly reads: SpaceReadQueries,
        @Inject(INVITATION_TOKEN_GENERATOR)
        private readonly tokens: InvitationTokenGenerator,
    ) {}

    async execute(
        actorId: PersonId,
        token: string,
    ): Promise<InvitationPreviewView> {
        const data = await this.reads.findInvitationPreview(
            actorId,
            this.tokens.hash(token),
        );
        const now = new Date();

        if (
            !data ||
            data.invitation.status !== 'PENDING' ||
            now >= new Date(data.invitation.expiresAt)
        ) {
            throw new SpacesDomainError('INVITATION_UNAVAILABLE');
        }

        if (data.space.status !== 'ACTIVE') {
            throw new SpacesDomainError('SPACE_NOT_ACTIVE');
        }

        if (data.activeMemberCount >= 2) {
            throw new SpacesDomainError('SPACE_MEMBER_LIMIT_REACHED');
        }

        return {
            invitation: { ...data.invitation, status: 'PENDING' },
            space: {
                id: data.space.id,
                label: data.space.label,
                version: data.space.version,
            },
            invitedBy: { displayName: data.invitedBy.displayName },
            canRespond: !data.actorIsCreator && !data.actorIsMember,
        };
    }
}
