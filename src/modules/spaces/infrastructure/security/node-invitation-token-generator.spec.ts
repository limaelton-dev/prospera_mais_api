import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NodeInvitationTokenGenerator } from './node-invitation-token-generator.js';

describe('NodeInvitationTokenGenerator', () => {
    it('gera 32 bytes em base64url e o hash do token', () => {
        const generator = new NodeInvitationTokenGenerator();
        const result = generator.generate();

        expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(Buffer.from(result.token, 'base64url')).toHaveLength(32);
        expect(result.tokenHash).toHaveLength(32);
        expect(result.tokenHash).toEqual(
            createHash('sha256').update(result.token, 'utf8').digest(),
        );
    });

    it('gera valores independentes', () => {
        const generator = new NodeInvitationTokenGenerator();
        const first = generator.generate();
        const second = generator.generate();

        expect(first.token).not.toBe(second.token);
        expect(first.tokenHash).not.toEqual(second.tokenHash);
    });
});
