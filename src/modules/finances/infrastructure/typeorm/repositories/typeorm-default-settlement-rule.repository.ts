import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import type { DefaultSettlementRuleRepository } from '../../../application/ports/private/default-settlement-rule.repository.js';
import type { DefaultSettlementRule } from '../../../domain/default-settlement-rule/default-settlement-rule.js';
import type { SettlementRuleSnapshot } from '../../../domain/settlement-rule/settlement-rule.js';
import { FinancesError } from '../../../domain/errors/finances.error.js';
import { DefaultSettlementRuleOrmEntity } from '../entities/default-settlement-rule.orm-entity.js';
import { DefaultSettlementRuleChangeOrmEntity } from '../entities/default-settlement-rule-change.orm-entity.js';
import { toDefaultSettlementRule } from '../../mappers/default-settlement-rule.mapper.js';
@Injectable()
export class TypeOrmDefaultSettlementRuleRepository implements DefaultSettlementRuleRepository {
    constructor(private readonly managers: EntityManagerProvider) {}
    async find(spaceId: string) {
        const entity = await this.managers
            .get()
            .findOneBy(DefaultSettlementRuleOrmEntity, { spaceId });
        return entity ? toDefaultSettlementRule(entity) : null;
    }
    async save(
        aggregate: DefaultSettlementRule,
        expectedVersion: number,
        actorId: string,
        previous: SettlementRuleSnapshot | null,
    ) {
        const manager = this.managers.get();
        if (!manager.queryRunner?.isTransactionActive)
            throw new Error('Configuration requires a transaction');
        const values = {
            kind: aggregate.rule.snapshot.kind,
            dayOfMonth: aggregate.rule.dayOfMonth,
            version: aggregate.version,
            updatedAt: aggregate.updatedAt,
        };
        try {
            if (expectedVersion === 0)
                await manager.insert(DefaultSettlementRuleOrmEntity, {
                    spaceId: aggregate.spaceId,
                    ...values,
                    createdAt: aggregate.createdAt,
                });
            else {
                const result = await manager.update(
                    DefaultSettlementRuleOrmEntity,
                    { spaceId: aggregate.spaceId, version: expectedVersion },
                    values,
                );
                if (result.affected !== 1)
                    throw new FinancesError('CONCURRENT_MODIFICATION');
            }
        } catch (error: unknown) {
            if (
                error instanceof QueryFailedError &&
                (error.driverError as { code?: string; constraint?: string })
                    .code === '23505' &&
                (error.driverError as { constraint?: string }).constraint ===
                    'PK_default_settlement_rules'
            )
                throw new FinancesError('CONCURRENT_MODIFICATION');
            throw error;
        }
        await manager.insert(DefaultSettlementRuleChangeOrmEntity, {
            spaceId: aggregate.spaceId,
            version: aggregate.version,
            actorPersonId: actorId,
            previousKind: previous?.kind ?? null,
            previousDayOfMonth: previous?.dayOfMonth ?? null,
            kind: values.kind,
            dayOfMonth: values.dayOfMonth,
            occurredAt: aggregate.updatedAt,
        });
    }
}
