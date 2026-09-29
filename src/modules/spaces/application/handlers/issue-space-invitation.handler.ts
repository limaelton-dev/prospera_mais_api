import { Injectable } from '@nestjs/common';
import type { SpaceCommandResult } from '../models/space-views.js';
import type { SpaceCommand } from '../ports/private/space-command-receipts.js';
import { SpaceInvitationCommandService } from '../services/space-invitation-command.service.js';

export type IssueSpaceInvitationInput = Omit<
    Extract<SpaceCommand, { operation: 'ISSUE_INVITATION' }>,
    'operation'
>;

@Injectable()
export class IssueSpaceInvitationHandler {
    constructor(private readonly commands: SpaceInvitationCommandService) {}

    execute(input: IssueSpaceInvitationInput): Promise<SpaceCommandResult> {
        return this.commands.execute({
            ...input,
            operation: 'ISSUE_INVITATION',
        });
    }
}
