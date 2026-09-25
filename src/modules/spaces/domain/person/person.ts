import { PersonId } from './person-id.js';

type PersonProps = {
    id: PersonId;
    displayName: string;
    version: number;
    createdAt: Date;
};

export class Person {
    private constructor(private readonly props: PersonProps) {}

    static create(id: PersonId, displayName: string): Person {
        const normalizedDisplayName = displayName.trim();

        if (
            normalizedDisplayName.length < 2 ||
            normalizedDisplayName.length > 80
        ) {
            throw new Error(
                'Display name must contain between 2 and 80 characters',
            );
        }

        return new Person({
            id,
            displayName: normalizedDisplayName,
            version: 1,
            createdAt: new Date(),
        });
    }

    static restore(props: PersonProps): Person {
        return new Person(props);
    }

    get id(): PersonId {
        return this.props.id;
    }

    get displayName(): string {
        return this.props.displayName;
    }

    get version(): number {
        return this.props.version;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
}
