import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../shared/technical/database/database.module.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonOrmEntity } from "./infrastructure/typeorm/person.orm-entity.js";
import { SpaceOrmEntity } from "./infrastructure/typeorm/space.orm-entity.js";
import { TypeOrmPersonRepository } from "./infrastructure/typeorm/repositories/typeorm-person.repository.js";
import { TypeOrmSpaceRepository } from "./infrastructure/typeorm/repositories/typeorm-space.repository.js";
import { PERSON_REPOSITORY } from "./application/ports/person.repository.js";
import { SPACE_REPOSITORY } from "./application/ports/space.repository.js";

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

        {
            provide: PERSON_REPOSITORY,
            useExisting: TypeOrmPersonRepository,
        },
        {
            provide: SPACE_REPOSITORY,
            useExisting: TypeOrmSpaceRepository
        },
    ],
})
export class SpaceModule {}