import {
    Body,
    Controller,
    Header,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
    CurrentActor,
    type RequestActor,
} from '../../../../shared/technical/http/current-actor.decorator.js';
import { IdempotencyKey } from '../../../../shared/technical/http/idempotency-key.decorator.js';
import { RespondToSharedSpaceInvitationHandler } from '../../application/handlers/respond-to-shared-space-invitation.handler.js';
import { GetInvitationPreviewQuery } from '../../application/queries/get-invitation-preview.query.js';
import { PersonId } from '../../domain/person/person-id.js';
import { PreviewInvitationDto } from '../dto/preview-invitation.dto.js';
import { RespondToInvitationDto } from '../dto/respond-to-invitation.dto.js';
import type {
    InvitationPreviewResponse,
    RespondToInvitationResponse,
} from '../types/spaces-responses.js';

@Controller('invitations')
@UseGuards(ThrottlerGuard)
export class InvitationsController {
    constructor(
        private readonly getPreview: GetInvitationPreviewQuery,
        private readonly respondToInvitation: RespondToSharedSpaceInvitationHandler,
    ) {}

    @Post('preview')
    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Header('Cache-Control', 'no-store')
    preview(
        @CurrentActor() actor: RequestActor,
        @Body() input: PreviewInvitationDto,
    ): Promise<InvitationPreviewResponse> {
        return this.getPreview.execute(
            PersonId.from(actor.personId.value),
            input.token,
        );
    }

    @Post('respond')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Header('Cache-Control', 'no-store')
    respond(
        @CurrentActor() actor: RequestActor,
        @IdempotencyKey() key: string,
        @Body() input: RespondToInvitationDto,
    ): Promise<RespondToInvitationResponse> {
        return this.respondToInvitation.execute({
            actorId: PersonId.from(actor.personId.value),
            key,
            token: input.token,
            decision: input.decision,
            expectedVersion: input.expectedVersion,
        });
    }
}
