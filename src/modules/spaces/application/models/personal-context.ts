import type { PersonId } from "../../domain/person/person-id.js";
import type { SpaceId } from "../../domain/space/space-id.js";

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