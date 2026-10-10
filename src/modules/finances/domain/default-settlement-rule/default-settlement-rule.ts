import { SettlementRule } from '../settlement-rule/settlement-rule.js';
import { FinancesError } from '../errors/finances.error.js';
export class DefaultSettlementRule {
    private constructor(
        public readonly spaceId: string,
        private current: SettlementRule,
        private revision: number,
        private readonly creationTime: Date,
        private modifiedAt: Date,
    ) {}
    static create(
        spaceId: string,
        rule: SettlementRule,
        now: Date,
    ): DefaultSettlementRule {
        return new DefaultSettlementRule(
            spaceId,
            rule,
            1,
            new Date(now),
            new Date(now),
        );
    }
    static restore(
        spaceId: string,
        rule: SettlementRule,
        version: number,
        createdAt: Date,
        updatedAt: Date,
    ): DefaultSettlementRule {
        if (!Number.isSafeInteger(version) || version < 1)
            throw new FinancesError('VALIDATION_ERROR');
        return new DefaultSettlementRule(
            spaceId,
            rule,
            version,
            new Date(createdAt),
            new Date(updatedAt),
        );
    }
    get createdAt(): Date {
        return new Date(this.creationTime);
    }
    get rule(): SettlementRule {
        return this.current;
    }
    get version(): number {
        return this.revision;
    }
    get updatedAt(): Date {
        return new Date(this.modifiedAt);
    }
    configure(
        rule: SettlementRule,
        expectedVersion: number,
        now: Date,
    ): boolean {
        if (expectedVersion !== this.revision)
            throw new FinancesError('CONCURRENT_MODIFICATION');
        if (this.current.equals(rule)) return false;
        this.current = rule;
        this.revision++;
        this.modifiedAt = new Date(now);
        return true;
    }
}
