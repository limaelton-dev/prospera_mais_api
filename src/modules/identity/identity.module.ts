import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/technical/database/database.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCredentialOrmEntity } from './infrastructure/typeorm/entities/auth-credential.orm-entity.js';
import { AuthSessionOrmEntity } from './infrastructure/typeorm/entities/auth-session.orm-entity.js';
import { TypeOrmCredentialRepository } from './infrastructure/typeorm/repositories/typeorm-credential.repository.js';
import { TypeOrmSessionRepository } from './infrastructure/typeorm/repositories/typeorm-session.repository.js';
import { CREDENTIAL_REPOSITORY } from './application/ports/private/credential.repository.js';
import { SESSION_REPOSITORY } from './application/ports/private/session.repository.js';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';
import { CryptSessionTokenGenerator } from './infrastructure/security/crypto-session-token-generator.js';
import { PASSWORD_HASHER } from './application/ports/private/password-hasher.js';
import { SESSION_TOKEN_GENERATOR } from './application/ports/private/session-token-generator.js';
import { SpacesModule } from '../spaces/spaces.module.js';
import { RegisterAccountHandler } from './application/handlers/register-account.handler.js';
import { LoginHandler } from './application/handlers/login.handler.js';

@Module({
    imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
            AuthCredentialOrmEntity,
            AuthSessionOrmEntity,
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

    exports: [],
})
export class IdentityModule {}
