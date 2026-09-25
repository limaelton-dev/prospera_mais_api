import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'persons' })
export class PersonOrmEntity {
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Column({ name: 'display_name', type: 'varchar', length: 80 })
    displayName!: string;

    @Column({ type: 'integer', default: 1 })
    version!: number;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}
