import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type {
    GeneratedInvitationToken,
    InvitationTokenGenerator,
} from '../../application/ports/private/invitation-token-generator.js';

@Injectable()
export class NodeInvitationTokenGenerator implements InvitationTokenGenerator {
    generate(): GeneratedInvitationToken {
        const token = randomBytes(32).toString('base64url');
        const tokenHash = createHash('sha256').update(token, 'utf8').digest();

        return { token, tokenHash };
    }
}
