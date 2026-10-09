import {
    createParamDecorator,
    UnauthorizedException,
    type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export type RequestActor = {
    personId: {
        readonly value: string;
    };
    sessionId: string;
};

type RequestWithActor = Request & {
    actor?: RequestActor;
};

export const CurrentActor = createParamDecorator<void, RequestActor>(
    (_data: void, context: ExecutionContext): RequestActor => {
        const request = context.switchToHttp().getRequest<RequestWithActor>();

        if (!request.actor) {
            throw new UnauthorizedException();
        }

        return request.actor;
    },
);
