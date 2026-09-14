import { Inject, Injectable } from "@nestjs/common";
import type { PersonalContext, ProvisionPersonalContext, ProvisionPersonalContextInput } from "../ports/provision-personal-context.js";
import { PERSON_REPOSITORY, type PersonRepository } from "../ports/person.repository.js";
import { SPACE_REPOSITORY, type SpaceRepository } from "../ports/space.repository.js";
import { Person } from "../../domain/person/person.js";
import { Space } from "../../domain/space/space.js";

@Injectable()
export class ProvisionPersonalContextService implements ProvisionPersonalContext {
    constructor(
        @Inject(PERSON_REPOSITORY)
        private readonly personRepository: PersonRepository,

        @Inject(SPACE_REPOSITORY)
        private readonly spaceRepository: SpaceRepository,
    ) {}

    async provision(input: ProvisionPersonalContextInput): Promise<PersonalContext> {
        const person = Person.create(
            input.personId,
            input.displayName,
        );

        const personalSpace = Space.createPersonal(
            input.spaceId,
            input.personId,
        );

        await this.personRepository.save(person);
        await this.spaceRepository.save(personalSpace);

        return {
            person: {
                id: person.id,
                displayName: person.displayName
            },
            personalSpace: {
                id: personalSpace.id,
                type: "PERSONAL",
                label: 'Meu espaço',
            },
        };
    }
}