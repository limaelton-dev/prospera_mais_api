import { Inject, Injectable } from '@nestjs/common';
import {
    UNIT_OF_WORK,
    type UnitOfWork,
} from '../../../../shared/application/unit-of-work.js';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import { MemberId } from '../../domain/member/member-id.js';
import { ConcurrentModificationError } from '../errors/concurrent-modification.error.js';
import { SpaceCommandReceiptConflictError } from '../errors/space-command-receipt-conflict.error.js';
import type { RespondToInvitationResult } from '../models/space-views.js';
import {
    INVITATION_TOKEN_GENERATOR,
    type InvitationTokenGenerator,
} from '../ports/private/invitation-token-generator.js';
import {
    SPACE_COMMAND_RECEIPTS,
    type RespondToInvitationCommand,
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

export type RespondToSharedSpaceInvitationInput = Omit<
    RespondToInvitationCommand,
    'operation' | 'tokenHash'
> & { token: string };

@Injectable()
export class RespondToSharedSpaceInvitationHandler {
    constructor(
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
        @Inject(SPACE_REPOSITORY) private readonly repository: SpaceRepository,
        @Inject(SPACE_COMMAND_RECEIPTS)
        private readonly receipts: SpaceCommandReceipts,
        @Inject(INVITATION_TOKEN_GENERATOR)
        private readonly tokens: InvitationTokenGenerator,
        @Inject(SPACE_READ_QUERIES) private readonly reads: SpaceReadQueries,
    ) {}

    async execute(
        input: RespondToSharedSpaceInvitationInput,
    ): Promise<RespondToInvitationResult> {
        const command: RespondToInvitationCommand = {
            operation: 'RESPOND_INVITATION',
            actorId: input.actorId,
            key: input.key,
            tokenHash: this.tokens.hash(input.token),
            decision: input.decision,
            expectedVersion: input.expectedVersion,
        };

        try {
            return await this.unitOfWork.execute(() => this.perform(command));
        } catch (error: unknown) {
            if (
                !(error instanceof ConcurrentModificationError) &&
                !(error instanceof SpaceCommandReceiptConflictError) &&
                !(
                    error instanceof SpacesDomainError &&
                    error.code === 'INVITATION_UNAVAILABLE'
                )
            )
                throw error;

            // A primeira execução pode confirmar entre a leitura do recibo e a da raiz.
            // Recuperar somente o recibo próprio em nova transação, sem repetir a escrita.
            return this.unitOfWork.execute(async () => {
                const receipt = await this.receipts.find(command);
                if (!receipt) throw error;
                return this.replay(command, receipt);
            });
        }
    }

    private async perform(
        command: RespondToInvitationCommand,
    ): Promise<RespondToInvitationResult> {
        const previous = await this.receipts.find(command);
        if (previous) return this.replay(command, previous);

        const target = await this.repository.findByInvitationTokenHash(
            command.tokenHash,
        );
        const now = new Date();
        const invitation = target?.space.invitations.find((candidate) =>
            candidate.id.equals(target.invitationId),
        );
        if (!target || !invitation || invitation.statusAt(now) !== 'PENDING') {
            throw new SpacesDomainError('INVITATION_UNAVAILABLE');
        }

        const { space, invitationId } = target;
        if (space.version !== command.expectedVersion)
            throw new ConcurrentModificationError();

        const member =
            command.decision === 'ACCEPT'
                ? space.acceptInvitation(
                      command.actorId,
                      invitationId,
                      MemberId.create(),
                      now,
                  )
                : null;
        if (command.decision === 'REJECT')
            space.rejectInvitation(command.actorId, invitationId, now);

        await this.repository.saveInvitationResponse(
            space,
            command.expectedVersion,
            {
                invitationId,
                memberId: member?.id ?? null,
            },
        );
        await this.receipts.save(command, {
            resultSpaceId: space.id,
            resultInvitationId: invitationId,
            createdAt: now,
        });

        if (member) {
            return {
                decision: 'ACCEPT',
                invitation: {
                    id: invitationId.value,
                    status: 'ACCEPTED',
                    resolvedAt: now.toISOString(),
                },
                spaceId: space.id.value,
                actorMembership: {
                    id: member.id.value,
                    personId: member.personId.value,
                    status: 'ACTIVE',
                },
                replayed: false,
            };
        }

        return {
            decision: 'REJECT',
            invitation: {
                id: invitationId.value,
                status: 'REJECTED',
                resolvedAt: now.toISOString(),
            },
            spaceId: space.id.value,
            actorMembership: null,
            replayed: false,
        };
    }

    private async replay(
        command: RespondToInvitationCommand,
        receipt: SpaceCommandReceipt,
    ): Promise<RespondToInvitationResult> {
        const result = await this.reads.findInvitationResponseResult(
            command,
            receipt,
        );
        if (!result) throw new SpacesDomainError('INVITATION_UNAVAILABLE');
        return { ...result, replayed: true };
    }
}
