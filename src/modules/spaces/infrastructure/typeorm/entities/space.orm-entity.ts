import {
    Check,
    Column,
    Entity,
    ForeignKey,
    Index,
    PrimaryColumn,
} from 'typeorm';
import type { SpaceMemberOrmEntity } from './space-member.orm-entity.js';
import type { SpaceInvitationOrmEntity } from './space-invitation.orm-entity.js';

@Entity({ name: 'spaces' })
@Check('CHK_spaces_type', `"type" IN ('PERSONAL', 'SHARED')`)
@Check('CHK_spaces_status', `"status" IN ('ACTIVE', 'CLOSING', 'CLOSED')`)
@Check(
    'CHK_spaces_personal_rules',
    `"type" <> 'PERSONAL' OR ("personal_owner_person_id" IS NOT NULL AND "status" = 'ACTIVE')`,
)
@Check(
    'CHK_spaces_variant',
    `(
        "type" = 'PERSONAL'
        AND "personal_owner_person_id" IS NOT NULL
        AND "status" = 'ACTIVE'
        AND "name" IS NULL
        AND "created_by_person_id" IS NULL
    ) OR (
        "type" = 'SHARED'
        AND "personal_owner_person_id" IS NULL
        AND "name" IS NOT NULL
        AND length(btrim("name")) > 0
        AND "created_by_person_id" IS NOT NULL
    )`,
)
@Check('CHK_spaces_version', `"version" >= 1`)
@Index('UQ_spaces_personal_owner', ['personalOwnerPersonId'], {
    unique: true,
    where: `"type" = 'PERSONAL'`,
})
export class SpaceOrmEntity {
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Column({ type: 'varchar', length: 16 })
    type!: string;

    @Column({ type: 'varchar', length: 16 })
    status!: string;

    @Column({
        name: 'personal_owner_person_id',
        type: 'uuid',
        nullable: true,
    })
    @ForeignKey('persons', 'id', {
        name: 'FK_spaces_personal_owner',
        onDelete: 'RESTRICT',
    })
    personalOwnerPersonId!: string | null;

    @Column({ type: 'varchar', length: 80, nullable: true })
    name!: string | null;

    @Column({
        name: 'created_by_person_id',
        type: 'uuid',
        nullable: true,
    })
    @ForeignKey('persons', 'id', {
        name: 'FK_spaces_creator',
        onDelete: 'RESTRICT',
    })
    createdByPersonId!: string | null;

    @Column({ type: 'integer', default: 1 })
    version!: number;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    members?: SpaceMemberOrmEntity[];
    invitations?: SpaceInvitationOrmEntity[];
}
