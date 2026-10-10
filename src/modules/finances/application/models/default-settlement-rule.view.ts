import type { SettlementRuleSnapshot } from '../../domain/settlement-rule/settlement-rule.js';
import type { PersonId } from '../../../spaces/domain/person/person-id.js';
import type { SpaceId } from '../../../spaces/domain/space/space-id.js';
export interface DefaultSettlementRuleView {
    spaceId: string;
    rule: SettlementRuleSnapshot | null;
    version: number;
    updatedAt: string | null;
}
export interface ConfigureDefaultSettlementRuleResult extends DefaultSettlementRuleView {
    changed: boolean;
    replayed: boolean;
}
export interface ConfigureDefaultSettlementRuleCommand {
    actorId: PersonId;
    spaceId: SpaceId;
    key: string;
    expectedVersion: number;
    rule: SettlementRuleSnapshot;
}
