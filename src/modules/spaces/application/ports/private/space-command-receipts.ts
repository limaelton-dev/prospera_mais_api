import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';

export const SPACE_COMMAND_RECEIPTS = Symbol('SPACE_COMMAND_RECEIPTS');

type CommandIdentity = {
    actorId: PersonId;
    key: string;
};

export type SpaceInvitationCommand =
    | (CommandIdentity & {
          operation: 'CREATE_SPACE';
          name: string;
      })
    | (CommandIdentity & {
          operation: 'ISSUE_INVITATION';
          spaceId: SpaceId;
          expectedVersion: number;
      })
    | (CommandIdentity & {
          operation: 'REPLACE_INVITATION';
          spaceId: SpaceId;
          invitationId: InvitationId;
          expectedVersion: number;
      });

export type RespondToInvitationCommand = CommandIdentity & {
    operation: 'RESPOND_INVITATION';
    tokenHash: Uint8Array;
    decision: 'ACCEPT' | 'REJECT';
    expectedVersion: number;
};

export type SpaceCommand = SpaceInvitationCommand | RespondToInvitationCommand;

export type SpaceCommandReceipt = {
    resultSpaceId: SpaceId;
    resultInvitationId: InvitationId;
    createdAt: Date;
};

export interface SpaceCommandReceipts {
    find(command: SpaceCommand): Promise<SpaceCommandReceipt | null>;

    save(command: SpaceCommand, receipt: SpaceCommandReceipt): Promise<void>;
}
