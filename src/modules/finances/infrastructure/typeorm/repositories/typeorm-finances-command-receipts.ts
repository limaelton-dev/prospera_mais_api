import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import type {
    ConfigureDefaultSettlementRuleCommand,
    ConfigureDefaultSettlementRuleResult,
} from '../../../application/models/default-settlement-rule.view.js';
import {
    FinancesReceiptRaceError,
    type FinancesCommandReceipts,
} from '../../../application/ports/private/finances-command-receipts.js';
import { FinancesError } from '../../../domain/errors/finances.error.js';
import { FinancesCommandReceiptOrmEntity } from '../entities/finances-command-receipt.orm-entity.js';
import { DefaultSettlementRuleChangeOrmEntity } from '../entities/default-settlement-rule-change.orm-entity.js';
const operation = 'CONFIGURE_DEFAULT_SETTLEMENT_RULE';
function hash(c: ConfigureDefaultSettlementRuleCommand) {
    return createHash('sha256')
        .update(
            JSON.stringify([
                operation,
                c.spaceId.value.toLowerCase(),
                c.expectedVersion,
                c.rule.kind,
                c.rule.dayOfMonth,
            ]),
        )
        .digest();
}
@Injectable()
export class TypeOrmFinancesCommandReceipts implements FinancesCommandReceipts {
    constructor(private readonly managers: EntityManagerProvider) {}
    async find(command: ConfigureDefaultSettlementRuleCommand) {
        const manager = this.managers.get();
        const receipt = await manager.findOneBy(
            FinancesCommandReceiptOrmEntity,
            { actorId: command.actorId.value, operation, key: command.key },
        );
        if (!receipt) return null;
        if (!receipt.requestHash.equals(hash(command)))
            throw new FinancesError('IDEMPOTENCY_KEY_REUSED');
        const change = await manager.findOneBy(
            DefaultSettlementRuleChangeOrmEntity,
            { spaceId: receipt.resultSpaceId, version: receipt.resultVersion },
        );
        if (!change) throw new Error('Missing receipt result');
        return {
            spaceId: receipt.resultSpaceId,
            version: receipt.resultVersion,
            rule: {
                kind: 'MONTHLY_DAY' as const,
                dayOfMonth: change.dayOfMonth,
            },
            updatedAt: change.occurredAt.toISOString(),
            changed: receipt.changed,
            replayed: true,
        };
    }
    async save(
        command: ConfigureDefaultSettlementRuleCommand,
        result: ConfigureDefaultSettlementRuleResult,
        now: Date,
    ) {
        const manager = this.managers.get();
        if (!manager.queryRunner?.isTransactionActive)
            throw new Error('Receipts require a transaction');
        try {
            await manager.insert(FinancesCommandReceiptOrmEntity, {
                actorId: command.actorId.value,
                operation,
                key: command.key,
                requestHash: hash(command),
                status: 'COMPLETED',
                resultSpaceId: result.spaceId,
                resultVersion: result.version,
                changed: result.changed,
                createdAt: now,
            });
        } catch (error: unknown) {
            if (
                error instanceof QueryFailedError &&
                (error.driverError as { code?: string; constraint?: string })
                    .code === '23505' &&
                (error.driverError as { constraint?: string }).constraint ===
                    'PK_finances_command_receipts'
            )
                throw new FinancesReceiptRaceError();
            throw error;
        }
    }
}
