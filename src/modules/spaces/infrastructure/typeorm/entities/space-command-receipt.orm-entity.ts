import { Check, Column, Entity, ForeignKey, PrimaryColumn } from 'typeorm';

@Entity({ name: 'space_command_receipts' })
@ForeignKey(
    'space_invitations',
    ['resultInvitationId', 'resultSpaceId'],
    ['id', 'spaceId'],
    {
        name: 'FK_space_command_receipts_result',
        onDelete: 'RESTRICT',
    },
)
@Check(
    'CHK_space_command_receipts_operation',
    `"operation" IN ('CREATE_SPACE', 'ISSUE_INVITATION', 'REPLACE_INVITATION', 'RESPOND_INVITATION')`,
)
@Check('CHK_space_command_receipts_hash', `octet_length("request_hash") = 32`)
export class SpaceCommandReceiptOrmEntity {
    @PrimaryColumn({
        name: 'actor_id',
        type: 'uuid',
        primaryKeyConstraintName: 'PK_space_command_receipts',
    })
    @ForeignKey('persons', 'id', {
        name: 'FK_space_command_receipts_actor',
        onDelete: 'RESTRICT',
    })
    actorId!: string;

    @PrimaryColumn({
        type: 'varchar',
        length: 32,
        primaryKeyConstraintName: 'PK_space_command_receipts',
    })
    operation!: string;

    @PrimaryColumn({
        type: 'uuid',
        primaryKeyConstraintName: 'PK_space_command_receipts',
    })
    key!: string;

    @Column({ name: 'request_hash', type: 'bytea' })
    requestHash!: Buffer;

    @Column({ name: 'result_space_id', type: 'uuid' })
    resultSpaceId!: string;

    @Column({ name: 'result_invitation_id', type: 'uuid' })
    resultInvitationId!: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}
