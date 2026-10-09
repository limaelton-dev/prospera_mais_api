import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import { IdempotencyKeyReusedError } from '../../../application/errors/idempotency-key-reused.error.js';
import { SpaceCommandReceiptConflictError } from '../../../application/errors/space-command-receipt-conflict.error.js';
import type {
    SpaceCommand,
    SpaceCommandReceipt,
    SpaceCommandReceipts,
} from '../../../application/ports/private/space-command-receipts.js';
import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';
import { SpaceCommandReceiptOrmEntity } from '../entities/space-command-receipt.orm-entity.js';

function requestHash(command: SpaceCommand): Buffer {
    let input: readonly unknown[];

    switch (command.operation) {
        case 'CREATE_SPACE':
            input = [command.operation, command.name.trim()];
            break;
        case 'ISSUE_INVITATION':
            input = [
                command.operation,
                command.spaceId.value.toLowerCase(),
                command.expectedVersion,
            ];
            break;
        case 'REPLACE_INVITATION':
            input = [
                command.operation,
                command.spaceId.value.toLowerCase(),
                command.invitationId.value.toLowerCase(),
                command.expectedVersion,
            ];
            break;
    }

    return createHash('sha256').update(JSON.stringify(input)).digest();
}

@Injectable()
export class TypeOrmSpaceCommandReceipts implements SpaceCommandReceipts {
    constructor(
        private readonly entityManagerProvider: EntityManagerProvider,
    ) {}

    async find(command: SpaceCommand): Promise<SpaceCommandReceipt | null> {
        const entity = await this.entityManagerProvider
            .get()
            .getRepository(SpaceCommandReceiptOrmEntity)
            .findOneBy({
                actorId: command.actorId.value,
                operation: command.operation,
                key: command.key,
            });

        if (!entity) {
            return null;
        }

        if (!entity.requestHash.equals(requestHash(command))) {
            throw new IdempotencyKeyReusedError();
        }

        return {
            resultSpaceId: SpaceId.from(entity.resultSpaceId),
            resultInvitationId: InvitationId.from(entity.resultInvitationId),
            createdAt: entity.createdAt,
        };
    }

    async save(
        command: SpaceCommand,
        receipt: SpaceCommandReceipt,
    ): Promise<void> {
        const manager = this.entityManagerProvider.get();

        if (!manager.queryRunner?.isTransactionActive) {
            throw new Error('Command receipts require a transaction');
        }

        try {
            await manager.insert(SpaceCommandReceiptOrmEntity, {
                actorId: command.actorId.value,
                operation: command.operation,
                key: command.key,
                requestHash: requestHash(command),
                resultSpaceId: receipt.resultSpaceId.value,
                resultInvitationId: receipt.resultInvitationId.value,
                createdAt: receipt.createdAt,
            });
        } catch (error: unknown) {
            if (error instanceof QueryFailedError) {
                const databaseError = error.driverError as {
                    code?: string;
                    constraint?: string;
                };

                if (
                    databaseError.code === '23505' &&
                    databaseError.constraint === 'PK_space_command_receipts'
                ) {
                    throw new SpaceCommandReceiptConflictError();
                }
            }

            throw error;
        }
    }
}
