import {
    Body,
    Controller,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { RegisterAccountHandler } from '../../application/handlers/register-account.handler.js';
import { LoginHandler } from '../../application/handlers/login.handler.js';
import { LogoutHandler } from '../../application/handlers/logout.handler.js';
import { GetCurrentContextQuery } from '../../application/queries/get-current-context.query.js';
import type { AuthenticatedActor } from '../../application/models/authenticated-actor.js';
import type { AuthenticatedContext } from '../../application/models/authenticated-context.js';

import { CurrentActor } from '../decorators/current-actor.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { RegisterAccountDto } from '../dto/register-account.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { CsrfService } from '../services/csrf.service.js';
import { SessionCookieService } from '../services/session-cookie.service.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly csrfService: CsrfService,
        private readonly sessionCookieService: SessionCookieService,
        private readonly RegisterAccountHandler: RegisterAccountHandler,
        private readonly loginHandler: LoginHandler,
        private readonly getCurrentContextQuery: GetCurrentContextQuery,
        private readonly logoutHandler: LogoutHandler,
    ) {}

    @Public()
    @Get('csrf')
    @Header('Cache-Control', 'no-store')
    getCsrfToken(
        @Req() request: Request,
        @Res({  passthrough: true }) response: Response
    ): { csrfToken: string } {
        return {
            csrfToken: this.csrfService.generateToken(request, response)
        }
    }

    @Public()
    @Post('register')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 600000 } })
    @HttpCode(HttpStatus.CREATED)
    @Header('Cache-Control', 'no-store')
    async register(
        @Body() input: RegisterAccountDto,
        @Res({ passthrough: true }) response: Response
    ): Promise<AuthenticatedContext> {
        const result = await this.RegisterAccountHandler.execute(input);
        this.sessionCookieService.set(response, result.sessionToken);

        return result.context;
    }

    @Public()
    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Header('Cache-Control', 'no-store')
    async login(
        @Body() input: LoginDto,
        @Res({ passthrough: true }) response: Response
    ): Promise<AuthenticatedContext> {
        const result = await this.loginHandler.execute(input);

        this.sessionCookieService.set(response, result.sessionToken);

        return result.context;
    }

    @Get('me')
    @Header('Cache-Control', 'no-store')
    getCurrentContext(
        @CurrentActor() actor: AuthenticatedActor
    ): Promise<AuthenticatedContext> {
        return this.getCurrentContextQuery.execute(actor.personId);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Header('Cache-Control', 'no-store')
    async logout(
        @CurrentActor() actor: AuthenticatedActor,
        @Res({ passthrough: true }) response: Response
    ): Promise<void> {
        await this.logoutHandler.execute(actor.sessionId);

        this.sessionCookieService.clear(response);
    }
}