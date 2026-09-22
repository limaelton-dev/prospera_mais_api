import { PersonId } from '../../../domain/person/person-id.js';
import { Person } from '../../../domain/person/person.js';

export const PERSON_REPOSITORY = Symbol('PERSON_REPOSITORY');

export interface PersonRepository {
    save(person: Person): Promise<void>;

    findById(id: PersonId): Promise<Person | null>;
}
