import { SpaceId } from '../../domain/space/space-id.js';
import { Space, SpaceStatus, SpaceType } from '../../domain/space/space.js';
import { SpaceOrmEntity } from '../typeorm/entities/space.orm-entity.js';
import { PersonId } from '../../domain/person/person-id.js';

export class SpaceMapper {
    static toDomain(entity: SpaceOrmEntity): Space {
        if (!entity.personalOwnerPersonId) {
            throw new Error('Personal space must have an owner');
        }
        return Space.restore({
            id: SpaceId.from(entity.id),
            type: entity.type as SpaceType,
            status: entity.status as SpaceStatus,
            personalOwnerPersonId: PersonId.from(entity.personalOwnerPersonId),
            version: entity.version,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    static toPersistence(space: Space): SpaceOrmEntity {
        const entity = new SpaceOrmEntity();

        entity.id = space.id.value;
        entity.type = space.type;
        entity.status = space.status;
        entity.personalOwnerPersonId = space.personalOwnerPersonId.value;
        entity.version = space.version;
        entity.createdAt = space.createdAt;
        entity.updatedAt = space.updatedAt;

        return entity;
    }
}
