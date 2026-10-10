export type SharedSpaceView = {
    id: string;
    type: 'SHARED';
    status: 'ACTIVE' | 'CLOSING' | 'CLOSED';
    label: string;
    version: number;
};

export type PersonalSpaceView = {
    id: string;
    type: 'PERSONAL';
    status: 'ACTIVE';
    label: 'Meu espaço';
    version: number;
};

export type SpaceSummaryView = PersonalSpaceView | SharedSpaceView;

export type ActorMembershipView = {
    id: string;
    personId: string;
    status: 'ACTIVE';
};

export type InvitationView = {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
    expiresAt: string;
};

export type SpaceDetailsView =
    | {
          space: PersonalSpaceView;
          actorMembership: null;
          activeMemberCount: 0;
          invitation: null;
      }
    | {
          space: SharedSpaceView;
          actorMembership: ActorMembershipView;
          activeMemberCount: 1 | 2;
          invitation:
              | (InvitationView & {
                    canIssue: boolean;
                    canReplace: boolean;
                })
              | null;
      };

export type SpaceInvitationView = {
    space: SharedSpaceView;
    actorMembership: ActorMembershipView;
    invitation: InvitationView;
};

export type SpaceCommandResult =
    | (SpaceInvitationView & {
          space: SharedSpaceView & { status: 'ACTIVE' };
          invitation: InvitationView & { status: 'PENDING' };
          inviteUrl: string;
          linkAvailable: true;
          replayed: false;
      })
    | (SpaceInvitationView & {
          inviteUrl: null;
          linkAvailable: false;
          replayed: true;
      });

export type InvitationPreviewData = {
    invitation: InvitationView;
    space: SharedSpaceView;
    invitedBy: { displayName: string };
    activeMemberCount: number;
    actorIsCreator: boolean;
    actorIsMember: boolean;
};

export type InvitationPreviewView = {
    invitation: { id: string; status: 'PENDING'; expiresAt: string };
    space: { id: string; label: string; version: number };
    invitedBy: { displayName: string };
    canRespond: boolean;
};

export type InvitationResponseView =
    | {
          decision: 'ACCEPT';
          invitation: { id: string; status: 'ACCEPTED'; resolvedAt: string };
          spaceId: string;
          actorMembership: ActorMembershipView;
      }
    | {
          decision: 'REJECT';
          invitation: { id: string; status: 'REJECTED'; resolvedAt: string };
          spaceId: string;
          actorMembership: null;
      };

export type RespondToInvitationResult = InvitationResponseView & {
    replayed: boolean;
};
