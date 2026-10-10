import { Inject, Injectable } from '@nestjs/common';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import type { PersonId } from '../../domain/person/person-id.js';
import type { SpaceId } from '../../domain/space/space-id.js';
import type { SpaceAccessContext } from '../models/space-access-context.js';
import {
    SPACE_ACCESS_QUERIES,
    type SpaceAccessQueries,
} from '../ports/private/space-access-queries.js';
import type { SpaceAccessPort } from '../ports/public/space-access.port.js';

@Injectable()
export class SpaceAccessService implements SpaceAccessPort {
    constructor(
        @Inject(SPACE_ACCESS_QUERIES)
        private readonly queries: SpaceAccessQueries,
    ) {}

    async assertCanRead(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceAccessContext> {
        const context = await this.queries.findAccessible(actorId, spaceId);
        if (!context) throw new SpacesDomainError('SPACE_NOT_FOUND');
        return context;
    }

    async assertCanWrite(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceAccessContext> {
        const context = await this.assertCanRead(actorId, spaceId);
        if (context.status !== 'ACTIVE')
            throw new SpacesDomainError('SPACE_NOT_ACTIVE');
        return context;
    }
}
