import { randomUUID } from 'node:crypto';

export class PersonId {
    private constructor(public readonly value: string) {}

    static create(): PersonId {
        return new PersonId(randomUUID());
    }

    static from(value: string): PersonId {
        if (!value) {
            throw new Error('PersonId cannot be empty');
        }

        return new PersonId(value);
    }

    equals(other: PersonId): boolean {
        return this.value === other.value;
    }
}
