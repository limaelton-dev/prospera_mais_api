import { PersonId } from '../../../domain/person/person-id.js';
import { PersonalContext } from '../../models/personal-context.js';

export const GET_PERSONAL_CONTEXT = Symbol('GET_PERSONAL_CONTEXT');

export interface GetPersonalContext {
    get(personId: PersonId): Promise<PersonalContext | null>;
}
