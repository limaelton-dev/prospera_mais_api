import type { PersonId } from '../../../domain/person/person-id.js';
import type { SpaceId } from '../../../domain/space/space-id.js';
import type { SpaceAccessContext } from '../../models/space-access-context.js';

export const SPACE_ACCESS_QUERIES = Symbol('SPACE_ACCESS_QUERIES');

export interface SpaceAccessQueries {
    findAccessible(
        actorId: PersonId,
        spaceId: SpaceId,
    ): Promise<SpaceAccessContext | null>;
}
