import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { DatabaseModule } from '../../shared/technical/database/database.module.js';
import { SpacesModule } from '../spaces/spaces.module.js';

import { AuthCredentialOrmEntity } from './infrastructure/typeorm/entities/auth-credential.orm-entity.js';
import { AuthSessionOrmEntity } from './infrastructure/typeorm/entities/auth-session.orm-entity.js';
import { TypeOrmCredentialRepository } from './infrastructure/typeorm/repositories/typeorm-credential.repository.js';
import { TypeOrmSessionRepository } from './infrastructure/typeorm/repositories/typeorm-session.repository.js';

import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';
import { CryptSessionTokenGenerator } from './infrastructure/security/crypto-session-token-generator.js';

import { CREDENTIAL_REPOSITORY } from './application/ports/private/credential.repository.js';
import { SESSION_REPOSITORY } from './application/ports/private/session.repository.js';
import { PASSWORD_HASHER } from './application/ports/private/password-hasher.js';
import { SESSION_TOKEN_GENERATOR } from './application/ports/private/session-token-generator.js';

import { RegisterAccountHandler } from './application/handlers/register-account.handler.js';
import { LoginHandler } from './application/handlers/login.handler.js';
import { SessionService } from './application/services/session.service.js';

import { SessionAuthGuard } from './http/guards/session-auth.guard.js';
import { CsrfService } from './http/services/csrf.service.js';
import { AuthController } from './http/controllers/auth.controller.js';
import { LogoutHandler } from './application/handlers/logout.handler.js';
import { GetCurrentContextQuery } from './application/queries/get-current-context.query.js';
import { SessionCookieService } from './http/services/session-cookie.service.js';
import { IdentityExceptionFilter } from './http/filters/identity-exception.filter.js';

@Module({
    imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
            AuthCredentialOrmEntity,
            AuthSessionOrmEntity,
        ]),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 60,
            },
        ]),
        SpacesModule,
    ],

    providers: [
        TypeOrmCredentialRepository,
        TypeOrmSessionRepository,

        Argon2PasswordHasher,
        CryptSessionTokenGenerator,

        RegisterAccountHandler,
        LoginHandler,
        SessionService,
        SessionAuthGuard,
        CsrfService,
        LogoutHandler,
        GetCurrentContextQuery,
        SessionCookieService,

        ThrottlerGuard,

        {
            provide: APP_GUARD,
            useExisting: SessionAuthGuard,
        },
        {
            provide: APP_FILTER,
            useClass: IdentityExceptionFilter,
        },
        {
            provide: CREDENTIAL_REPOSITORY,
            useExisting: TypeOrmCredentialRepository,
        },
        {
            provide: SESSION_REPOSITORY,
            useExisting: TypeOrmSessionRepository,
        },
        {
            provide: PASSWORD_HASHER,
            useExisting: Argon2PasswordHasher,
        },
        {
            provide: SESSION_TOKEN_GENERATOR,
            useExisting: CryptSessionTokenGenerator,
        },
    ],

    controllers: [AuthController],

    exports: [],
})
export class IdentityModule {}
