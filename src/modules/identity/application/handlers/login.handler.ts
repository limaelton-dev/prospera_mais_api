import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedContext } from '../models/authenticated-context.js';
import { ConfigService } from '@nestjs/config';
import {
    CREDENTIAL_REPOSITORY,
    type CredentialRepository,
} from '../ports/private/credential.repository.js';
import {
    SESSION_TOKEN_GENERATOR,
    type SessionTokenGenerator,
} from '../ports/private/session-token-generator.js';
import {
    SESSION_REPOSITORY,
    type SessionRepository,
} from '../ports/private/session.repository.js';
import {
    GET_PERSONAL_CONTEXT,
    type GetPersonalContext,
} from '../../../spaces/application/ports/public/get-personal-context.js';
import {
    PASSWORD_HASHER,
    type PasswordHasher,
} from '../ports/private/password-hasher.js';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error.js';
import { randomUUID } from 'node:crypto';

export type LoginInput = {
    email: string;
    password: string;
};

export type LoginResult = {
    sessionToken: string;
    context: AuthenticatedContext;
};

@Injectable()
export class LoginHandler {
    constructor(
        @Inject(CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: CredentialRepository,

        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasher,

        @Inject(GET_PERSONAL_CONTEXT)
        private readonly getPersonalContext: GetPersonalContext,

        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: SessionRepository,

        @Inject(SESSION_TOKEN_GENERATOR)
        private readonly sessionTokenGenerator: SessionTokenGenerator,

        private readonly configService: ConfigService,
    ) {}

    async execute(input: LoginInput): Promise<LoginResult> {
        const email = input.email.trim().toLowerCase();

        const credential = await this.credentialRepository.findByEmail(email);

        if (!credential) {
            throw new InvalidCredentialsError();
        }

        const passwordMatches = await this.passwordHasher.verify(
            input.password,
            credential.passwordHash,
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsError();
        }

        const personalContext = await this.getPersonalContext.get(
            credential.personId,
        );

        if (!personalContext) {
            throw new Error('Authenticated person has no personal context');
        }

        const sessionTtlSecond = this.configService.getOrThrow<number>(
            'SESSION_TTL_SECONDS',
        );

        const { token, tokenHash } = this.sessionTokenGenerator.generate();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + sessionTtlSecond * 1000);

        await this.sessionRepository.save({
            id: randomUUID(),
            personId: credential.personId,
            tokenHash,
            expiresAt,
            createdAt: now,
        });

        return {
            sessionToken: token,
            context: {
                person: {
                    id: personalContext.person.id.value,
                    displayName: personalContext.person.displayName,
                    email: credential.email,
                },
                personalSpace: {
                    id: personalContext.personalSpace.id.value,
                    type: personalContext.personalSpace.type,
                    label: personalContext.personalSpace.label,
                },
            },
        };
    }
}
