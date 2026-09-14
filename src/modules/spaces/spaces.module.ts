import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../shared/technical/database/database.module.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonOrmEntity } from "./infrastructure/typeorm/person.orm-entity.js";
import { SpaceOrmEntity } from "./infrastructure/typeorm/space.orm-entity.js";
import { TypeOrmPersonRepository } from "./infrastructure/typeorm/repositories/typeorm-person.repository.js";
import { TypeOrmSpaceRepository } from "./infrastructure/typeorm/repositories/typeorm-space.repository.js";
import { PERSON_REPOSITORY } from "./application/ports/person.repository.js";
import { SPACE_REPOSITORY } from "./application/ports/space.repository.js";
import { PROVISION_PERSONAL_CONTEXT } from "./application/ports/provision-personal-context.js";
import { ProvisionPersonalContextService } from "./application/services/provision-personal-context.service.js";

@Module({
    imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
            PersonOrmEntity,
            SpaceOrmEntity,
        ]),
    ],

    providers: [
        TypeOrmPersonRepository,
        TypeOrmSpaceRepository,
        ProvisionPersonalContextService,

        {
            provide: PERSON_REPOSITORY,
            useExisting: TypeOrmPersonRepository,
        },
        {
            provide: SPACE_REPOSITORY,
            useExisting: TypeOrmSpaceRepository
        },
        {
            provide: PROVISION_PERSONAL_CONTEXT,
            useExisting: ProvisionPersonalContextService
        }
    ],

    exports: [
        PROVISION_PERSONAL_CONTEXT,
    ]
})
export class SpacesModule {}