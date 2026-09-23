import { Inject, Injectable } from "@nestjs/common";
import { type CredentialRepository } from "../ports/private/credential.repository.js";
import { type GetPersonalContext } from "../../../spaces/application/ports/public/get-personal-context.js";
import { PersonId } from "../../../spaces/domain/person/person-id.js";
import { AuthenticatedContext } from "../models/authenticated-context.js";

@Injectable()
export class GetCurrentContextQuery {
    constructor(
        @Inject()
        private readonly credentialRepository: CredentialRepository,

        @Inject()
        private readonly getPersonalContext: GetPersonalContext,
    ) {}

    async execute(personId: PersonId): Promise<AuthenticatedContext> {
        const credential =
            await this.credentialRepository.findByPersonId(personId);

        if(!credential) {
            throw new Error('Authenticatede person has no credential');
        }

        const personalContext = 
            await this.getPersonalContext.get(personId);

        if (!personalContext) {
            throw new Error('Authenticated person has no personal context');
        }

        return {
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
        }; 
    }
}