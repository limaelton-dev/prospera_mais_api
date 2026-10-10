import type { DefaultSettlementRule } from '../../domain/default-settlement-rule/default-settlement-rule.js';
import type { DefaultSettlementRuleView } from './default-settlement-rule.view.js';
export function settlementRuleView(
    spaceId: string,
    aggregate: DefaultSettlementRule | null,
): DefaultSettlementRuleView {
    return {
        spaceId,
        rule: aggregate?.rule.snapshot ?? null,
        version: aggregate?.version ?? 0,
        updatedAt: aggregate?.updatedAt.toISOString() ?? null,
    };
}
