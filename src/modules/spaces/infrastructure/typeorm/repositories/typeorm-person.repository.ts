import { Injectable } from "@nestjs/common";
import { PersonRepository } from "../../../application/ports/private/person.repository.js";
import { EntityManagerProvider } from "../../../../../shared/technical/database/typeorm/entity-manager.provider.js";
import { PersonOrmEntity } from "../entities/person.orm-entity.js";
import { PersonMapper } from "../../mappers/person.mapper.js";
import { PersonId } from "../../../domain/person/person-id.js";
import { Person } from "../../../domain/person/person.js";

@Injectable()
export class TypeOrmPersonRepository implements PersonRepository {
    constructor(private readonly entityManagerProvider: EntityManagerProvider) {}

    async save(person: Person): Promise<void> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(PersonOrmEntity);

        await repository.save(PersonMapper.toPersistence(person));
    }

    async findById(id: PersonId): Promise<Person | null> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(PersonOrmEntity);
        
        const entity = await repository.findOne({
            where: {
                id: id.value,
            }
        });

        return entity ? PersonMapper.toDomain(entity) : null;
    }
}