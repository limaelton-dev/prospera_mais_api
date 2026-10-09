import { Injectable } from '@nestjs/common';
import type { SpaceCommandResult } from '../models/space-views.js';
import type { SpaceCommand } from '../ports/private/space-command-receipts.js';
import { SpaceInvitationCommandService } from '../services/space-invitation-command.service.js';

export type CreateSharedSpaceInput = Omit<
    Extract<SpaceCommand, { operation: 'CREATE_SPACE' }>,
    'operation'
>;

@Injectable()
export class CreateSharedSpaceHandler {
    constructor(private readonly commands: SpaceInvitationCommandService) {}

    execute(input: CreateSharedSpaceInput): Promise<SpaceCommandResult> {
        return this.commands.execute({
            ...input,
            operation: 'CREATE_SPACE',
        });
    }
}
