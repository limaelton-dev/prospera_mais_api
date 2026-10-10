import type {
    ConfigureDefaultSettlementRuleCommand,
    ConfigureDefaultSettlementRuleResult,
} from '../../models/default-settlement-rule.view.js';
export const FINANCES_COMMAND_RECEIPTS = Symbol('FINANCES_COMMAND_RECEIPTS');
export interface FinancesCommandReceipts {
    find(
        command: ConfigureDefaultSettlementRuleCommand,
    ): Promise<ConfigureDefaultSettlementRuleResult | null>;
    save(
        command: ConfigureDefaultSettlementRuleCommand,
        result: ConfigureDefaultSettlementRuleResult,
        now: Date,
    ): Promise<void>;
}
export class FinancesReceiptRaceError extends Error {}
