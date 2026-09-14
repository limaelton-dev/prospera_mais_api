import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../shared/technical/database/database.module.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonOrmEntity } from "./infrastructure/typeorm/person.orm-entity.js";
import { SpaceOrmEntity } from "./infrastructure/typeorm/space.orm-entity.js";
import { TypeOrmPersonRepository } from "./infrastructure/typeorm/repositories/typeorm-person.repository.js";
import { TypeOrmSpaceRepository } from "./infrastructure/typeorm/repositories/typeorm-space.repository.js";
import { PERSON_REPOSITORY } from "./application/ports/private/person.repository.js";
import { SPACE_REPOSITORY } from "./application/ports/private/space.repository.js";
import { PROVISION_PERSONAL_CONTEXT } from "./application/ports/public/provision-personal-context.js";
import { ProvisionPersonalContextService } from "./application/services/provision-personal-context.service.js";
import { GetPersonalContextService } from "./application/services/get-personal-context.service.js";
import { GET_PERSONAL_CONTEXT } from "./application/ports/public/get-personal-context.js";

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
        GetPersonalContextService,

        {
            provide: PERSON_REPOSITORY,
            useExisting: TypeOrmPersonRepository,
        },
        {
            provide: SPACE_REPOSITORY,
            useExisting: TypeOrmSpaceRepository,
        },
        {
            provide: PROVISION_PERSONAL_CONTEXT,
            useExisting: ProvisionPersonalContextService,
        },
        {
            provide: GET_PERSONAL_CONTEXT,
            useExisting: GetPersonalContextService,
        },
    ],

    exports: [
        PROVISION_PERSONAL_CONTEXT,
        GET_PERSONAL_CONTEXT,
    ]
})
export class SpacesModule {}