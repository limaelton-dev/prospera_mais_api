import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import { ConcurrentModificationError } from '../../../application/errors/concurrent-modification.error.js';
import type {
    InvitationResponsePersistence,
    InvitationResponseTarget,
    NewInvitationPersistence,
    SpaceRepository,
} from '../../../application/ports/private/space.repository.js';
import { InvitationId } from '../../../domain/invitation/invitation-id.js';
import { InvitationStatus } from '../../../domain/invitation/invitation.js';
import { PersonId } from '../../../domain/person/person-id.js';
import { SpaceId } from '../../../domain/space/space-id.js';
import { Space, SpaceType } from '../../../domain/space/space.js';
import { SpaceMapper } from '../../mappers/space.mapper.js';
import { SpaceOrmEntity } from '../entities/space.orm-entity.js';
import { SpaceMemberOrmEntity } from '../entities/space-member.orm-entity.js';
import { SpaceInvitationOrmEntity } from '../entities/space-invitation.orm-entity.js';

@Injectable()
export class TypeOrmSpaceRepository implements SpaceRepository {
    constructor(
        private readonly entityManagerProvider: EntityManagerProvider,
    ) {}

    async save(space: Space): Promise<void> {
        if (space.type !== SpaceType.PERSONAL) {
            throw new Error('Use shared-space persistence operations');
        }

        await this.entityManagerProvider
            .get()
            .insert(SpaceOrmEntity, SpaceMapper.toPersistence(space));
    }

    async findPersonalByOwnerPersonId(
        personId: PersonId,
    ): Promise<Space | null> {
        const entity = await this.entityManagerProvider
            .get()
            .getRepository(SpaceOrmEntity)
            .findOneBy({
                type: SpaceType.PERSONAL,
                personalOwnerPersonId: personId.value,
            });

        return entity ? SpaceMapper.toDomain(entity) : null;
    }

    async findById(spaceId: SpaceId): Promise<Space | null> {
        const entity = await this.entityManagerProvider
            .get()
            .getRepository(SpaceOrmEntity)
            .createQueryBuilder('space')
            .leftJoinAndMapMany(
                'space.members',
                SpaceMemberOrmEntity,
                'member',
                `member.space_id = space.id AND member.status = :active`,
                { active: 'ACTIVE' },
            )
            .leftJoinAndMapMany(
                'space.invitations',
                SpaceInvitationOrmEntity,
                'invitation',
                `invitation.id = (
                    SELECT candidate.id
                    FROM space_invitations candidate
                    WHERE candidate.space_id = space.id
                    ORDER BY
                        (candidate.status = 'PENDING') DESC,
                        candidate.issued_at DESC,
                        candidate.id DESC
                    LIMIT 1
                )`,
            )
            .where('space.id = :id', { id: spaceId.value })
            .getOne();

        return entity ? SpaceMapper.toDomain(entity) : null;
    }

    async findByInvitationTokenHash(
        tokenHash: Uint8Array,
    ): Promise<InvitationResponseTarget | null> {
        if (tokenHash.byteLength !== 32) {
            throw new Error('Expected an invitation token hash');
        }

        const entity = await this.entityManagerProvider
            .get()
            .getRepository(SpaceOrmEntity)
            .createQueryBuilder('space')
            .innerJoinAndMapMany(
                'space.invitations',
                SpaceInvitationOrmEntity,
                'invitation',
                'invitation.space_id = space.id AND invitation.token_hash = :hash',
                { hash: Buffer.from(tokenHash) },
            )
            .leftJoinAndMapMany(
                'space.members',
                SpaceMemberOrmEntity,
                'member',
                "member.space_id = space.id AND member.status = 'ACTIVE'",
            )
            .getOne();

        if (!entity) {
            return null;
        }

        return {
            space: SpaceMapper.toDomain(entity),
            invitationId: InvitationId.from(entity.invitations![0].id),
        };
    }

    async createShared(
        space: Space,
        invitation: NewInvitationPersistence,
    ): Promise<void> {
        const manager = this.transactionManager();
        const createdInvitation = this.requireNewInvitation(space, invitation);

        if (
            space.version !== 1 ||
            space.members.length !== 1 ||
            space.invitations.length !== 1
        ) {
            throw new Error('Expected a newly created shared aggregate');
        }

        await manager.insert(SpaceOrmEntity, SpaceMapper.toPersistence(space));

        const member = space.members[0];

        await manager.insert(SpaceMemberOrmEntity, {
            id: member.id.value,
            spaceId: space.id.value,
            personId: member.personId.value,
            status: member.status,
            slot: 1,
            joinedAt: member.joinedAt,
        });

        await manager.insert(SpaceInvitationOrmEntity, {
            ...SpaceMapper.invitationToPersistence(createdInvitation, space.id),
            tokenHash: Buffer.from(invitation.tokenHash),
        });
    }

    async saveInvitationChange(
        space: Space,
        expectedVersion: number,
        invitation: NewInvitationPersistence,
    ): Promise<void> {
        const manager = this.transactionManager();
        const createdInvitation = this.requireNewInvitation(space, invitation);

        if (
            !Number.isSafeInteger(expectedVersion) ||
            expectedVersion < 1 ||
            space.version !== expectedVersion + 1
        ) {
            throw new Error('Expected exactly one aggregate transition');
        }

        const result = await manager
            .createQueryBuilder()
            .update(SpaceOrmEntity)
            .set({
                version: () => '"version" + 1',
                updatedAt: space.updatedAt,
            })
            .where('id = :id AND version = :expectedVersion AND type = :type', {
                id: space.id.value,
                expectedVersion,
                type: SpaceType.SHARED,
            })
            .execute();

        if (result.affected !== 1) {
            throw new ConcurrentModificationError();
        }

        for (const previous of space.invitations) {
            if (previous.id.equals(invitation.invitationId)) {
                continue;
            }

            const updated = await manager.update(
                SpaceInvitationOrmEntity,
                {
                    id: previous.id.value,
                    spaceId: space.id.value,
                },
                SpaceMapper.invitationToPersistence(previous, space.id),
            );

            if (updated.affected !== 1) {
                throw new Error('Persisted invitation was not found');
            }
        }

        await manager.insert(SpaceInvitationOrmEntity, {
            ...SpaceMapper.invitationToPersistence(createdInvitation, space.id),
            tokenHash: Buffer.from(invitation.tokenHash),
        });
    }

    async saveInvitationResponse(
        space: Space,
        expectedVersion: number,
        response: InvitationResponsePersistence,
    ): Promise<void> {
        const manager = this.transactionManager();
        const invitation = space.invitations.find((candidate) =>
            candidate.id.equals(response.invitationId),
        );
        const member =
            response.memberId === null
                ? null
                : space.members.find((candidate) =>
                      candidate.id.equals(response.memberId!),
                  );

        if (
            space.type !== SpaceType.SHARED ||
            space.status !== 'ACTIVE' ||
            !Number.isSafeInteger(expectedVersion) ||
            expectedVersion < 1 ||
            space.version !== expectedVersion + 1 ||
            !invitation ||
            !invitation.resolvedAt ||
            invitation.resolvedAt.getTime() !== space.updatedAt.getTime() ||
            (invitation.status !== InvitationStatus.ACCEPTED &&
                invitation.status !== InvitationStatus.REJECTED) ||
            (invitation.status === InvitationStatus.ACCEPTED
                ? !member ||
                  member.joinedAt.getTime() !== invitation.resolvedAt.getTime()
                : response.memberId !== null)
        ) {
            throw new Error('Invalid invitation response persistence input');
        }

        const result = await manager
            .createQueryBuilder()
            .update(SpaceOrmEntity)
            .set({ version: () => '"version" + 1', updatedAt: space.updatedAt })
            .where(
                'id = :id AND version = :version AND type = :type AND status = :status',
                {
                    id: space.id.value,
                    version: expectedVersion,
                    type: SpaceType.SHARED,
                    status: 'ACTIVE',
                },
            )
            .execute();

        if (result.affected !== 1) {
            throw new ConcurrentModificationError();
        }

        const updated = await manager
            .createQueryBuilder()
            .update(SpaceInvitationOrmEntity)
            .set({
                status: invitation.status,
                resolvedAt: invitation.resolvedAt,
            })
            .where(
                'id = :id AND space_id = :spaceId AND status = :pending AND expires_at > :now',
                {
                    id: invitation.id.value,
                    spaceId: space.id.value,
                    pending: InvitationStatus.PENDING,
                    now: invitation.resolvedAt,
                },
            )
            .execute();

        if (updated.affected !== 1) {
            throw new ConcurrentModificationError();
        }

        if (member) {
            const existing = await manager.find(SpaceMemberOrmEntity, {
                where: { spaceId: space.id.value, status: 'ACTIVE' },
            });
            const slot = [1, 2].find(
                (candidate) =>
                    !existing.some(
                        (existingMember) => existingMember.slot === candidate,
                    ),
            );

            if (existing.length !== 1 || slot === undefined) {
                throw new Error(
                    'Expected exactly one member before acceptance',
                );
            }

            await manager.insert(SpaceMemberOrmEntity, {
                id: member.id.value,
                spaceId: space.id.value,
                personId: member.personId.value,
                status: member.status,
                slot,
                joinedAt: member.joinedAt,
            });
        }
    }

    private transactionManager(): EntityManager {
        const manager = this.entityManagerProvider.get();

        if (!manager.queryRunner?.isTransactionActive) {
            throw new Error('Shared-space writes require a transaction');
        }

        return manager;
    }

    private requireNewInvitation(
        space: Space,
        input: NewInvitationPersistence,
    ) {
        if (
            space.type !== SpaceType.SHARED ||
            input.tokenHash.byteLength !== 32
        ) {
            throw new Error('Invalid shared-space persistence input');
        }

        const invitation = space.invitations.find((candidate) =>
            candidate.id.equals(input.invitationId),
        );

        if (!invitation || invitation.status !== InvitationStatus.PENDING) {
            throw new Error('Expected the newly issued pending invitation');
        }

        return invitation;
    }
}
