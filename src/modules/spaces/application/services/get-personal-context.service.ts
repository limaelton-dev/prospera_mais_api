import { Inject, Injectable } from "@nestjs/common";
import { GetPersonalContext } from "../ports/public/get-personal-context.js";
import { PERSON_REPOSITORY, type PersonRepository } from "../ports/private/person.repository.js";
import { SPACE_REPOSITORY, type SpaceRepository } from "../ports/private/space.repository.js";
import { PersonId } from "../../domain/person/person-id.js";
import { PersonalContext } from "../models/personal-context.js";

@Injectable()
export class GetPersonalContextService implements GetPersonalContext {
    constructor(
        @Inject(PERSON_REPOSITORY)
        private readonly personRepository: PersonRepository,

        @Inject(SPACE_REPOSITORY)
        private readonly spaceRepository: SpaceRepository,
    ) {}

    async get(personId: PersonId): Promise<PersonalContext | null> {
        const person = await this.personRepository.findById(personId);

        if(!person) {
            return null;
        }

        const personalSpace =
            await this.spaceRepository.findPersonalByOwnerPersonId(personId);
        
        if(!personalSpace) {
            return null;
        }
        
        return {
            person: {
              id: person.id,
              displayName: person.displayName,
            },
            personalSpace: {
              id: personalSpace.id,
              type: 'PERSONAL',
              label: 'Meu espaço',
            },
        };
    }
}