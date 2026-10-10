import { describe, expect, it } from 'vitest';

import { SpacesDomainError } from '../errors/spaces-domain.error.js';
import { InvitationId } from '../invitation/invitation-id.js';
import { InvitationStatus } from '../invitation/invitation.js';
import { MemberId } from '../member/member-id.js';
import { Member, MemberStatus } from '../member/member.js';
import { PersonId } from '../person/person-id.js';
import { SpaceId } from './space-id.js';
import { Space, SpaceStatus, SpaceType } from './space.js';

const createdAt = new Date('2026-10-09T12:00:00.000Z');
const answeredAt = new Date('2026-10-09T13:00:00.000Z');
const creator = PersonId.from('creator');
const recipient = PersonId.from('recipient');
const invitationId = InvitationId.from('invitation-1');

function sharedSpace(): Space {
    return Space.createShared({
        id: SpaceId.from('space-1'),
        name: 'Nossa casa',
        createdByPersonId: creator,
        creatorMemberId: MemberId.from('member-1'),
        invitationId,
        now: createdAt,
    });
}

function restoredSpace(
    modify: (
        props: Extract<
            ReturnType<Space['snapshot']>,
            {
                type: SpaceType.SHARED;
            }
        >,
    ) => void,
): Space {
    const props = sharedSpace().snapshot();

    if (props.type !== SpaceType.SHARED) {
        throw new Error('Expected shared fixture');
    }

    modify(props);

    return Space.restore(props);
}

const decisions = ['ACCEPT', 'REJECT'] as const;
type Decision = (typeof decisions)[number];

function respond(
    space: Space,
    decision: Decision,
    actor = recipient,
    id = invitationId,
    now = answeredAt,
): void {
    if (decision === 'ACCEPT') {
        space.acceptInvitation(actor, id, MemberId.from('member-2'), now);
        return;
    }

    space.rejectInvitation(actor, id, now);
}

function expectRefusedWithoutChanges(
    space: Space,
    decision: Decision,
    code: ConstructorParameters<typeof SpacesDomainError>[0],
    actor = recipient,
    id = invitationId,
    now = answeredAt,
): void {
    const before = space.snapshot();

    expect(() => respond(space, decision, actor, id, now)).toThrow(
        new SpacesDomainError(code),
    );
    expect(space.snapshot()).toEqual(before);
}

describe('Space invitation response', () => {
    it('accepts and adds the second active member in one aggregate change', () => {
        const space = sharedSpace();
        const previousInvitation = space.invitations[0];
        const member = space.acceptInvitation(
            recipient,
            invitationId,
            MemberId.from('member-2'),
            answeredAt,
        );

        expect(member.personId.equals(recipient)).toBe(true);
        expect(member.status).toBe(MemberStatus.ACTIVE);
        expect(member.joinedAt).toEqual(answeredAt);
        expect(space.members).toHaveLength(2);
        expect(space.activeMemberCount).toBe(2);
        expect(space.invitations[0].status).toBe(InvitationStatus.ACCEPTED);
        expect(space.invitations[0].resolvedAt).toEqual(answeredAt);
        expect(space.version).toBe(2);
        expect(space.updatedAt).toEqual(answeredAt);
        expect(space.createdAt).toEqual(createdAt);
        expect(previousInvitation.status).toBe(InvitationStatus.PENDING);
    });

    it('rejects without adding a member and advances the version once', () => {
        const space = sharedSpace();
        const previousMembers = space.members;
        const rejected = space.rejectInvitation(
            recipient,
            invitationId,
            answeredAt,
        );

        expect(rejected.status).toBe(InvitationStatus.REJECTED);
        expect(rejected.resolvedAt).toEqual(answeredAt);
        expect(space.members).toEqual(previousMembers);
        expect(space.activeMemberCount).toBe(1);
        expect(space.version).toBe(2);
        expect(space.updatedAt).toEqual(answeredAt);
    });

    it.each(decisions)(
        '%s refuses the creator, including creator without membership',
        (decision) => {
            expectRefusedWithoutChanges(
                sharedSpace(),
                decision,
                'INVITATION_RESPONSE_NOT_ALLOWED',
                creator,
            );
            expectRefusedWithoutChanges(
                restoredSpace((props) => {
                    props.members = [];
                }),
                decision,
                'INVITATION_RESPONSE_NOT_ALLOWED',
                creator,
            );
        },
    );

    it.each(decisions)('%s refuses an already active member', (decision) => {
        const space = restoredSpace((props) => {
            props.members = [
                ...props.members,
                Member.create(MemberId.from('member-2'), recipient, createdAt),
            ];
        });

        expectRefusedWithoutChanges(
            space,
            decision,
            'INVITATION_RESPONSE_NOT_ALLOWED',
        );
    });

    it.each(decisions)(
        '%s refuses a full space for a third person',
        (decision) => {
            const space = restoredSpace((props) => {
                props.members = [
                    ...props.members,
                    Member.create(
                        MemberId.from('member-existing'),
                        PersonId.from('another-person'),
                        createdAt,
                    ),
                ];
            });

            expectRefusedWithoutChanges(
                space,
                decision,
                'SPACE_MEMBER_LIMIT_REACHED',
            );
        },
    );

    it.each(decisions)('%s refuses closing and closed spaces', (decision) => {
        for (const status of [SpaceStatus.CLOSING, SpaceStatus.CLOSED]) {
            const space = restoredSpace((props) => {
                props.status = status;
            });

            expectRefusedWithoutChanges(space, decision, 'SPACE_NOT_ACTIVE');
        }
    });

    it.each(decisions)(
        '%s refuses a personal space and an unknown invitation',
        (decision) => {
            expectRefusedWithoutChanges(
                Space.createPersonal(
                    SpaceId.from('personal-space'),
                    recipient,
                    createdAt,
                ),
                decision,
                'INVITATION_UNAVAILABLE',
            );
            expectRefusedWithoutChanges(
                sharedSpace(),
                decision,
                'INVITATION_UNAVAILABLE',
                recipient,
                InvitationId.from('unknown-invitation'),
            );
        },
    );

    it.each(decisions)(
        '%s refuses expiration without changing stored state',
        (decision) => {
            const space = sharedSpace();

            expectRefusedWithoutChanges(
                space,
                decision,
                'INVITATION_UNAVAILABLE',
                recipient,
                invitationId,
                space.invitations[0].expiresAt,
            );
        },
    );

    it.each(decisions)(
        '%s resolves only the exact invitation after replacement',
        (decision) => {
            const space = sharedSpace();
            const newId = InvitationId.from('invitation-2');
            space.replaceInvitation(creator, invitationId, newId, answeredAt);

            expectRefusedWithoutChanges(
                space,
                decision,
                'INVITATION_UNAVAILABLE',
            );
            respond(space, decision, recipient, newId);

            expect(space.invitations[0].status).toBe(
                InvitationStatus.CANCELLED,
            );
            expect(space.invitations[1].status).toBe(
                decision === 'ACCEPT'
                    ? InvitationStatus.ACCEPTED
                    : InvitationStatus.REJECTED,
            );
            expect(space.version).toBe(3);
        },
    );

    it.each(decisions)(
        '%s cannot resolve the same invitation again',
        (decision) => {
            const space = sharedSpace();
            respond(space, decision);

            for (const nextDecision of decisions) {
                expectRefusedWithoutChanges(
                    space,
                    nextDecision,
                    'INVITATION_UNAVAILABLE',
                    PersonId.from('another-recipient'),
                );
            }
        },
    );

    it('allows the creator to issue a new invitation after rejection', () => {
        const space = sharedSpace();
        space.rejectInvitation(recipient, invitationId, answeredAt);

        space.issueInvitation(
            creator,
            InvitationId.from('invitation-2'),
            new Date(answeredAt.getTime() + 1),
        );

        expect(space.invitations[0].status).toBe(InvitationStatus.REJECTED);
        expect(space.invitations[1].status).toBe(InvitationStatus.PENDING);
        expect(space.members).toHaveLength(1);
        expect(space.version).toBe(3);
    });

    it('does not partially accept when the new member identity is duplicated', () => {
        const space = sharedSpace();
        const before = space.snapshot();

        expect(() =>
            space.acceptInvitation(
                recipient,
                invitationId,
                MemberId.from('member-1'),
                answeredAt,
            ),
        ).toThrow('Inconsistent shared space children');
        expect(space.snapshot()).toEqual(before);
    });

    it.each(decisions)(
        '%s does not partially resolve when the version overflows',
        (decision) => {
            const space = restoredSpace((props) => {
                props.version = Number.MAX_SAFE_INTEGER;
            });
            const before = space.snapshot();

            expect(() => respond(space, decision)).toThrow(
                'Invalid space state',
            );
            expect(space.snapshot()).toEqual(before);
        },
    );
});
