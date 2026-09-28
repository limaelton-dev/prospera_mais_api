export const INVITATION_TOKEN_GENERATOR = Symbol('INVITATION_TOKEN_GENERATOR');

export type GeneratedInvitationToken = {
    token: string;
    tokenHash: Uint8Array;
};

export interface InvitationTokenGenerator {
    generate(): GeneratedInvitationToken;
}
