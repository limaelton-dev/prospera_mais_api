import {
    Injectable,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { SessionService } from '../../application/services/session.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly sessionService: SessionService,
        private readonly configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if(isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const isProduction = 
            this.configService.getOrThrow<string>('NODE_ENV') === 
            'production';

        const cookieName = isProduction ? '__Host-session' : 'session';
        const sessionToken = request.cookies?.[cookieName];

        request.actor = await this.sessionService.authenticate(sessionToken);

        return true;
    }
}