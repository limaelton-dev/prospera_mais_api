import { Column, Entity, ForeignKey, Index, PrimaryColumn } from "typeorm";

@Entity({ name: 'auth_credentials' })
@Index(
    'UQ_auth_credentials_email',
    ['email'],
    { unique: true },
)
export class AuthCredentialOrmEntity {
    @PrimaryColumn({
        name: 'person_id',
        type: 'uuid'
    })
    @ForeignKey('persons', {
        name: 'FK_auth_credentials_person',
        onDelete: 'RESTRICT',
    })
    personId!: string;

    @Column({ type: 'varchar', length: 254 })
    email!: string;

    @Column({
        name: 'password_hash',
        type: 'text',
    })
    passwordHash!: string;

    @Column({ name: 'created_at', type: 'timestamptz'})
    createdAt!: Date;

    @Column({ name: 'updated_at', type: 'timestamptz'})
    updatedAt!: Date;
}