import { randomUUID } from "node:crypto";

export class SpaceId {
    private constructor(public readonly value: string) {}

    static create(): SpaceId {
        return new SpaceId(randomUUID())
    }

    static from(value: string): SpaceId {
        if(!value) {
            throw new Error('SpaceId cannot bt empty')
        }

        return new SpaceId(value);
    }

    equals(ohter: SpaceId): boolean {
        return this.value === ohter.value;
    }
}