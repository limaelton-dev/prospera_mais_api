import { Inject, Injectable } from '@nestjs/common';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import { PersonId } from '../../domain/person/person-id.js';
import { SpaceId } from '../../domain/space/space-id.js';
import type { SpaceDetailsView } from '../models/space-views.js';
import {
    SPACE_READ_QUERIES,
    type SpaceReadQueries,
} from '../ports/private/space-read-queries.js';
import {
    SPACE_ACCESS_PORT,
    type SpaceAccessPort,
} from '../ports/public/space-access.port.js';

@Injectable()
export class GetSpaceDetailsQuery {
    constructor(
        @Inject(SPACE_READ_QUERIES)
        private readonly readQueries: SpaceReadQueries,
        @Inject(SPACE_ACCESS_PORT)
        private readonly access: SpaceAccessPort,
    ) {}

    async execute(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceDetailsView> {
        await this.access.assertCanRead(actorId, spaceId);
        const details = await this.readQueries.findDetails(
            actorId,
            spaceId,
            new Date(),
        );

        if (!details) {
            throw new SpacesDomainError('SPACE_NOT_FOUND');
        }

        return details;
    }
}
