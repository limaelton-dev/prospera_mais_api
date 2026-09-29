import { Inject, Injectable } from '@nestjs/common';
import { SpacesDomainError } from '../../domain/errors/spaces-domain.error.js';
import { PersonId } from '../../domain/person/person-id.js';
import { SpaceId } from '../../domain/space/space-id.js';
import type { SpaceDetailsView } from '../models/space-views.js';
import {
    SPACE_READ_QUERIES,
    type SpaceReadQueries,
} from '../ports/private/space-read-queries.js';

@Injectable()
export class GetSpaceDetailsQuery {
    constructor(
        @Inject(SPACE_READ_QUERIES)
        private readonly readQueries: SpaceReadQueries,
    ) {}

    async execute(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceDetailsView> {
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
