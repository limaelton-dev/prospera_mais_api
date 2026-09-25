import type { Request } from 'express';

import { AuthenticatedActor } from '../../application/models/authenticated-actor.js';

export type AuthenticatedRequest = Omit<Request, 'cookies'> & {
    cookies?: Record<string, unknown>;
    actor?: AuthenticatedActor;
};
