import { randomUUID } from 'node:crypto';

export class InvitationId {
    private constructor(public readonly value: string) {}

    static create(): InvitationId {
        return new InvitationId(randomUUID());
    }

    static from(value: string): InvitationId {
        if (!value) {
            throw new Error('InvitationId cannot be empty');
        }

        return new InvitationId(value);
    }

    equals(other: InvitationId): boolean {
        return this.value === other.value;
    }
}
