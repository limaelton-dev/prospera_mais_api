import { PersonId } from '../person/person-id.js';
import { MemberId } from './member-id.js';

export enum MemberStatus {
    ACTIVE = 'ACTIVE',
}

export type MemberProps = {
    id: MemberId;
    personId: PersonId;
    status: MemberStatus;
    joinedAt: Date;
};

export class Member {
    private readonly props: MemberProps;

    private constructor(props: MemberProps) {
        if (
            !props.id ||
            !props.personId ||
            props.status !== MemberStatus.ACTIVE ||
            !Number.isFinite(props.joinedAt.getTime())
        ) {
            throw new Error('Invalid member state');
        }

        this.props = {
            ...props,
            joinedAt: new Date(props.joinedAt),
        };
    }

    static create(id: MemberId, personId: PersonId, now: Date): Member {
        return new Member({
            id,
            personId,
            status: MemberStatus.ACTIVE,
            joinedAt: now,
        });
    }

    static restore(props: MemberProps): Member {
        return new Member(props);
    }

    get id(): MemberId {
        return this.props.id;
    }

    get personId(): PersonId {
        return this.props.personId;
    }

    get status(): MemberStatus {
        return this.props.status;
    }

    get joinedAt(): Date {
        return new Date(this.props.joinedAt);
    }
}
