import { PersonId } from '../../domain/person/person-id.js';
import { SpaceId } from '../../domain/space/space-id.js';
import { Space, SpaceStatus, SpaceType } from '../../domain/space/space.js';
import { SpaceOrmEntity } from '../typeorm/entities/space.orm-entity.js';

export class SpaceMapper {
    static toDomain(entity: SpaceOrmEntity): Space {
        if (
            entity.type !== SpaceType.PERSONAL ||
            entity.status !== SpaceStatus.ACTIVE ||
            !entity.personalOwnerPersonId
        ) {
            throw new Error('Expected a persisted active personal space');
        }

        return Space.restore({
            id: SpaceId.from(entity.id),
            type: SpaceType.PERSONAL,
            status: SpaceStatus.ACTIVE,
            personalOwnerPersonId: PersonId.from(entity.personalOwnerPersonId),
            version: entity.version,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    static toPersistence(space: Space): SpaceOrmEntity {
        const props = space.snapshot();

        if (props.type !== SpaceType.PERSONAL) {
            throw new Error('Shared space persistence is not implemented yet');
        }

        const entity = new SpaceOrmEntity();

        entity.id = props.id.value;
        entity.type = props.type;
        entity.status = props.status;
        entity.personalOwnerPersonId = props.personalOwnerPersonId.value;
        entity.version = props.version;
        entity.createdAt = props.createdAt;
        entity.updatedAt = props.updatedAt;

        return entity;
    }
}
