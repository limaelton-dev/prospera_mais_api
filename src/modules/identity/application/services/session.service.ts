import { Inject, Injectable } from "@nestjs/common";
import { SESSION_REPOSITORY, type SessionRepository } from "../ports/private/session.repository.js";
import { SESSION_TOKEN_GENERATOR, type SessionTokenGenerator } from "../ports/private/session-token-generator.js";
import { AuthenticatedActor } from "../models/authenticated-actor.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";

@Injectable()
export class SessionService {
    constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: SessionRepository,

        @Inject(SESSION_TOKEN_GENERATOR)
        private readonly sessionTokenGenerator: SessionTokenGenerator,
    ) {}

    async authenticate(sessionToken: unknown): Promise<AuthenticatedActor> {
        if(
            typeof sessionToken !== 'string' ||
            sessionToken.length === 0
        ) {
            throw new UnauthenticatedError();
        }

        const tokenHash = this.sessionTokenGenerator.hash(sessionToken);

        const session = 
            await this.sessionRepository.findByTokenHash(tokenHash);

        if(!session) {
            throw new UnauthenticatedError();
        }

        if(session.expiresAt.getTime() <= Date.now()) {
            throw new UnauthenticatedError();
        }

        return {
            personId: session.personId,
            sessionId: session.id,
        }
    }
}