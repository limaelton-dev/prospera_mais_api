import { PersonId } from "./person-id.js"

type PersonProps = {
    id: PersonId,
    displayName: string,
    version: number,
    createdAt: Date,
};

export class Person {
    private constructor(private readonly props:PersonProps) {}

    static create(displayName: string): Person {
        const normalizedDisplayName = displayName.trim();

        if(!normalizedDisplayName) {
            throw new Error('Display namer cannot be empty');
        }

        return new Person({
            id: PersonId.create(),
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
        return this.version
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
}