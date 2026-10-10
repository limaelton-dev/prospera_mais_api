import { describe, expect, it } from 'vitest';

import { SpacesDomainError } from '../errors/spaces-domain.error.js';
import { PersonId } from '../person/person-id.js';
import { InvitationId } from './invitation-id.js';
import { Invitation, InvitationStatus } from './invitation.js';

const issuedAt = new Date('2026-10-09T12:00:00.000Z');
const answeredAt = new Date('2026-10-09T13:00:00.000Z');

function pendingInvitation(): Invitation {
    return Invitation.issue(
        InvitationId.from('invitation-1'),
        PersonId.from('creator'),
        issuedAt,
    );
}

const decisions = [
    { method: 'accept', status: InvitationStatus.ACCEPTED },
    { method: 'reject', status: InvitationStatus.REJECTED },
] as const;

function terminalInvitations(): Invitation[] {
    const pending = pendingInvitation();

    return [
        pending.accept(answeredAt),
        pending.reject(answeredAt),
        pending.replaceWith(InvitationId.from('invitation-2'), answeredAt),
        pending.expireIfDue(pending.expiresAt),
    ];
}

describe('Invitation response', () => {
    it.each(decisions)(
        '$method resolves an immutable pending invitation',
        ({ method, status }) => {
            const pending = pendingInvitation();
            const resolved = pending[method](answeredAt);

            expect(resolved.status).toBe(status);
            expect(resolved.resolvedAt).toEqual(answeredAt);
            expect(resolved.id.equals(pending.id)).toBe(true);
            expect(resolved.issuedAt).toEqual(issuedAt);
            expect(resolved.expiresAt).toEqual(pending.expiresAt);
            expect(resolved.cancellationReason).toBeNull();
            expect(resolved.replacedByInvitationId).toBeNull();
            expect(pending.status).toBe(InvitationStatus.PENDING);
            expect(pending.resolvedAt).toBeNull();
        },
    );

    it.each(decisions)(
        '$method allows the last millisecond before expiration',
        ({ method, status }) => {
            const invitation = pendingInvitation();
            const now = new Date(invitation.expiresAt.getTime() - 1);

            expect(invitation[method](now).status).toBe(status);
        },
    );

    it.each(decisions)(
        '$method refuses the exact expiration boundary',
        ({ method }) => {
            const invitation = pendingInvitation();

            expect(() => invitation[method](invitation.expiresAt)).toThrow(
                new SpacesDomainError('INVITATION_UNAVAILABLE'),
            );
            expect(invitation.status).toBe(InvitationStatus.PENDING);
            expect(invitation.resolvedAt).toBeNull();
        },
    );

    it.each(decisions)('$method refuses every terminal state', ({ method }) => {
        for (const invitation of terminalInvitations()) {
            expect(() => invitation[method](answeredAt)).toThrow(
                new SpacesDomainError('INVITATION_UNAVAILABLE'),
            );
        }
    });

    it.each(decisions)(
        '$method refuses a time before issuance or an invalid date',
        ({ method }) => {
            const invitation = pendingInvitation();

            expect(() =>
                invitation[method](new Date(issuedAt.getTime() - 1)),
            ).toThrow('Invalid invitation response time');
            expect(() => invitation[method](new Date(Number.NaN))).toThrow(
                'Invalid evaluation time',
            );
            expect(invitation.status).toBe(InvitationStatus.PENDING);
        },
    );

    it.each(decisions)(
        '$method defensively copies resolution dates',
        ({ method }) => {
            const now = new Date(answeredAt);
            const invitation = pendingInvitation()[method](now);
            now.setUTCFullYear(2000);
            const retrieved = invitation.resolvedAt;
            retrieved?.setUTCFullYear(2001);

            expect(invitation.resolvedAt).toEqual(answeredAt);
        },
    );

    it.each(decisions)(
        '$method cannot restore a decision made after expiration',
        ({ status }) => {
            const pending = pendingInvitation();

            expect(() =>
                Invitation.restore({
                    id: pending.id,
                    invitedByPersonId: pending.invitedByPersonId,
                    status,
                    issuedAt: pending.issuedAt,
                    expiresAt: pending.expiresAt,
                    resolvedAt: pending.expiresAt,
                    cancellationReason: null,
                    replacedByInvitationId: null,
                }),
            ).toThrow('Invalid invitation state');
        },
    );
});
