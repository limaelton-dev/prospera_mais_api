import { PersonId } from "../person/person-id.js"
import { SpaceId } from "./space-id.js"

export enum SpaceType {
    PERSONAL = 'PERSONAL'
    // 'PERSONAL' | 'SHARED',
}

export enum SpaceStatus {
    ACTIVE = 'ACTIVE'
    // 'ACTIVE' | 'CLOSING' | 'CLOSED'
}
type SpaceProps = {
    id: SpaceId,
    type: SpaceType,
    status: SpaceStatus,
    personalOwnerPersonId: PersonId,
    version: number,
    createdAt: Date,
    updatedAt: Date,
}

export class Space {
    private constructor(private readonly props: SpaceProps) {}

    static createPersonal(ownerPersonId: PersonId): Space {
        const now = new Date();
        return new Space({
            id: SpaceId.create(),
            type: SpaceType.PERSONAL,
            status: SpaceStatus.ACTIVE,
            personalOwnerPersonId: ownerPersonId,
            version: 1,
            createdAt: now,
            updatedAt: now,
        })
    }

    static restore(props: SpaceProps): Space {
        return new Space(props);
    }

    get id(): SpaceId {
        return this.props.id;
    }
    get type(): SpaceType {
        return this.props.type;
    }
    get status(): SpaceStatus {
        return this.props.status;
    }
    get personalOwnerPersonId(): PersonId {
        return this.props.personalOwnerPersonId
    }
    get version(): number {
        return this.props.version
    }
    get createdAt(): Date {
        return this.props.createdAt
    }
    get updatedAt(): Date {
        return this.props.updatedAt
    }
}