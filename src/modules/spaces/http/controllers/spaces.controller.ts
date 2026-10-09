import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';

import {
    CurrentActor,
    type RequestActor,
} from '../../../../shared/technical/http/current-actor.decorator.js';
import { IdempotencyKey } from '../../../../shared/technical/http/idempotency-key.decorator.js';

import { CreateSharedSpaceHandler } from '../../application/handlers/create-shared-space.handler.js';
import { IssueSpaceInvitationHandler } from '../../application/handlers/issue-space-invitation.handler.js';
import { ReplaceSpaceInvitationHandler } from '../../application/handlers/replace-space-invitation.handler.js';
import type { SpaceCommandResult } from '../../application/models/space-views.js';
import { GetSpaceDetailsQuery } from '../../application/queries/get-space-details.query.js';
import { ListAccessibleSpacesQuery } from '../../application/queries/list-accessible-spaces.query.js';

import { InvitationId } from '../../domain/invitation/invitation-id.js';
import { PersonId } from '../../domain/person/person-id.js';
import { SpaceId } from '../../domain/space/space-id.js';

import { CreateSharedSpaceDto } from '../dto/create-shared-space.dto.js';
import { InvitationCommandDto } from '../dto/invitation-command.dto.js';
import {
    ReplaceInvitationParamsDto,
    SpaceParamsDto,
} from '../dto/space-params.dto.js';
import type {
    CreateSharedSpaceResponse,
    InvitationCommandResponse,
    ListAccessibleSpacesResponse,
    SpaceDetailsResponse,
} from '../types/spaces-responses.js';

function invitationResponse(
    result: SpaceCommandResult,
): InvitationCommandResponse {
    if (result.replayed) {
        return {
            space: result.space,
            invitation: result.invitation,
            inviteUrl: null,
            linkAvailable: false,
            replayed: true,
        };
    }

    return {
        space: result.space,
        invitation: result.invitation,
        inviteUrl: result.inviteUrl,
        linkAvailable: true,
        replayed: false,
    };
}

@Controller('spaces')
export class SpacesController {
    constructor(
        private readonly createSharedSpace: CreateSharedSpaceHandler,
        private readonly issueInvitation: IssueSpaceInvitationHandler,
        private readonly replaceInvitation: ReplaceSpaceInvitationHandler,
        private readonly listSpaces: ListAccessibleSpacesQuery,
        private readonly getDetails: GetSpaceDetailsQuery,
    ) {}

    @Post()
    @Header('Cache-Control', 'no-store')
    create(
        @CurrentActor() actor: RequestActor,
        @IdempotencyKey() key: string,
        @Body() input: CreateSharedSpaceDto,
    ): Promise<CreateSharedSpaceResponse> {
        return this.createSharedSpace.execute({
            actorId: PersonId.from(actor.personId.value),
            key,
            name: input.name,
        });
    }

    @Get()
    @Header('Cache-Control', 'no-store')
    list(
        @CurrentActor() actor: RequestActor,
    ): Promise<ListAccessibleSpacesResponse> {
        return this.listSpaces.execute(PersonId.from(actor.personId.value));
    }

    @Get(':spaceId')
    @Header('Cache-Control', 'no-store')
    detail(
        @CurrentActor() actor: RequestActor,
        @Param() params: SpaceParamsDto,
    ): Promise<SpaceDetailsResponse> {
        return this.getDetails.execute(
            PersonId.from(actor.personId.value),
            SpaceId.from(params.spaceId),
        );
    }

    @Post(':spaceId/invitations')
    @Header('Cache-Control', 'no-store')
    async issue(
        @CurrentActor() actor: RequestActor,
        @IdempotencyKey() key: string,
        @Param() params: SpaceParamsDto,
        @Body() input: InvitationCommandDto,
    ): Promise<InvitationCommandResponse> {
        const result = await this.issueInvitation.execute({
            actorId: PersonId.from(actor.personId.value),
            key,
            spaceId: SpaceId.from(params.spaceId),
            expectedVersion: input.expectedVersion,
        });

        return invitationResponse(result);
    }

    @Post(':spaceId/invitations/:invitationId/replace')
    @Header('Cache-Control', 'no-store')
    async replace(
        @CurrentActor() actor: RequestActor,
        @IdempotencyKey() key: string,
        @Param() params: ReplaceInvitationParamsDto,
        @Body() input: InvitationCommandDto,
    ): Promise<InvitationCommandResponse> {
        const result = await this.replaceInvitation.execute({
            actorId: PersonId.from(actor.personId.value),
            key,
            spaceId: SpaceId.from(params.spaceId),
            invitationId: InvitationId.from(params.invitationId),
            expectedVersion: input.expectedVersion,
        });

        return invitationResponse(result);
    }
}
