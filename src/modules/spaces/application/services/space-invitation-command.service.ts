import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    UNIT_OF_WORK,
    type UnitOfWork,
} from '../../../../shared/application/unit-of-work.js';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import { InvitationId } from '../../domain/invitation/invitation-id.js';
import { Invitation } from '../../domain/invitation/invitation.js';
import { MemberId } from '../../domain/member/member-id.js';
import { MemberStatus } from '../../domain/member/member.js';
import { PersonId } from '../../domain/person/person-id.js';
import { SpaceId } from '../../domain/space/space-id.js';
import { Space, SpaceStatus, SpaceType } from '../../domain/space/space.js';
import { ConcurrentModificationError } from '../errors/concurrent-modification.error.js';
import { SpaceCommandReceiptConflictError } from '../errors/space-command-receipt-conflict.error.js';
import type { SpaceCommandResult } from '../models/space-views.js';
import {
    INVITATION_TOKEN_GENERATOR,
    type InvitationTokenGenerator,
} from '../ports/private/invitation-token-generator.js';
import {
    SPACE_COMMAND_RECEIPTS,
    type SpaceInvitationCommand,
    type SpaceCommandReceipt,
    type SpaceCommandReceipts,
} from '../ports/private/space-command-receipts.js';
import {
    SPACE_READ_QUERIES,
    type SpaceReadQueries,
} from '../ports/private/space-read-queries.js';
import {
    SPACE_REPOSITORY,
    type SpaceRepository,
} from '../ports/private/space.repository.js';

@Injectable()
export class SpaceInvitationCommandService {
    constructor(
        @Inject(UNIT_OF_WORK)
        private readonly unitOfWork: UnitOfWork,

        @Inject(SPACE_REPOSITORY)
        private readonly repository: SpaceRepository,

        @Inject(SPACE_COMMAND_RECEIPTS)
        private readonly receipts: SpaceCommandReceipts,

        @Inject(INVITATION_TOKEN_GENERATOR)
        private readonly tokens: InvitationTokenGenerator,

        @Inject(SPACE_READ_QUERIES)
        private readonly readQueries: SpaceReadQueries,

        private readonly configService: ConfigService,
    ) {}

    async execute(
        command: SpaceInvitationCommand,
    ): Promise<SpaceCommandResult> {
        try {
            return await this.unitOfWork.execute(() => this.perform(command));
        } catch (error: unknown) {
            if (
                !(error instanceof SpaceCommandReceiptConflictError) &&
                !(error instanceof ConcurrentModificationError)
            ) {
                throw error;
            }

            return this.unitOfWork.execute(async () => {
                if (command.operation !== 'CREATE_SPACE') {
                    await this.requireIssuer(command.actorId, command.spaceId);
                }

                const receipt = await this.receipts.find(command);

                if (!receipt) {
                    throw error;
                }

                return this.replay(command.actorId, receipt);
            });
        }
    }

    private async perform(
        command: SpaceInvitationCommand,
    ): Promise<SpaceCommandResult> {
        const existing =
            command.operation === 'CREATE_SPACE'
                ? null
                : await this.requireIssuer(command.actorId, command.spaceId);

        const previous = await this.receipts.find(command);

        if (previous) {
            return this.replay(command.actorId, previous);
        }

        const now = new Date();
        const invitationId = InvitationId.create();

        let space: Space;
        let invitation: Invitation;

        if (command.operation === 'CREATE_SPACE') {
            space = Space.createShared({
                id: SpaceId.create(),
                name: command.name,
                createdByPersonId: command.actorId,
                creatorMemberId: MemberId.create(),
                invitationId,
                now,
            });

            invitation = space.invitations[0];
        } else {
            if (!existing) {
                throw new Error('Expected an existing shared space');
            }

            if (existing.version !== command.expectedVersion) {
                throw new ConcurrentModificationError();
            }

            space = existing;

            invitation =
                command.operation === 'ISSUE_INVITATION'
                    ? space.issueInvitation(command.actorId, invitationId, now)
                    : space.replaceInvitation(
                          command.actorId,
                          command.invitationId,
                          invitationId,
                          now,
                      );
        }

        const generated = this.tokens.generate();
        const persistence = {
            invitationId,
            tokenHash: generated.tokenHash,
        };

        if (command.operation === 'CREATE_SPACE') {
            await this.repository.createShared(space, persistence);
        } else {
            await this.repository.saveInvitationChange(
                space,
                command.expectedVersion,
                persistence,
            );
        }

        await this.receipts.save(command, {
            resultSpaceId: space.id,
            resultInvitationId: invitationId,
            createdAt: now,
        });

        return this.emitted(
            space,
            invitation,
            command.actorId,
            generated.token,
        );
    }

    private async requireIssuer(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<Space> {
        const space = await this.repository.findById(spaceId);

        if (
            !space ||
            space.type !== SpaceType.SHARED ||
            !space.members.some(
                (member) =>
                    member.status === MemberStatus.ACTIVE &&
                    member.personId.equals(actorId),
            )
        ) {
            throw new SpacesDomainError('SPACE_NOT_FOUND');
        }

        if (!space.createdByPersonId?.equals(actorId)) {
            throw new SpacesDomainError('INVITATION_ISSUER_REQUIRED');
        }

        return space;
    }

    private async replay(
        actorId: PersonId,
        receipt: SpaceCommandReceipt,
    ): Promise<SpaceCommandResult> {
        const result = await this.readQueries.findInvitationResult(
            actorId,
            receipt.resultSpaceId,
            receipt.resultInvitationId,
            new Date(),
        );

        if (!result) {
            throw new SpacesDomainError('SPACE_NOT_FOUND');
        }

        return {
            ...result,
            inviteUrl: null,
            linkAvailable: false,
            replayed: true,
        };
    }

    private emitted(
        space: Space,
        invitation: Invitation,
        actorId: PersonId,
        token: string,
    ): SpaceCommandResult {
        const member = space.members.find(
            (candidate) =>
                candidate.status === MemberStatus.ACTIVE &&
                candidate.personId.equals(actorId),
        );

        if (
            space.type !== SpaceType.SHARED ||
            space.status !== SpaceStatus.ACTIVE ||
            space.name === null ||
            !member
        ) {
            throw new Error('Invalid newly issued invitation result');
        }

        const url = new URL(
            '/invitations',
            this.configService.getOrThrow<string>('WEB_ORIGIN'),
        );

        url.hash = `token=${token}`;

        return {
            space: {
                id: space.id.value,
                type: 'SHARED',
                status: 'ACTIVE',
                label: space.name,
                version: space.version,
            },
            actorMembership: {
                id: member.id.value,
                personId: member.personId.value,
                status: 'ACTIVE',
            },
            invitation: {
                id: invitation.id.value,
                status: 'PENDING',
                expiresAt: invitation.expiresAt.toISOString(),
            },
            inviteUrl: url.toString(),
            linkAvailable: true,
            replayed: false,
        };
    }
}
