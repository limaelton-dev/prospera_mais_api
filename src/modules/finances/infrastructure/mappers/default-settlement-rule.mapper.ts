import { DefaultSettlementRule } from '../../domain/default-settlement-rule/default-settlement-rule.js';
import { SettlementRule } from '../../domain/settlement-rule/settlement-rule.js';
import type { DefaultSettlementRuleOrmEntity } from '../typeorm/entities/default-settlement-rule.orm-entity.js';
export function toDefaultSettlementRule(
    entity: DefaultSettlementRuleOrmEntity,
): DefaultSettlementRule {
    return DefaultSettlementRule.restore(
        entity.spaceId,
        SettlementRule.from({
            kind: entity.kind as 'MONTHLY_DAY',
            dayOfMonth: entity.dayOfMonth,
        }),
        entity.version,
        entity.createdAt,
        entity.updatedAt,
    );
}
