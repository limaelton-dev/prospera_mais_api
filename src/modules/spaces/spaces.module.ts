import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/technical/database/database.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonOrmEntity } from './infrastructure/typeorm/entities/person.orm-entity.js';
import { SpaceOrmEntity } from './infrastructure/typeorm/entities/space.orm-entity.js';
import { TypeOrmPersonRepository } from './infrastructure/typeorm/repositories/typeorm-person.repository.js';
import { TypeOrmSpaceRepository } from './infrastructure/typeorm/repositories/typeorm-space.repository.js';
import { PERSON_REPOSITORY } from './application/ports/private/person.repository.js';
import { SPACE_REPOSITORY } from './application/ports/private/space.repository.js';
import { PROVISION_PERSONAL_CONTEXT } from './application/ports/public/provision-personal-context.js';
import { ProvisionPersonalContextService } from './application/services/provision-personal-context.service.js';
import { GetPersonalContextService } from './application/services/get-personal-context.service.js';
import { GET_PERSONAL_CONTEXT } from './application/ports/public/get-personal-context.js';
import { SpaceMemberOrmEntity } from './infrastructure/typeorm/entities/space-member.orm-entity.js';
import { SpaceInvitationOrmEntity } from './infrastructure/typeorm/entities/space-invitation.orm-entity.js';
import { SpaceCommandReceiptOrmEntity } from './infrastructure/typeorm/entities/space-command-receipt.orm-entity.js';
import { NodeInvitationTokenGenerator } from './infrastructure/security/node-invitation-token-generator.js';
import { TypeOrmSpaceCommandReceipts } from './infrastructure/typeorm/repositories/typeorm-space-command-receipts.js';
import { INVITATION_TOKEN_GENERATOR } from './application/ports/private/invitation-token-generator.js';
import { SPACE_COMMAND_RECEIPTS } from './application/ports/private/space-command-receipts.js';

@Module({
    imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
            PersonOrmEntity,
            SpaceOrmEntity,
            SpaceMemberOrmEntity,
            SpaceInvitationOrmEntity,
            SpaceCommandReceiptOrmEntity,
        ]),
    ],

    providers: [
        TypeOrmPersonRepository,
        TypeOrmSpaceRepository,
        ProvisionPersonalContextService,
        GetPersonalContextService,
        NodeInvitationTokenGenerator,
        TypeOrmSpaceCommandReceipts,

        {
            provide: INVITATION_TOKEN_GENERATOR,
            useExisting: NodeInvitationTokenGenerator,
        },
        {
            provide: SPACE_COMMAND_RECEIPTS,
            useExisting: TypeOrmSpaceCommandReceipts,
        },
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

    exports: [PROVISION_PERSONAL_CONTEXT, GET_PERSONAL_CONTEXT],
})
export class SpacesModule {}
