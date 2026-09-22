import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedContext } from "../models/authenticated-context.js";
import { UNIT_OF_WORK, type UnitOfWork } from "../../../../shared/application/unit-of-work.js";
import { PROVISION_PERSONAL_CONTEXT, type ProvisionPersonalContext } from "../../../spaces/application/ports/public/provision-personal-context.js";
import { CREDENTIAL_REPOSITORY, type CredentialRepository } from "../ports/private/credential.repository.js";
import { SESSION_REPOSITORY, type SessionRepository } from "../ports/private/session.repository.js";
import { PASSWORD_HASHER, type PasswordHasher } from "../ports/private/password-hasher.js";
import { SESSION_TOKEN_GENERATOR, type SessionTokenGenerator } from "../ports/private/session-token-generator.js";
import { ConfigService } from "@nestjs/config";
import { EmailAlreadyInUseError } from "../errors/email-already-in-use.error.js";
import { PersonId } from "../../../spaces/domain/person/person-id.js";
import { SpaceId } from "../../../spaces/domain/space/space-id.js";
import { randomUUID } from "node:crypto";

export type RegisterAccountInput = {
    displayName: string;
    email: string;
    password: string;
}

export type RegisterAccountResult = {
    sessionToken: string;
    context: AuthenticatedContext
}

@Injectable()
export class RegisterAccountHandler {
    constructor(
        @Inject(UNIT_OF_WORK)
        private readonly unitOfWork: UnitOfWork,
    
        @Inject(PROVISION_PERSONAL_CONTEXT)
        private readonly provisionPersonalContext: ProvisionPersonalContext,
    
        @Inject(CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: CredentialRepository,
    
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: SessionRepository,
    
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasher,
    
        @Inject(SESSION_TOKEN_GENERATOR)
        private readonly sessionTokenGenerator: SessionTokenGenerator,
    
        private readonly configService: ConfigService,
    ) {}

    async execute(
        input: RegisterAccountInput,
    ): Promise<RegisterAccountResult> {
        const email = input.email.trim().toLowerCase();
        const existingCredential =
            await this.credentialRepository.findByEmail(email);

        if(existingCredential) {
            throw new EmailAlreadyInUseError();
        }
        
        const sessionTtlSeconds = 
            this.configService.getOrThrow<number>('SESSION_TTL_SECONDS');

        const passwordHash = 
            await this.passwordHasher.hash(input.password);

        const personId = PersonId.create();
        const spaceId = SpaceId.create();
        const sessionId = randomUUID();
        const { token, tokenHash } = 
            this.sessionTokenGenerator.generate();
        
            const context = await this.unitOfWork.execute(
                async (): Promise<AuthenticatedContext> => {
                    const personalContext =
                        await this.provisionPersonalContext.provision({
                            personId,
                            spaceId,
                            displayName: input.displayName,
                        });
                    
                    const now = new Date();
                    const expiresAt = new Date(
                        now.getTime() + sessionTtlSeconds * 1000
                    );

                    await this.credentialRepository.save({
                        personId,
                        email,
                        passwordHash,
                        createdAt: now,
                        updatedAt: now,
                    });

                    await this.sessionRepository.save({
                        id: sessionId,
                        personId,
                        tokenHash,
                        expiresAt,
                        createdAt: now,
                    });

                    return {
                        person: {
                            id: personalContext.person.id.value,
                            displayName: personalContext.person.displayName,
                            email,
                        },
                        personalSpace: {
                            id: personalContext.personalSpace.id.value,
                            type: personalContext.personalSpace.type,
                            label: personalContext.personalSpace.label
                        }
                    }
                }
            );

            return {
                sessionToken: token,
                context
            }
        
        }
}