import { Inject, Injectable } from '@nestjs/common';
import { PersonId } from '../../domain/person/person-id.js';
import type { SpaceSummaryView } from '../models/space-views.js';
import {
    SPACE_READ_QUERIES,
    type SpaceReadQueries,
} from '../ports/private/space-read-queries.js';

@Injectable()
export class ListAccessibleSpacesQuery {
    constructor(
        @Inject(SPACE_READ_QUERIES)
        private readonly readQueries: SpaceReadQueries,
    ) {}

    async execute(actorId: PersonId): Promise<{ items: SpaceSummaryView[] }> {
        return {
            items: await this.readQueries.listAccessible(actorId),
        };
    }
}
