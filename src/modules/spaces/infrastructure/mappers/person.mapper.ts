import { PersonId } from "../../domain/person/person-id.js";
import { Person } from "../../domain/person/person.js";
import { PersonOrmEntity } from "../typeorm/entities/person.orm-entity.js";

export class PersonMapper {
    static toDomain(entity: PersonOrmEntity): Person {
        return Person.restore({
            id: PersonId.from(entity.id),
            displayName: entity.displayName,
            version: entity.version,
            createdAt: entity.createdAt
        });
    }

    static toPersistence(person: Person): PersonOrmEntity {
        const entity = new PersonOrmEntity();

        entity.id = person.id.value;
        entity.displayName = person.displayName;
        entity.version = person.version;
        entity.createdAt = person.createdAt;

        return entity;
    }
}