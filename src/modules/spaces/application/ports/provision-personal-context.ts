import { PersonId } from "../../domain/person/person-id.js";
import { SpaceId } from "../../domain/space/space-id.js";

export const PROVISION_PERSONAL_CONTEXT = Symbol('PROVISION_PERSONAL_CONTEXT');

export type ProvisionPersonalContextInput = {
    personId: PersonId;
    spaceId: SpaceId;
    displayName: string;
};

export type PersonalContext = {
    person: {
        id: PersonId;
        displayName: string;
    };
    personalSpace: {
        id: SpaceId;
        type: 'PERSONAL';
        label: 'Meu espaço';
    };
};

export interface ProvisionPersonalContext {
    provision(
        input: ProvisionPersonalContextInput,
    ): Promise<PersonalContext>
}