import { SpacesDomainError } from '../errors/spaces-domain.error.js';
import { PersonId } from '../person/person-id.js';
import { InvitationId } from './invitation-id.js';

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export type InvitationProps = {
    id: InvitationId;
    invitedByPersonId: PersonId;
    status: InvitationStatus;
    issuedAt: Date;
    expiresAt: Date;
    resolvedAt: Date | null;
    cancellationReason: 'REPLACED' | null;
    replacedByInvitationId: InvitationId | null;
};

const validityInMilliseconds = 72 * 60 * 60 * 1000;

export class Invitation {
    private readonly props: InvitationProps;

    private constructor(props: InvitationProps) {
        const pending = props.status === InvitationStatus.PENDING;
        const cancelled = props.status === InvitationStatus.CANCELLED;
        const answered =
            props.status === InvitationStatus.ACCEPTED ||
            props.status === InvitationStatus.REJECTED;

        if (
            !props.id ||
            !props.invitedByPersonId ||
            !Object.values(InvitationStatus).includes(props.status) ||
            !Number.isFinite(props.issuedAt.getTime()) ||
            !Number.isFinite(props.expiresAt.getTime()) ||
            props.expiresAt.getTime() - props.issuedAt.getTime() !==
                validityInMilliseconds ||
            (pending ? props.resolvedAt !== null : props.resolvedAt === null) ||
            (props.resolvedAt !== null &&
                (!Number.isFinite(props.resolvedAt.getTime()) ||
                    props.resolvedAt < props.issuedAt)) ||
            (answered &&
                props.resolvedAt !== null &&
                props.resolvedAt >= props.expiresAt) ||
            (cancelled
                ? props.cancellationReason !== 'REPLACED' ||
                  props.replacedByInvitationId === null
                : props.cancellationReason !== null ||
                  props.replacedByInvitationId !== null) ||
            props.replacedByInvitationId?.equals(props.id)
        ) {
            throw new Error('Invalid invitation state');
        }

        this.props = {
            ...props,
            issuedAt: new Date(props.issuedAt),
            expiresAt: new Date(props.expiresAt),
            resolvedAt: props.resolvedAt ? new Date(props.resolvedAt) : null,
        };
    }

    static issue(
        id: InvitationId,
        invitedByPersonId: PersonId,
        now: Date,
    ): Invitation {
        return new Invitation({
            id,
            invitedByPersonId,
            status: InvitationStatus.PENDING,
            issuedAt: now,
            expiresAt: new Date(now.getTime() + validityInMilliseconds),
            resolvedAt: null,
            cancellationReason: null,
            replacedByInvitationId: null,
        });
    }

    static restore(props: InvitationProps): Invitation {
        return new Invitation(props);
    }

    statusAt(now: Date): InvitationStatus {
        if (!Number.isFinite(now.getTime())) {
            throw new Error('Invalid evaluation time');
        }

        if (
            this.status === InvitationStatus.PENDING &&
            now >= this.props.expiresAt
        ) {
            return InvitationStatus.EXPIRED;
        }

        return this.status;
    }

    expireIfDue(now: Date): Invitation {
        if (
            this.status !== InvitationStatus.PENDING ||
            this.statusAt(now) !== InvitationStatus.EXPIRED
        ) {
            return this;
        }

        return new Invitation({
            ...this.props,
            status: InvitationStatus.EXPIRED,
            resolvedAt: this.props.expiresAt,
        });
    }

    replaceWith(newInvitationId: InvitationId, now: Date): Invitation {
        if (this.statusAt(now) !== InvitationStatus.PENDING) {
            throw new SpacesDomainError('INVITATION_NOT_REPLACEABLE');
        }

        if (newInvitationId.equals(this.id) || now < this.props.issuedAt) {
            throw new Error('Invalid invitation replacement');
        }

        return new Invitation({
            ...this.props,
            status: InvitationStatus.CANCELLED,
            resolvedAt: now,
            cancellationReason: 'REPLACED',
            replacedByInvitationId: newInvitationId,
        });
    }

    accept(now: Date): Invitation {
        return this.resolve(InvitationStatus.ACCEPTED, now);
    }

    reject(now: Date): Invitation {
        return this.resolve(InvitationStatus.REJECTED, now);
    }

    private resolve(
        status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED,
        now: Date,
    ): Invitation {
        if (this.statusAt(now) !== InvitationStatus.PENDING) {
            throw new SpacesDomainError('INVITATION_UNAVAILABLE');
        }

        if (now < this.props.issuedAt) {
            throw new Error('Invalid invitation response time');
        }

        return new Invitation({
            ...this.props,
            status,
            resolvedAt: now,
        });
    }

    get id(): InvitationId {
        return this.props.id;
    }

    get invitedByPersonId(): PersonId {
        return this.props.invitedByPersonId;
    }

    get status(): InvitationStatus {
        return this.props.status;
    }

    get issuedAt(): Date {
        return new Date(this.props.issuedAt);
    }

    get expiresAt(): Date {
        return new Date(this.props.expiresAt);
    }

    get resolvedAt(): Date | null {
        return this.props.resolvedAt ? new Date(this.props.resolvedAt) : null;
    }

    get cancellationReason(): 'REPLACED' | null {
        return this.props.cancellationReason;
    }

    get replacedByInvitationId(): InvitationId | null {
        return this.props.replacedByInvitationId;
    }
}
