import { Injectable } from '@nestjs/common';
import type {
    GeneratedSessionToken,
    SessionTokenGenerator,
} from '../../application/ports/private/session-token-generator.js';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class CryptSessionTokenGenerator implements SessionTokenGenerator {
    generate(): GeneratedSessionToken {
        const token = randomBytes(32).toString('base64url');

        return {
            token,
            tokenHash: this.hash(token),
        };
    }

    hash(token: string): Buffer {
        return createHash('sha256').update(token, 'utf8').digest();
    }
}
