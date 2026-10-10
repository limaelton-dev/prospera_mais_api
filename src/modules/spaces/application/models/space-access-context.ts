export type SpaceAccessContext = {
    spaceId: string;
    type: 'PERSONAL' | 'SHARED';
    status: 'ACTIVE' | 'CLOSING' | 'CLOSED';
    actorMemberId: string | null;
};
