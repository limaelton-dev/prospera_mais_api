import { Injectable } from '@nestjs/common';
import { SpaceRepository } from '../../../application/ports/private/space.repository.js';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import { Space } from '../../../domain/space/space.js';
import { SpaceOrmEntity } from '../entities/space.orm-entity.js';
import { SpaceMapper } from '../../mappers/space.mapper.js';
import { PersonId } from '../../../domain/person/person-id.js';

@Injectable()
export class TypeOrmSpaceRepository implements SpaceRepository {
    constructor(
        private readonly entityManagerProvider: EntityManagerProvider,
    ) {}

    async save(space: Space): Promise<void> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(SpaceOrmEntity);

        await repository.save(SpaceMapper.toPersistence(space));
    }

    async findPersonalByOwnerPersonId(
        personId: PersonId,
    ): Promise<Space | null> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(SpaceOrmEntity);

        const entity = await repository.findOne({
            where: {
                type: 'PERSONAL',
                personalOwnerPersonId: personId.value,
            },
        });

        return entity ? SpaceMapper.toDomain(entity) : null;
    }
}
