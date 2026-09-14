import { Column, Entity, ForeignKey, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_sessions' })
@Index('UQ_auth_sessions_token_hash', ['tokenHash'], { unique: true })
@Index('IDX_auth_sessions_person_id', ['personId'])
@Index('IDX_auth_sessions_expires_at', ['expiresAt'])
export class AuthSessionOrmEntity {
    @PrimaryColumn({
        type: 'uuid',
    })
    id!: string;

    @Column({
        name: 'person_id',
        type: 'uuid',
    })
    @ForeignKey('persons', 'id', {
        name: 'FK_auth_sessions_person',
        onDelete: 'CASCADE',
    })
    personId!: string;

    @Column({
        name: 'token_hash',
        type: 'bytea',
    })
    tokenHash!: Buffer;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
    })
    expiresAt!: Date;

    @Column({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt!: Date;
}
