import { Injectable } from '@nestjs/common';
import type { SpaceCommandResult } from '../models/space-views.js';
import type { SpaceCommand } from '../ports/private/space-command-receipts.js';
import { SpaceInvitationCommandService } from '../services/space-invitation-command.service.js';

export type ReplaceSpaceInvitationInput = Omit<
    Extract<SpaceCommand, { operation: 'REPLACE_INVITATION' }>,
    'operation'
>;

@Injectable()
export class ReplaceSpaceInvitationHandler {
    constructor(private readonly commands: SpaceInvitationCommandService) {}

    execute(input: ReplaceSpaceInvitationInput): Promise<SpaceCommandResult> {
        return this.commands.execute({
            ...input,
            operation: 'REPLACE_INVITATION',
        });
    }
}
