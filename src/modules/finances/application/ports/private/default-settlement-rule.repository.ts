import type { DefaultSettlementRule } from '../../../domain/default-settlement-rule/default-settlement-rule.js';
import type { SettlementRuleSnapshot } from '../../../domain/settlement-rule/settlement-rule.js';
export const DEFAULT_SETTLEMENT_RULE_REPOSITORY = Symbol(
    'DEFAULT_SETTLEMENT_RULE_REPOSITORY',
);
export interface DefaultSettlementRuleRepository {
    find(spaceId: string): Promise<DefaultSettlementRule | null>;
    save(
        aggregate: DefaultSettlementRule,
        expectedVersion: number,
        actorId: string,
        previous: SettlementRuleSnapshot | null,
    ): Promise<void>;
}
