import { FinancesError } from '../errors/finances.error.js';
export type SettlementRuleSnapshot = Readonly<{
    kind: 'MONTHLY_DAY';
    dayOfMonth: number;
}>;
export class SettlementRule {
    private constructor(public readonly dayOfMonth: number) {
        Object.freeze(this);
    }
    static from(input: SettlementRuleSnapshot): SettlementRule {
        if (
            !input ||
            input.kind !== 'MONTHLY_DAY' ||
            !Number.isInteger(input.dayOfMonth) ||
            input.dayOfMonth < 1 ||
            input.dayOfMonth > 31
        )
            throw new FinancesError('VALIDATION_ERROR');
        return new SettlementRule(input.dayOfMonth);
    }
    get snapshot(): SettlementRuleSnapshot {
        return Object.freeze({
            kind: 'MONTHLY_DAY',
            dayOfMonth: this.dayOfMonth,
        });
    }
    equals(other: SettlementRule): boolean {
        return this.dayOfMonth === other.dayOfMonth;
    }
    suggestTargetDate(referenceDate: string): string {
        if (
            typeof referenceDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
        )
            throw new FinancesError('VALIDATION_ERROR');
        let [year, month, day] = referenceDate.split('-').map(Number);
        const lastDay = (y: number, m: number) =>
            m === 2
                ? y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
                    ? 29
                    : 28
                : [4, 6, 9, 11].includes(m)
                  ? 30
                  : 31;
        if (
            year < 1 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > lastDay(year, month)
        )
            throw new FinancesError('VALIDATION_ERROR');
        let target = Math.min(this.dayOfMonth, lastDay(year, month));
        if (target < day) {
            month++;
            if (month === 13) {
                year++;
                month = 1;
            }
            target = Math.min(this.dayOfMonth, lastDay(year, month));
        }
        if (year > 9999) throw new FinancesError('VALIDATION_ERROR');
        return [
            String(year).padStart(4, '0'),
            String(month).padStart(2, '0'),
            String(target).padStart(2, '0'),
        ].join('-');
    }
}
