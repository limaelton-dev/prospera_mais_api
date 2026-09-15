import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../shared/technical/database/database.module.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthCredentialOrmEntity } from "./infrastructure/typeorm/entities/auth-credential.orm-entity.js";
import { AuthSessionOrmEntity } from "./infrastructure/typeorm/entities/auth-session.orm-entity.js";
import { TypeOrmCredentialRepository } from "./infrastructure/typeorm/repositories/typeorm-credential.repository.js";
import { TypeOrmSessionRepository } from "./infrastructure/typeorm/repositories/typeorm-session.repository.js";
import { CREDENTIAL_REPOSITORY } from "./application/ports/private/credential.repository.js";
import { SESSION_REPOSITORY } from "./application/ports/private/session.repository.js";

@Module({
    imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
            AuthCredentialOrmEntity,
            AuthSessionOrmEntity,
        ]),
    ],

    providers: [
        TypeOrmCredentialRepository,
        TypeOrmSessionRepository,

        {
            provide: CREDENTIAL_REPOSITORY,
            useExisting: TypeOrmCredentialRepository
        },
        {
            provide: SESSION_REPOSITORY,
            useExisting: TypeOrmSessionRepository
        },
    ],
    
    exports: [],
})
export class IdentityModule {}