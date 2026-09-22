import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports/private/password-hasher.js';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
    hash(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 19_456,
            timeCost: 2,
            parallelism: 1,
        });
    }

    verify(password: string, passwordHash: string): Promise<boolean> {
        return argon2.verify(passwordHash, password);
    }
}
