import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedActor } from "../../application/models/authenticated-actor.js";
import { AuthenticatedRequest } from "../types/authenticated-request.js";
import { UnauthenticatedError } from "../../application/errors/unauthenticated.error.js";

export const CurrentActor = createParamDecorator<void, AuthenticatedActor>(
    (_data: void, context: ExecutionContext): AuthenticatedActor => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        if(!request.actor) {
            throw new UnauthenticatedError();
        }

        return request.actor;
    }
)