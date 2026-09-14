import { PersonId } from "../../person/person-id.js";
import { Person } from "../../person/person.js";

export const PERSON_REPOSITORY = Symbol('PERSON_REPOSITORY');

export interface PersonRepository {
    save(person: Person): Promise<void>;

    findByid(id: PersonId): Promise<Person | null>;
}