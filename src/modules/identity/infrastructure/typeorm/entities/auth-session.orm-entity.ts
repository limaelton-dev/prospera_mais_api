import { Column, Entity, ForeignKey, Index, PrimaryColumn } from "typeorm";
// UNIQUE(token_hash)
// INDEX(person_id)
// INDEX(expires_at)
@Entity({ name: 'auth_sessions '})
@Index(
    'UQ_auth_sessions_token_hash',
    ['tokenHash'],
    { unique: true }
)
@Index(
    'IDX_auth_sessions_person_id',
    ['person_id'],
)
@Index(
    'IDX_auth_sessions_expires_at',
    ['expiresAt']
)
export class AuthSessionOrmEntity {
    @PrimaryColumn({ type: 'uuid'})
    id!: string;

    @ForeignKey('persons', {
        name: 'FK_auth_sessions_person',
        onDelete: 'CASCADE',
    })
    personId!: string;

    @Column({ name: 'token_hash', type: 'bytea' })
    tokenHash!: Buffer;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}