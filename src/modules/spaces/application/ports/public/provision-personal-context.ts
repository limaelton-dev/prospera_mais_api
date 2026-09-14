import type { PersonId } from "../../../domain/person/person-id.js";
import type { SpaceId } from "../../../domain/space/space-id.js";
import type { PersonalContext } from "../../models/personal-context.js";

export const PROVISION_PERSONAL_CONTEXT = Symbol('PROVISION_PERSONAL_CONTEXT');

export type ProvisionPersonalContextInput = {
    personId: PersonId;
    spaceId: SpaceId;
    displayName: string;
};

export interface ProvisionPersonalContext {
    provision(
        input: ProvisionPersonalContextInput,
    ): Promise<PersonalContext>
}