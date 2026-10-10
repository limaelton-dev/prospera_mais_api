import { Injectable } from '@nestjs/common';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import type { SpaceAccessContext } from '../../../application/models/space-access-context.js';
import type { SpaceAccessQueries } from '../../../application/ports/private/space-access-queries.js';
import type { PersonId } from '../../../domain/person/person-id.js';
import type { SpaceId } from '../../../domain/space/space-id.js';

@Injectable()
export class TypeOrmSpaceAccessQueries implements SpaceAccessQueries {
    constructor(
        private readonly entityManagerProvider: EntityManagerProvider,
    ) {}

    async findAccessible(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceAccessContext | null> {
        const rows: SpaceAccessContext[] = await this.entityManagerProvider
            .get()
            .query(
                `SELECT s.id AS "spaceId", s.type, s.status,
                CASE WHEN s.type = 'SHARED' THEN actor_member.id ELSE NULL END AS "actorMemberId"
             FROM spaces s
             LEFT JOIN space_members actor_member ON actor_member.space_id = s.id
                AND actor_member.person_id = $1 AND actor_member.status = 'ACTIVE'
             WHERE s.id = $2 AND (
                (s.type = 'PERSONAL' AND s.personal_owner_person_id = $1)
                OR (s.type = 'SHARED' AND actor_member.id IS NOT NULL)
             )`,
                [actorId.value, spaceId.value],
            );
        return rows[0] ?? null;
    }
}
