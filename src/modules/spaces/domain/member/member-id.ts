import { randomUUID } from 'node:crypto';

export class MemberId {
    private constructor(public readonly value: string) {}

    static create(): MemberId {
        return new MemberId(randomUUID());
    }

    static from(value: string): MemberId {
        if (!value) {
            throw new Error('MemberId cannot be empty');
        }

        return new MemberId(value);
    }

    equals(other: MemberId): boolean {
        return this.value === other.value;
    }
}
